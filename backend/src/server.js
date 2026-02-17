import { app } from './app.js';
import { env } from './config/env.js';
import { prisma } from './services/db.js';
import { startScannerJob } from './jobs/scannerJob.js';
import { startIntelligenceIngestionJob } from './jobs/intelligenceIngestionJob.js';

const port = Number(process.env.PORT) || 4000;
const host = '0.0.0.0';

app.listen(port, host, () => {
  console.log(`Backend API listening on http://${host}:${port}`);

  // Start background jobs after HTTP server is already bound.
  (async () => {
    try {
      if (env.enableReservationScanner) {
        await startScannerJob();
      } else {
        console.log('[scanner] disabled (recommendation-only mode)');
      }

      if (env.enableIntelligenceIngestion) {
        await startIntelligenceIngestionJob();
      } else {
        console.log('[intelligence] ingestion scheduler disabled');
      }
    } catch (error) {
      console.error('Background job startup failed', error);
    }
  })();
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
