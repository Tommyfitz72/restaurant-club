import dotenv from 'dotenv';

dotenv.config();

const toBool = (value, fallback = false) => {
  if (value === undefined) return fallback;
  return String(value).toLowerCase() === 'true';
};

const parseCsv = (value, fallback = []) => {
  if (!value) return fallback;
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const singleFrontend = process.env.FRONTEND_URL || 'http://localhost:5173';
const frontendOrigins = parseCsv(process.env.FRONTEND_URLS, [singleFrontend]);

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
  frontendUrl: singleFrontend,
  frontendOrigins,
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL,
  useMockProviders: toBool(process.env.USE_MOCK_PROVIDERS, false),
  requireRealBookingUrls: toBool(process.env.REQUIRE_REAL_BOOKING_URLS, true),
  replaceFutureSlotsEachScan: toBool(process.env.REPLACE_FUTURE_SLOTS_EACH_SCAN, true),
  scanIntervalMinutes: Number(process.env.SCAN_INTERVAL_MINUTES || 20),
  maxProviderConcurrency: Number(process.env.MAX_PROVIDER_CONCURRENCY || 2),
  openTableApiBase: process.env.OPENTABLE_API_BASE || 'https://www.opentable.com',
  openTableApiKey: process.env.OPENTABLE_API_KEY || '',
  resyApiBase: process.env.RESY_API_BASE || 'https://api.resy.com',
  resyApiKey: process.env.RESY_API_KEY || '',
  googlePlacesApiBase: process.env.GOOGLE_PLACES_API_BASE || 'https://maps.googleapis.com/maps/api/place',
  googlePlacesApiKey: process.env.GOOGLE_PLACES_API_KEY || '',
  googleRestaurantTargetCount: Number(process.env.GOOGLE_RESTAURANT_TARGET_COUNT || 300)
};

if (!env.databaseUrl) {
  throw new Error('DATABASE_URL is required.');
}
