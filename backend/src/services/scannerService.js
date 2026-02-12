import pLimit from 'p-limit';
import { env } from '../config/env.js';
import { prisma } from './db.js';
import { cache } from './cache.js';
import { OpenTableProvider } from './providers/openTableProvider.js';
import { ResyProvider } from './providers/resyProvider.js';
import { mockProvider } from './providers/mockProvider.js';

const limit = pLimit(env.maxProviderConcurrency);

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

export const runScanCycle = async () => {
  const restaurants = await prisma.restaurant.findMany();
  if (!restaurants.length) return { slotsSaved: 0 };

  const providers = env.useMockProviders
    ? [
        { label: 'OPENTABLE', fetch: () => mockProvider.fetchReservations(restaurants, 'OPENTABLE') },
        { label: 'RESY', fetch: () => mockProvider.fetchReservations(restaurants, 'RESY') }
      ]
    : [
        {
          label: 'OPENTABLE',
          fetch: () =>
            new OpenTableProvider({
              baseUrl: env.openTableApiBase,
              apiKey: env.openTableApiKey
            }).fetchReservations(restaurants)
        },
        {
          label: 'RESY',
          fetch: () =>
            new ResyProvider({
              baseUrl: env.resyApiBase,
              apiKey: env.resyApiKey
            }).fetchReservations(restaurants)
        }
      ];

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

  const allSlots = results.flat();
  await Promise.all(allSlots.map((slot) => limit(() => upsertSlot(slot))));

  await cache.set('scanner:lastRun', { ranAt: new Date().toISOString(), slotsSaved: allSlots.length }, 3600);

  return { slotsSaved: allSlots.length };
};
