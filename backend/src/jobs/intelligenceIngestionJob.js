import cron from 'node-cron';
import { env } from '../config/env.js';
import { runIntelligenceIngestion } from '../services/intelligenceIngestionService.js';

const clampHours = (value) => {
  const hours = Number(value || 24);
  if (!Number.isFinite(hours)) return 24;
  return Math.max(1, Math.min(168, Math.floor(hours)));
};

export const startIntelligenceIngestionJob = async () => {
  await runIntelligenceIngestion({ mode: env.intelligenceIngestionMode }).catch((error) => {
    console.error('[intelligence] initial ingestion failed', error.message);
  });

  const intervalHours = clampHours(env.intelligenceIngestionIntervalHours);
  const expression = `0 */${intervalHours} * * *`;

  cron.schedule(expression, async () => {
    try {
      const result = await runIntelligenceIngestion({ mode: env.intelligenceIngestionMode });
      console.log(
        `[intelligence] ingestion complete: restaurants=${result.restaurantCount}, tags=${result.tagCount}, mode=${result.mode}`
      );
    } catch (error) {
      console.error('[intelligence] scheduled ingestion failed', error.message);
    }
  });

  console.log(`[intelligence] scheduled every ${intervalHours} hour(s)`);
};
