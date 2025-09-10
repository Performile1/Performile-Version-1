import { createClient, RedisClientType } from 'redis';
import { RedisConfig } from '../types';
import logger from '../utils/logger';

class RedisClient {
  private client: RedisClientType;
  private static instance: RedisClient;
  private isConnected: boolean = false;

  private constructor() {
    const config = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD && process.env.REDIS_PASSWORD.trim() !== '' ? process.env.REDIS_PASSWORD : undefined,
      db: parseInt(process.env.REDIS_DB || '0'),
    };

    console.log('Redis config:', { host: config.host, port: config.port, hasPassword: !!config.password });

    const clientOptions: any = {
      socket: {
        host: config.host,
        port: config.port,
      },
      database: config.db,
    };

    if (config.password) {
      clientOptions.password = config.password;
      console.log('Redis: Using password authentication');
    } else {
      console.log('Redis: No password authentication');
    }

    this.client = createClient(clientOptions);

    this.setupEventHandlers();
  }

  public static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }

  private setupEventHandlers(): void {
    this.client.on('connect', () => {
      logger.info('Redis client connected');
      this.isConnected = true;
    });

    this.client.on('ready', () => {
      logger.info('Redis client ready');
    });

    this.client.on('error', (err) => {
      logger.error('Redis client error', err);
      this.isConnected = false;
    });

    this.client.on('end', () => {
      logger.info('Redis client disconnected');
      this.isConnected = false;
    });

    this.client.on('reconnecting', () => {
      logger.info('Redis client reconnecting');
    });
  }

  public async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.client.connect();
    }
  }

  public async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.disconnect();
    }
  }

  public getClient(): RedisClientType {
    return this.client;
  }

  public async set(key: string, value: string, ttl?: number): Promise<void> {
    try {
      if (ttl) {
        await this.client.setEx(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error) {
      logger.error('Redis SET error', { key, error });
      throw error;
    }
  }

  public async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error) {
      logger.error('Redis GET error', { key, error });
      throw error;
    }
  }

  public async del(key: string): Promise<number> {
    try {
      return await this.client.del(key);
    } catch (error) {
      logger.error('Redis DEL error', { key, error });
      throw error;
    }
  }

  public async exists(key: string): Promise<number> {
    try {
      return await this.client.exists(key);
    } catch (error) {
      logger.error('Redis EXISTS error', { key, error });
      throw error;
    }
  }

  public async expire(key: string, seconds: number): Promise<boolean> {
    try {
      return await this.client.expire(key, seconds);
    } catch (error) {
      logger.error('Redis EXPIRE error', { key, seconds, error });
      throw error;
    }
  }

  public async hSet(key: string, field: string, value: string): Promise<number> {
    try {
      return await this.client.hSet(key, field, value);
    } catch (error) {
      logger.error('Redis HSET error', { key, field, error });
      throw error;
    }
  }

  public async hGet(key: string, field: string): Promise<string | undefined> {
    try {
      return await this.client.hGet(key, field);
    } catch (error) {
      logger.error('Redis HGET error', { key, field, error });
      throw error;
    }
  }

  public async hGetAll(key: string): Promise<Record<string, string>> {
    try {
      return await this.client.hGetAll(key);
    } catch (error) {
      logger.error('Redis HGETALL error', { key, error });
      throw error;
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch (error) {
      logger.error('Redis health check failed', error);
      return false;
    }
  }

  public async flushCache(pattern?: string): Promise<void> {
    try {
      if (pattern) {
        const keys = await this.client.keys(pattern);
        if (keys.length > 0) {
          await this.client.del(keys);
        }
      } else {
        await this.client.flushDb();
      }
      logger.info('Redis cache flushed', { pattern });
    } catch (error) {
      logger.error('Redis flush cache error', { pattern, error });
      throw error;
    }
  }
}

export default RedisClient.getInstance();

