import cron from 'node-cron';
import { env } from '../config/env.js';
import { runScanCycle } from '../services/scannerService.js';

export const startScannerJob = async () => {
  // Prime initial reservation availability on startup.
  await runScanCycle().catch((error) => {
    console.error('[scanner] initial cycle failed', error.message);
  });

  const expression = `*/${env.scanIntervalMinutes} * * * *`;
  cron.schedule(expression, async () => {
    try {
      const result = await runScanCycle();
      console.log(`[scanner] cycle complete: ${result.slotsSaved} slots saved`);
    } catch (error) {
      console.error('[scanner] scheduled cycle failed', error.message);
    }
  });

  console.log(`[scanner] scheduled with ${env.scanIntervalMinutes}-minute interval`);
};
