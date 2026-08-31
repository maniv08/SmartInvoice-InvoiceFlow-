import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

let redisClient: Redis | null = null;
let isRedisConnected = false;
let redisError: string | null = null;

// In-Memory Fast Cache Fallback
interface CacheEntry {
  value: string;
  expiresAt?: number;
}
const inMemoryCache = new Map<string, CacheEntry>();

export const initRedis = (): boolean => {
  const host = process.env.REDIS_HOST || 'localhost';
  const port = parseInt(process.env.REDIS_PORT || '6379', 10);
  const password = process.env.REDIS_PASSWORD || undefined;

  try {
    redisClient = new Redis({
      host,
      port,
      password,
      connectTimeout: 2000,
      maxRetriesPerRequest: 1,
      retryStrategy: (times) => {
        if (times > 2) {
          return null; // Stop retrying and fallback to in-memory cache
        }
        return 1000;
      },
      lazyConnect: true,
    });

    redisClient.on('connect', () => {
      isRedisConnected = true;
      redisError = null;
      console.log(`✅ Connected to Redis 7 on ${host}:${port}`);
    });

    redisClient.on('error', (err) => {
      isRedisConnected = false;
      redisError = err.message || 'Redis connection error';
      // Suppress spamming console; fallback is active
    });

    // Attempt connecting async
    redisClient.connect().catch((err) => {
      isRedisConnected = false;
      redisError = err.message || 'Redis offline';
      console.warn(`⚠️ Redis server not reached (${host}:${port}). Activated In-Memory High-Speed Cache Fallback.`);
    });

    return true;
  } catch (err: any) {
    isRedisConnected = false;
    redisError = err.message;
    console.warn(`⚠️ Redis initialization error: ${err.message}. Using In-Memory Cache.`);
    return false;
  }
};

export const getCache = async <T = any>(key: string): Promise<T | null> => {
  if (isRedisConnected && redisClient) {
    try {
      const data = await redisClient.get(key);
      if (data) return JSON.parse(data);
    } catch (err) {
      // Fallback to in-memory
    }
  }

  // In-Memory fallback lookup
  const entry = inMemoryCache.get(key);
  if (entry) {
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      inMemoryCache.delete(key);
      return null;
    }
    try {
      return JSON.parse(entry.value);
    } catch {
      return entry.value as any;
    }
  }

  return null;
};

export const setCache = async (key: string, value: any, ttlSeconds: number = 60): Promise<void> => {
  const serialized = JSON.stringify(value);

  if (isRedisConnected && redisClient) {
    try {
      if (ttlSeconds > 0) {
        await redisClient.set(key, serialized, 'EX', ttlSeconds);
      } else {
        await redisClient.set(key, serialized);
      }
    } catch (err) {
      // Fallback to in-memory
    }
  }

  // In-Memory fallback store
  inMemoryCache.set(key, {
    value: serialized,
    expiresAt: ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : undefined,
  });
};

export const delCache = async (patternOrKey: string): Promise<void> => {
  if (isRedisConnected && redisClient) {
    try {
      if (patternOrKey.includes('*')) {
        const keys = await redisClient.keys(patternOrKey);
        if (keys.length > 0) {
          await redisClient.del(...keys);
        }
      } else {
        await redisClient.del(patternOrKey);
      }
    } catch (err) {
      // Fallback
    }
  }

  // In-memory key eviction
  if (patternOrKey.includes('*')) {
    const prefix = patternOrKey.replace('*', '');
    for (const k of inMemoryCache.keys()) {
      if (k.startsWith(prefix)) {
        inMemoryCache.delete(k);
      }
    }
  } else {
    inMemoryCache.delete(patternOrKey);
  }
};

export const flushCache = async (): Promise<void> => {
  if (isRedisConnected && redisClient) {
    try {
      await redisClient.flushdb();
    } catch (err) {}
  }
  inMemoryCache.clear();
};

export const getRedisStatus = () => {
  return {
    connected: isRedisConnected,
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    cachedKeysCount: inMemoryCache.size,
    error: redisError,
    engine: isRedisConnected ? 'Redis 7 Alpine (In-Memory Key-Value & Pub/Sub Store)' : 'Redis In-Memory Engine Fallback',
  };
};

export const closeRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    isRedisConnected = false;
  }
};
