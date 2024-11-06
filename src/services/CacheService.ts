/* eslint-disable @typescript-eslint/no-explicit-any */
import { Redis } from 'ioredis';
import { prisma } from '@/lib/prisma';
import { Framework } from '@/types';
import { logger } from '@/lib/logger';
import { createHash } from 'crypto';
import { CloudflareClient } from '@/lib/cloudflare';

interface CacheConfig {
  browser: {
    static: string;
    dynamic: string;
  };
  edge: {
    ttl: number;
    staleWhileRevalidate: number;
  };
  server: {
    memory: boolean;
    redis: boolean;
  };
}

interface CacheItem {
  data: any;
  timestamp: number;
  tags: string[];
}

export class CacheService {
  private redis: Redis;
  private cloudflare: CloudflareClient;
  private memoryCache: Map<string, CacheItem>;
  private readonly defaultTTL = 3600; // 1 hour

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL!);
    this.cloudflare = new CloudflareClient(process.env.CLOUDFLARE_API_TOKEN!);
    this.memoryCache = new Map();

    // Start cache maintenance
    this.startCacheMaintenance();
  }

  async setupProjectCaching(projectId: string, framework: Framework) {
    try {
      const project = await prisma.project.findUnique({
        where: { id: projectId }
      });

      if (!project) throw new Error('Project not found');

      // Setup framework-specific caching
      const cacheConfig = this.getFrameworkCacheConfig(framework);
      await this.configureCaching(projectId, cacheConfig);

      // Setup edge caching
      await this.setupEdgeCaching(projectId);

      // Setup browser caching
      await this.setupBrowserCaching(projectId);

      // Initialize cache warmup
      await this.warmupCache(projectId);

      return true;
    } catch (error) {
      logger.error('Cache setup failed:', error);
      throw error;
    }
  }

  private getFrameworkCacheConfig(framework: Framework): CacheConfig {
    const configs = {
      NEXTJS: {
        browser: {
          static: '1y',
          dynamic: '1h'
        },
        edge: {
          ttl: 3600,
          staleWhileRevalidate: 86400
        },
        server: {
          memory: true,
          redis: true
        }
      },
      REMIX: {
        browser: {
          static: '1y',
          dynamic: '5m'
        },
        edge: {
          ttl: 300,
          staleWhileRevalidate: 3600
        },
        server: {
          memory: true,
          redis: true
        }
      },
      ASTRO: {
        browser: {
          static: '1y',
          dynamic: '1d'
        },
        edge: {
          ttl: 86400,
          staleWhileRevalidate: 172800
        },
        server: {
          memory: true,
          redis: true
        }
      }
    };

    return configs[framework];
  }

  async get(key: string, options: { 
    level?: 'memory' | 'redis' | 'edge',
    tags?: string[] 
  } = {}) {
    const { level = 'memory', tags = [] } = options;
    const cacheKey = this.generateCacheKey(key, tags);

    try {
      // Try memory cache first
      if (level === 'memory') {
        const memoryItem = this.memoryCache.get(cacheKey);
        if (memoryItem && !this.isExpired(memoryItem)) {
          return memoryItem.data;
        }
      }

      // Try Redis cache
      if (level === 'redis' || level === 'memory') {
        const redisItem = await this.redis.get(cacheKey);
        if (redisItem) {
          const parsed = JSON.parse(redisItem);
          if (!this.isExpired(parsed)) {
            // Update memory cache
            this.memoryCache.set(cacheKey, parsed);
            return parsed.data;
          }
        }
      }

      // Try edge cache
      if (level === 'edge') {
        const edgeItem = await this.cloudflare.getCache(cacheKey);
        if (edgeItem) {
          return edgeItem;
        }
      }

      return null;
    } catch (error) {
      logger.error('Cache get failed:', error);
      return null;
    }
  }

  async set(key: string, data: any, options: {
    ttl?: number,
    level?: 'memory' | 'redis' | 'edge',
    tags?: string[]
  } = {}) {
    const { ttl = this.defaultTTL, level = 'memory', tags = [] } = options;
    const cacheKey = this.generateCacheKey(key, tags);
    const item: CacheItem = {
      data,
      timestamp: Date.now(),
      tags
    };

    try {
      // Set memory cache
      if (level === 'memory') {
        this.memoryCache.set(cacheKey, item);
      }

      // Set Redis cache
      if (level === 'redis' || level === 'memory') {
        await this.redis.set(cacheKey, JSON.stringify(item), 'EX', ttl);
      }

      // Set edge cache
      if (level === 'edge') {
        await this.cloudflare.setCache(cacheKey, data, ttl);
      }

      return true;
    } catch (error) {
      logger.error('Cache set failed:', error);
      return false;
    }
  }

  async invalidate(tags: string[]) {
    try {
      // Get all keys with matching tags
      const keys = await this.getKeysByTags(tags);

      // Invalidate memory cache
      for (const key of keys) {
        this.memoryCache.delete(key);
      }

      // Invalidate Redis cache
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }

      // Invalidate edge cache
      await this.cloudflare.purgeCache(tags);

      return true;
    } catch (error) {
      logger.error('Cache invalidation failed:', error);
      return false;
    }
  }

  private async setupEdgeCaching(projectId: string) {
    const rules = [
      {
        pattern: '/_next/static/*',
        ttl: 31536000 // 1 year
      },
      {
        pattern: '/api/*',
        ttl: 0 // No cache for API routes
      },
      {
        pattern: '/*',
        ttl: 3600 // 1 hour for everything else
      }
    ];

    await this.cloudflare.setCacheRules(projectId, rules);
  }

  private async setupBrowserCaching(projectId: string) {
    const headers = {
      '/_next/static/*': {
        'Cache-Control': 'public, max-age=31536000, immutable'
      },
      '/api/*': {
        'Cache-Control': 'no-store'
      },
      '/*': {
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400'
      }
    };

    await prisma.project.update({
      where: { id: projectId },
      data: {
        cacheHeaders: headers
      }
    });
  }

  private async warmupCache(projectId: string) {
    try {
      // Get all static paths
      const paths = await this.getStaticPaths(projectId);

      // Warm up cache in parallel
      await Promise.all(
        paths.map(path => this.warmupPath(projectId, path))
      );
    } catch (error) {
      logger.error('Cache warmup failed:', error);
    }
  }

  private async warmupPath(projectId: string, path: string) {
    try {
      const response = await fetch(`https://${projectId}.yourservice.com${path}`);
      const data = await response.json();
      
      await this.set(path, data, {
        level: 'edge',
        tags: [`project:${projectId}`, `path:${path}`]
      });
    } catch (error) {
      logger.error(`Failed to warmup path ${path}:`, error);
    }
  }

  private generateCacheKey(key: string, tags: string[]): string {
    const hash = createHash('sha256')
      .update(key + tags.sort().join(','))
      .digest('hex');
    return `cache:${hash}`;
  }

  private isExpired(item: CacheItem): boolean {
    return Date.now() - item.timestamp > this.defaultTTL * 1000;
  }

  private async getKeysByTags(tags: string[]): Promise<string[]> {
    const keys = new Set<string>();
    
    // Check memory cache
    for (const [key, item] of this.memoryCache.entries()) {
      if (tags.some(tag => item.tags.includes(tag))) {
        keys.add(key);
      }
    }

    // Check Redis cache
    const redisKeys = await this.redis.keys('cache:*');
    for (const key of redisKeys) {
      const item = await this.redis.get(key);
      if (item) {
        const parsed = JSON.parse(item);
        if (tags.some(tag => parsed.tags.includes(tag))) {
          keys.add(key);
        }
      }
    }

    return Array.from(keys);
  }

  private startCacheMaintenance() {
    setInterval(() => {
      this.cleanupMemoryCache();
    }, 60000); // Run every minute
  }

  private cleanupMemoryCache() {
    for (const [key, item] of this.memoryCache.entries()) {
      if (this.isExpired(item)) {
        this.memoryCache.delete(key);
      }
    }
  }
} 