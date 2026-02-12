import { cache } from './cache.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const hash = (text) => {
  let result = 0;
  for (let i = 0; i < text.length; i += 1) {
    result = (result * 31 + text.charCodeAt(i)) % 100000;
  }
  return result;
};

const mockRatingsForRestaurant = (restaurant) => {
  const base = hash(`${restaurant.name}-${restaurant.city}`);
  const resy = 3.8 + ((base % 12) / 10);
  const openTable = 3.7 + (((base >> 1) % 13) / 10);
  const google = 3.9 + (((base >> 2) % 10) / 10);
  const community = 3.6 + (((base >> 3) % 14) / 10);

  const sources = {
    resy: clamp(Number(resy.toFixed(1)), 3.4, 5),
    opentable: clamp(Number(openTable.toFixed(1)), 3.4, 5),
    google: clamp(Number(google.toFixed(1)), 3.5, 5),
    other: clamp(Number(community.toFixed(1)), 3.2, 5)
  };

  const weighted =
    sources.resy * 0.3 + sources.opentable * 0.3 + sources.google * 0.3 + sources.other * 0.1;

  return {
    sources,
    aggregate: Number(weighted.toFixed(2)),
    reviewCount: 120 + (base % 1400)
  };
};

export const getReviewSignals = async (restaurant) => {
  const cacheKey = `review-signals:${restaurant.name}:${restaurant.city}`;
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  const signals = mockRatingsForRestaurant(restaurant);
  await cache.set(cacheKey, signals, 60 * 60 * 24);
  return signals;
};

export const getReviewSignalsForRestaurants = async (restaurants) => {
  const entries = await Promise.all(
    restaurants.map(async (restaurant) => [restaurant.id, await getReviewSignals(restaurant)])
  );

  return new Map(entries);
};
