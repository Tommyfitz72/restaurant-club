import axios from 'axios';
import { prisma } from '../services/db.js';
import { RATABLE_RESTAURANT_COUNT } from '../config/constants.js';
import { getReviewSignalsForRestaurants } from '../services/reviewSignalsService.js';
import { env } from '../config/env.js';

export const getPopularRestaurants = async (req, res, next) => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      where: { city: { in: ['Boston', 'Cambridge'] } }
    });

    const signals = await getReviewSignalsForRestaurants(restaurants);

    const ranked = restaurants
      .map((restaurant) => {
        const reviewSignals = signals.get(restaurant.id);
        return {
          ...restaurant,
          reviewSignals
        };
      })
      .sort((a, b) => {
        const aScore = a.reviewSignals?.aggregate || 0;
        const bScore = b.reviewSignals?.aggregate || 0;
        const aCount = a.reviewSignals?.reviewCount || 0;
        const bCount = b.reviewSignals?.reviewCount || 0;
        return bScore - aScore || bCount - aCount;
      })
      .slice(0, RATABLE_RESTAURANT_COUNT);

    res.json(ranked);
  } catch (error) {
    next(error);
  }
};

export const getNeighborhoods = async (req, res, next) => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      where: { city: { in: ['Boston', 'Cambridge'] } },
      select: { neighborhood: true },
      distinct: ['neighborhood']
    });

    res.json(restaurants.map((item) => item.neighborhood).sort());
  } catch (error) {
    next(error);
  }
};

const searchGooglePlaces = async (q) => {
  if (!env.googlePlacesApiKey) return [];

  const response = await axios.get(`${env.googlePlacesApiBase}/textsearch/json`, {
    params: {
      query: `${q} restaurant Boston Cambridge`,
      key: env.googlePlacesApiKey
    },
    timeout: 8000
  });

  const rows = response.data?.results || [];
  return rows
    .filter((item) => {
      const addr = String(item.formatted_address || '').toLowerCase();
      return addr.includes('boston') || addr.includes('cambridge');
    })
    .slice(0, 20)
    .map((item) => ({
      id: `google:${item.place_id}`,
      name: item.name,
      cuisineType: 'Restaurant',
      city: String(item.formatted_address || '').includes('Cambridge') ? 'Cambridge' : 'Boston',
      neighborhood: 'Boston area',
      address: item.formatted_address || '',
      priceRange: Number(item.price_level || 2),
      imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
      bookingLinks: {
        google: `https://www.google.com/maps/place/?q=place_id:${item.place_id}`
      },
      reviewSignals: {
        aggregate: Number(item.rating || 0),
        reviewCount: Number(item.user_ratings_total || 0),
        sources: {
          google: Number(item.rating || 0),
          resy: 0,
          opentable: 0,
          other: 0
        }
      },
      source: 'google'
    }));
};

export const searchRestaurants = async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();

    if (!q) {
      return res.json([]);
    }

    const matches = await prisma.restaurant.findMany({
      where: {
        city: { in: ['Boston', 'Cambridge'] },
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { cuisineType: { contains: q, mode: 'insensitive' } },
          { neighborhood: { contains: q, mode: 'insensitive' } }
        ]
      },
      take: 40,
      orderBy: [{ city: 'asc' }, { name: 'asc' }]
    });

    const signals = await getReviewSignalsForRestaurants(matches);

    const dbResults = matches.map((item) => ({
      ...item,
      reviewSignals: signals.get(item.id),
      source: 'database'
    }));

    let googleResults = [];
    try {
      googleResults = await searchGooglePlaces(q);
    } catch (error) {
      console.warn('[search] Google places search failed:', error.message);
    }

    res.json([...dbResults, ...googleResults]);
  } catch (error) {
    next(error);
  }
};
