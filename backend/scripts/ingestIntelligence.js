import { prisma } from '../src/services/db.js';
import { runIntelligenceIngestion } from '../src/services/intelligenceIngestionService.js';
import { env } from '../src/config/env.js';

const mode = String(process.argv[2] || env.intelligenceIngestionMode || 'safe');

runIntelligenceIngestion({ mode })
  .then((result) => {
    console.log(
      `Intelligence ingestion complete: runId=${result.runId}, mode=${result.mode}, restaurants=${result.restaurantCount}, tags=${result.tagCount}`
    );
  })
  .catch((error) => {
    console.error('Intelligence ingestion failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
