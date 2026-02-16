import axios from 'axios';
import { env } from '../config/env.js';
import { prisma } from './db.js';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const BOSTON_QUERY_TERMS = [
  'restaurants in Boston MA',
  'best restaurants in Boston MA',
  'North End Boston restaurants',
  'Back Bay Boston restaurants',
  'South End Boston restaurants',
  'Seaport Boston restaurants',
  'Fenway Boston restaurants',
  'Downtown Boston restaurants',
  'Beacon Hill Boston restaurants',
  'Dorchester Boston restaurants',
  'Allston Boston restaurants',
  'Jamaica Plain Boston restaurants',
  'Italian restaurants Boston',
  'Japanese restaurants Boston',
  'Chinese restaurants Boston',
  'Thai restaurants Boston',
  'Seafood restaurants Boston',
  'Mexican restaurants Boston',
  'Mediterranean restaurants Boston',
  'Steakhouse Boston'
];

const mapCuisine = (types = []) => {
  const joined = types.join(' ').toLowerCase();
  if (joined.includes('italian')) return 'Italian';
  if (joined.includes('japanese') || joined.includes('sushi')) return 'Japanese';
  if (joined.includes('french')) return 'French';
  if (joined.includes('mexican')) return 'Mexican';
  if (joined.includes('thai')) return 'Thai';
  if (joined.includes('chinese')) return 'Chinese';
  if (joined.includes('mediterranean')) return 'Mediterranean';
  if (joined.includes('steak')) return 'Steakhouse';
  if (joined.includes('seafood')) return 'Seafood';
  if (joined.includes('american')) return 'American';
  if (joined.includes('indian')) return 'Indian';
  if (joined.includes('korean')) return 'Korean';
  if (joined.includes('spanish')) return 'Spanish';
  return 'American';
};

const pickNeighborhood = (address = '') => {
  const match = String(address).split(',').map((part) => part.trim())[1];
  return match || 'Boston';
};

const toGooglePhotoUrl = (place) => {
  const photoRef = place?.photos?.[0]?.photo_reference;
  if (!photoRef || !env.googlePlacesApiKey) return null;
  return `${env.googlePlacesApiBase}/photo?maxwidth=800&photo_reference=${encodeURIComponent(photoRef)}&key=${encodeURIComponent(env.googlePlacesApiKey)}`;
};

const toRestaurantRecord = (place) => {
  const address = place.formatted_address || 'Boston, MA';
  const imageUrl =
    toGooglePhotoUrl(place) ||
    'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80';

  return {
    name: place.name,
    cuisineType: mapCuisine(place.types),
    city: 'Boston',
    neighborhood: pickNeighborhood(address),
    address,
    priceRange: Number.isFinite(place.price_level) ? Math.max(1, Math.min(4, place.price_level)) : 2,
    imageUrl,
    bookingLinks: {
      google: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`,
      direct: `https://www.google.com/search?q=${encodeURIComponent(`${place.name} Boston reservations`)}`,
      opentable: `https://www.opentable.com/s/?term=${encodeURIComponent(place.name)}`,
      resy: `https://resy.com/cities/bos?query=${encodeURIComponent(place.name)}`
    }
  };
};

const fetchGooglePage = async (query, pageToken) => {
  const response = await axios.get(`${env.googlePlacesApiBase}/textsearch/json`, {
    params: {
      query,
      key: env.googlePlacesApiKey,
      pagetoken: pageToken || undefined
    },
    timeout: 12000
  });

  return response.data || {};
};

const loadGooglePlacesForQuery = async (query) => {
  const all = [];
  let pageToken = null;

  for (let page = 0; page < 3; page += 1) {
    if (page > 0 && !pageToken) break;
    if (page > 0) await wait(2100);

    const payload = await fetchGooglePage(query, pageToken);
    const results = payload.results || [];

    const bostonOnly = results.filter((place) => {
      const address = String(place.formatted_address || '').toLowerCase();
      return address.includes('boston');
    });

    all.push(...bostonOnly);
    pageToken = payload.next_page_token || null;
  }

  return all;
};

export const syncGoogleBostonRestaurants = async ({ targetCount = 300 } = {}) => {
  if (!env.googlePlacesApiKey) {
    return { insertedOrUpdated: 0, totalBostonRestaurants: 0, reason: 'GOOGLE_PLACES_API_KEY missing' };
  }

  const deduped = new Map();

  for (const query of BOSTON_QUERY_TERMS) {
    try {
      const results = await loadGooglePlacesForQuery(query);
      for (const place of results) {
        if (!place.place_id || !place.name) continue;
        deduped.set(place.place_id, place);
      }

      if (deduped.size >= targetCount) break;
    } catch (error) {
      console.warn(`[google-sync] query failed "${query}":`, error.message);
    }
  }

  let insertedOrUpdated = 0;
  for (const place of deduped.values()) {
    const record = toRestaurantRecord(place);
    await prisma.restaurant.upsert({
      where: { name_city: { name: record.name, city: 'Boston' } },
      create: record,
      update: record
    });
    insertedOrUpdated += 1;
  }

  const totalBostonRestaurants = await prisma.restaurant.count({ where: { city: 'Boston' } });
  return { insertedOrUpdated, totalBostonRestaurants };
};

export const ensureGoogleRestaurantCoverage = async ({ minCount = 250 } = {}) => {
  if (!env.googlePlacesApiKey) return;
  const currentCount = await prisma.restaurant.count({ where: { city: 'Boston' } });
  if (currentCount >= minCount) return;

  const result = await syncGoogleBostonRestaurants({ targetCount: minCount });
  console.log(
    `[google-sync] inserted/updated=${result.insertedOrUpdated}, totalBostonRestaurants=${result.totalBostonRestaurants}`
  );
};
