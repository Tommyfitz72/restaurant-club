import { prisma } from '../services/db.js';
import { RATABLE_RESTAURANT_COUNT } from '../config/constants.js';
import { getReviewSignalsForRestaurants } from '../services/reviewSignalsService.js';

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
