import { app } from './app.js';
import { env } from './config/env.js';
import { prisma } from './services/db.js';
import { startScannerJob } from './jobs/scannerJob.js';

const start = async () => {
  if (env.enableReservationScanner) {
    await startScannerJob();
  } else {
    console.log('[scanner] disabled (recommendation-only mode)');
  }

  app.listen(env.port, () => {
    console.log(`Backend API listening on http://localhost:${env.port}`);
  });
};

start().catch(async (error) => {
  console.error('Failed to start server', error);
  await prisma.$disconnect();
  process.exit(1);
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
