import { Request, Response, NextFunction } from 'express';
import { getCache, setCache, delCache } from '../config/redis';

export const cacheMiddleware = (ttlSeconds: number = 30) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = `cache:${req.originalUrl || req.url}`;

    try {
      const cachedResponse = await getCache(key);
      if (cachedResponse) {
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Engine', 'Redis/In-Memory Fast Store');
        return res.status(200).json(cachedResponse);
      }

      // Intercept res.json
      res.setHeader('X-Cache', 'MISS');
      const originalJson = res.json.bind(res);

      res.json = (body: any) => {
        // Cache only successful 200 responses
        if (res.statusCode === 200 && body && body.success !== false) {
          setCache(key, body, ttlSeconds).catch(() => {});
        }
        return originalJson(body);
      };

      next();
    } catch (err) {
      next();
    }
  };
};

export const invalidateCache = (prefixes: string[]) => {
  return async (_req: Request, _res: Response, next: NextFunction) => {
    try {
      for (const prefix of prefixes) {
        await delCache(`cache:${prefix}*`);
      }
    } catch (err) {
      console.warn('Cache invalidation error:', err);
    }
    next();
  };
};
