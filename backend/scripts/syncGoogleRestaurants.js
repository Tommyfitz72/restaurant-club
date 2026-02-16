import { prisma } from '../src/services/db.js';
import { syncGoogleBostonRestaurants } from '../src/services/googleRestaurantSyncService.js';
import { env } from '../src/config/env.js';

const targetCount = Number(process.argv[2] || env.googleRestaurantTargetCount || 300);

syncGoogleBostonRestaurants({ targetCount })
  .then((result) => {
    console.log(`Google sync complete: insertedOrUpdated=${result.insertedOrUpdated}, totalBostonRestaurants=${result.totalBostonRestaurants}`);
  })
  .catch((error) => {
    console.error('Google sync failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
