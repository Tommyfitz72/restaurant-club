import pLimit from 'p-limit';
import { env } from '../config/env.js';
import {
  CANCELLATION_MIN_LEAD_HOURS,
  RESERVATION_LOOKAHEAD_HOURS,
  SUPPORTED_CITIES
} from '../config/constants.js';
import { prisma } from './db.js';
import { cache } from './cache.js';
import { OpenTableProvider } from './providers/openTableProvider.js';
import { ResyProvider } from './providers/resyProvider.js';
import { GoogleProvider } from './providers/googleProvider.js';
import { directProvider } from './providers/directProvider.js';
import { mockProvider } from './providers/mockProvider.js';

const limit = pLimit(env.maxProviderConcurrency);

const REAL_SLOT_PROVIDERS = new Set(['OPENTABLE', 'RESY']);
const PROVIDER_HOST_RULES = {
  OPENTABLE: ['opentable.com'],
  RESY: ['resy.com']
};

const buildSlotKey = (slot) => `${slot.provider}:${slot.externalSlotId}:${slot.partySize}`;

const withinLookahead = (startsAt) => {
  const now = Date.now();
  const start = new Date(startsAt).getTime();
  const diffHours = (start - now) / (60 * 60 * 1000);
  return Number.isFinite(start) && diffHours >= 0 && diffHours <= RESERVATION_LOOKAHEAD_HOURS;
};

const isPotentialCancellationOpening = (startsAt) => {
  const now = Date.now();
  const start = new Date(startsAt).getTime();
  const diffHours = (start - now) / (60 * 60 * 1000);
  return diffHours >= CANCELLATION_MIN_LEAD_HOURS && diffHours <= RESERVATION_LOOKAHEAD_HOURS;
};

const safeUrl = (value) => {
  try {
    return new URL(String(value));
  } catch {
    return null;
  }
};

const providerLinkForRestaurant = (restaurant, provider) => {
  const links = restaurant?.bookingLinks || {};
  return links[String(provider).toLowerCase()] || links.direct || null;
};

const isAllowedBookingUrl = (provider, bookingUrl) => {
  const parsed = safeUrl(bookingUrl);
  if (!parsed) return false;

  const host = parsed.hostname.toLowerCase();
  const rules = PROVIDER_HOST_RULES[provider] || [];

  return rules.some((suffix) => host === suffix || host.endsWith(`.${suffix}`));
};

const normalizeRealSlots = (rawSlots, restaurantsById) => {
  const normalized = [];

  for (const raw of rawSlots) {
    if (!REAL_SLOT_PROVIDERS.has(raw.provider)) continue;

    const restaurant = restaurantsById.get(raw.restaurantId);
    if (!restaurant) continue;

    const startsAt = new Date(raw.startsAt);
    if (!withinLookahead(startsAt)) continue;

    const bookingUrl = raw.bookingUrl || providerLinkForRestaurant(restaurant, raw.provider);
    if (!bookingUrl) continue;

    if (env.requireRealBookingUrls && !isAllowedBookingUrl(raw.provider, bookingUrl)) {
      continue;
    }

    normalized.push({
      ...raw,
      startsAt,
      bookingUrl
    });
  }

  return normalized;
};

const upsertSlot = async (slot) => {
  await prisma.reservationSlot.upsert({
    where: {
      provider_externalSlotId_partySize: {
        provider: slot.provider,
        externalSlotId: slot.externalSlotId,
        partySize: slot.partySize
      }
    },
    create: {
      provider: slot.provider,
      externalSlotId: slot.externalSlotId,
      restaurantId: slot.restaurantId,
      startsAt: slot.startsAt,
      partySize: slot.partySize,
      bookingUrl: slot.bookingUrl,
      available: true,
      scannedAt: new Date()
    },
    update: {
      startsAt: slot.startsAt,
      bookingUrl: slot.bookingUrl,
      available: true,
      scannedAt: new Date()
    }
  });
};

