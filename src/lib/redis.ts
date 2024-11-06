import { Redis } from 'ioredis';
import { logger } from './logger';

class RedisClient {
  private client: Redis;

  constructor() {
    this.client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      lazyConnect: true,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.client.on('connect', () => logger.info('Redis client connected'));
    this.client.on('error', (error: Error) => logger.error('Redis client error:', error));
    this.client.on('ready', () => logger.info('Redis client ready'));
    this.client.on('close', () => logger.warn('Redis client disconnected'));
    this.client.on('reconnecting', (delay: number) => logger.info(`Redis client reconnecting in ${delay}ms`));
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error) {
      logger.error('Redis GET failed:', error as Error);
      return null;
    }
  }

  async set(
key: string, value: string, p0: string, ttl?: number  ): Promise<'OK' | null> {
    try {
      if (ttl) {
        return await this.client.set(key, value, 'EX', ttl);
      }
      return await this.client.set(key, value);
    } catch (error) {
      logger.error('Redis SET failed:', error as Error);
      return null;
    }
  }

  async del(key: string): Promise<number> {
    try {
      return await this.client.del(key);
    } catch (error) {
      logger.error('Redis DEL failed:', error as Error);
      return 0;
    }
  }

  async exists(key: string): Promise<number> {
    try {
      return await this.client.exists(key);
    } catch (error) {
      logger.error('Redis EXISTS failed:', error as Error);
      return 0;
    }
  }

  async flushdb(): Promise<'OK'> {
    try {
      return await this.client.flushdb();
    } catch (error) {
      logger.error('Redis FLUSHDB failed:', error as Error);
      throw new Error('FLUSHDB failed');
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.client.quit();
      logger.info('Redis client disconnected successfully');
    } catch (error) {
      logger.error('Redis disconnect failed:', error as Error);
    }
  }
}

// Create and export a singleton instance
export const redis = new RedisClient();