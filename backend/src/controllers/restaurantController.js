import { prisma } from '../services/db.js';

export const getPopularRestaurants = async (req, res, next) => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      orderBy: [{ city: 'asc' }, { name: 'asc' }],
      take: 20
    });

    res.json(restaurants);
  } catch (error) {
    next(error);
  }
};

export const getNeighborhoods = async (req, res, next) => {
  try {
    const restaurants = await prisma.restaurant.findMany({
      select: { neighborhood: true },
      distinct: ['neighborhood']
    });

    res.json(restaurants.map((item) => item.neighborhood).sort());
  } catch (error) {
    next(error);
  }
};