const fetchProviderBundles = (restaurants) => {
  if (env.useMockProviders) {
    return [
      { label: 'OPENTABLE', fetch: () => mockProvider.fetchReservations(restaurants, 'OPENTABLE') },
      { label: 'RESY', fetch: () => mockProvider.fetchReservations(restaurants, 'RESY') }
    ];
  }

  const bundles = [];

  if (env.openTableApiKey) {
    bundles.push({
      label: 'OPENTABLE',
      fetch: () =>
        new OpenTableProvider({
          baseUrl: env.openTableApiBase,
          apiKey: env.openTableApiKey
        }).fetchReservations(restaurants)
    });
  } else {
    console.warn('[scanner] OPENTABLE_API_KEY is missing; skipping OpenTable slot scanning');
  }

  if (env.resyApiKey) {
    bundles.push({
      label: 'RESY',
      fetch: () =>
        new ResyProvider({
          baseUrl: env.resyApiBase,
          apiKey: env.resyApiKey
        }).fetchReservations(restaurants)
    });
  } else {
    console.warn('[scanner] RESY_API_KEY is missing; skipping Resy slot scanning');
  }

  // Google and direct providers are not treated as reservation-slot sources here.
  // They can be used for enrichment/search elsewhere.
  if (env.googlePlacesApiKey) {
    bundles.push({
      label: 'GOOGLE_ENRICH_ONLY',
      fetch: () => new GoogleProvider({ baseUrl: env.googlePlacesApiBase, apiKey: env.googlePlacesApiKey }).fetchReservations([])
    });
  }

  bundles.push({ label: 'DIRECT_ENRICH_ONLY', fetch: () => directProvider.fetchReservations([]) });

  return bundles;
};

const saveRecentOpenings = async (openings) => {
  const existing = (await cache.get('scanner:recentOpenings')) || [];
  const merged = [...openings, ...existing].slice(0, 300);
  await cache.set('scanner:recentOpenings', merged, 60 * 60 * 24);
};

export const getRecentOpenings = async () => (await cache.get('scanner:recentOpenings')) || [];

export const runScanCycle = async () => {
  const restaurants = await prisma.restaurant.findMany({
    where: { city: { in: SUPPORTED_CITIES } }
  });

  if (!restaurants.length) return { slotsSaved: 0, newOpenings: 0 };

  const restaurantsById = new Map(restaurants.map((item) => [item.id, item]));

  const existingSlots = await prisma.reservationSlot.findMany({
    where: {
      available: true,
      startsAt: {
        gte: new Date(),
        lte: new Date(Date.now() + RESERVATION_LOOKAHEAD_HOURS * 60 * 60 * 1000)
      }
    },
    select: {
      provider: true,
      externalSlotId: true,
      partySize: true
    }
  });

  const existingKeys = new Set(existingSlots.map((slot) => buildSlotKey(slot)));
  if (!env.useMockProviders && env.replaceFutureSlotsEachScan) {
    await prisma.reservationSlot.updateMany({
      where: {
        startsAt: {
          gte: new Date(),
          lte: new Date(Date.now() + RESERVATION_LOOKAHEAD_HOURS * 60 * 60 * 1000)
        }
      },
      data: { available: false }
    });
  }

  const providers = fetchProviderBundles(restaurants);

  const results = await Promise.all(
    providers.map((provider) =>
      limit(async () => {
        try {
          return await provider.fetch();
        } catch (error) {
          console.warn(`[scanner] ${provider.label} provider failed:`, error.message);
          return [];
        }
      })
    )
  );

  const realSlots = normalizeRealSlots(results.flat(), restaurantsById);
  const potentialOpenings = [];

  for (const slot of realSlots) {
    const key = buildSlotKey(slot);
    if (!existingKeys.has(key) && isPotentialCancellationOpening(slot.startsAt)) {
      const restaurant = restaurantsById.get(slot.restaurantId);
      potentialOpenings.push({
        detectedAt: new Date().toISOString(),
        restaurantId: slot.restaurantId,
        restaurantName: restaurant?.name || 'Unknown restaurant',
        startsAt: slot.startsAt,
        partySize: slot.partySize,
        provider: slot.provider,
        bookingUrl: slot.bookingUrl,
        reason: 'Newly opened slot detected in the next 48 hours (possible cancellation).'
      });
    }

    await limit(() => upsertSlot(slot));
  }

  await saveRecentOpenings(potentialOpenings);
  await cache.set(
    'scanner:lastRun',
    {
      ranAt: new Date().toISOString(),
      slotsSaved: realSlots.length,
      potentialCancellationOpenings: potentialOpenings.length
    },
    3600
  );

  return { slotsSaved: realSlots.length, newOpenings: potentialOpenings.length };
};
