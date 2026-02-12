import Redis from 'ioredis';
import { env } from '../config/env.js';

const memoryStore = new Map();

let redis = null;
if (env.redisUrl) {
  const client = new Redis(env.redisUrl, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    retryStrategy: () => null
  });

  client.on('error', (error) => {
    console.warn('[cache] Redis unavailable, falling back to memory cache:', error.message);
  });

  client
    .connect()
    .then(() => {
      redis = client;
    })
    .catch(() => {
      redis = null;
    });
}

export const cache = {
  async get(key) {
    if (redis) {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    }
    return memoryStore.get(key) ?? null;
  },
  async set(key, value, ttlSeconds = 60) {
    if (redis) {
      await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
      return;
    }
    memoryStore.set(key, value);
    setTimeout(() => memoryStore.delete(key), ttlSeconds * 1000).unref();
  }
};
