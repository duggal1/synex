/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Redis } from 'ioredis';
import { prisma } from '@/lib/prisma';
import { Framework } from '@/types/index';
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
  [x: string]: any;
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

  private async configureCaching(projectId: string, cacheConfig: CacheConfig) {
    // Implement caching configuration logic
    console.log(`Configuring caching for project ${projectId} with config:`, cacheConfig);
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
      const paths = await this.getStaticPaths(projectId);

      await Promise.all(
        paths.map((path: string) => this.warmupPath(projectId, path))
      );
    } catch (error) {
      logger.error('Cache warmup failed:', error);
    }
  }

  private async getStaticPaths(projectId: string): Promise<string[]> {
    console.log(`Retrieving static paths for project ${projectId}`);
    return ['/index', '/about', '/contact']; // Example static paths
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
    
    for (const [key, item] of this.memoryCache.entries()) {
      if (tags.some(tag => item.tags.includes(tag))) {
        keys.add(key);
      }
    }

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