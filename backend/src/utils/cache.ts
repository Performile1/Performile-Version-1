import redisClient from '../config/redis';
import logger from './logger';

export class CacheManager {
  private defaultTTL = 3600; // 1 hour

  async get<T>(key: string): Promise<T | null> {
    try {
      const client = redisClient.getClient();
      const data = await client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Cache get error', { key, error });
      return null;
    }
  }

  async set(key: string, value: any, ttl: number = this.defaultTTL): Promise<boolean> {
    try {
      const client = redisClient.getClient();
      await client.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error('Cache set error', { key, error });
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    try {
      const client = redisClient.getClient();
      await client.del(key);
      return true;
    } catch (error) {
      logger.error('Cache delete error', { key, error });
      return false;
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const client = redisClient.getClient();
      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await client.del(keys);
      }
    } catch (error) {
      logger.error('Cache pattern invalidation error', { pattern, error });
    }
  }

  // TrustScore specific caching
  async getTrustScore(courierId: string): Promise<any | null> {
    return this.get(`trustscore:${courierId}`);
  }

  async setTrustScore(courierId: string, data: any): Promise<boolean> {
    return this.set(`trustscore:${courierId}`, data, 7200); // 2 hours
  }

  async invalidateTrustScores(): Promise<void> {
    await this.invalidatePattern('trustscore:*');
  }
}

export const cacheManager = new CacheManager();
