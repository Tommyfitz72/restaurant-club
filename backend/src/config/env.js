import dotenv from 'dotenv';

dotenv.config();

const toBool = (value, fallback = false) => {
  if (value === undefined) return fallback;
  return String(value).toLowerCase() === 'true';
};

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL,
  useMockProviders: toBool(process.env.USE_MOCK_PROVIDERS, true),
  scanIntervalMinutes: Number(process.env.SCAN_INTERVAL_MINUTES || 20),
  maxProviderConcurrency: Number(process.env.MAX_PROVIDER_CONCURRENCY || 2),
  openTableApiBase: process.env.OPENTABLE_API_BASE || 'https://www.opentable.com',
  openTableApiKey: process.env.OPENTABLE_API_KEY || '',
  resyApiBase: process.env.RESY_API_BASE || 'https://api.resy.com',
  resyApiKey: process.env.RESY_API_KEY || ''
};

if (!env.databaseUrl) {
  throw new Error('DATABASE_URL is required.');
}
