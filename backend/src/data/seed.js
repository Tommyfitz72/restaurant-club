import { prisma } from '../services/db.js';
import { popularRestaurants } from './popularRestaurants.js';

const run = async () => {
  for (const restaurant of popularRestaurants) {
    await prisma.restaurant.upsert({
      where: {
        name_city: {
          name: restaurant.name,
          city: restaurant.city
        }
      },
      create: restaurant,
      update: restaurant
    });
  }

  console.log(`Seeded ${popularRestaurants.length} restaurants.`);
};

run()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
