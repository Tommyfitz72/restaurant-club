import cron from 'node-cron';
import { env } from '../config/env.js';
import { runScanCycle } from '../services/scannerService.js';
import { ensureGoogleRestaurantCoverage } from '../services/googleRestaurantSyncService.js';

export const startScannerJob = async () => {
  // Keep a large Boston restaurant catalog in sync for rating/search/recommendation scope.
  await ensureGoogleRestaurantCoverage({ minCount: env.googleRestaurantTargetCount }).catch((error) => {
    console.error('[google-sync] startup sync failed', error.message);
  });

  // Prime initial reservation availability on startup.
  await runScanCycle().catch((error) => {
    console.error('[scanner] initial cycle failed', error.message);
  });

  const expression = `*/${env.scanIntervalMinutes} * * * *`;
  cron.schedule(expression, async () => {
    try {
      await ensureGoogleRestaurantCoverage({ minCount: env.googleRestaurantTargetCount });
      const result = await runScanCycle();
      console.log(`[scanner] cycle complete: ${result.slotsSaved} slots saved`);
    } catch (error) {
      console.error('[scanner] scheduled cycle failed', error.message);
    }
  });

  console.log(`[scanner] scheduled with ${env.scanIntervalMinutes}-minute interval`);
};
