import { app } from './app.js';
import { env } from './config/env.js';
import { prisma } from './services/db.js';
import { startScannerJob } from './jobs/scannerJob.js';
import { startIntelligenceIngestionJob } from './jobs/intelligenceIngestionJob.js';

const start = async () => {
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

  const port = Number(process.env.PORT) || 4000;
const host = '0.0.0.0';

app.listen(port, host, () => {
  console.log(`Backend API listening on http://${host}:${port}`);
});

start().catch(async (error) => {
  console.error('Failed to start server', error);
  await prisma.$disconnect();
  process.exit(1);
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
