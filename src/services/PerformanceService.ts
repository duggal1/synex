/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { prisma } from '@/lib/prisma';
import { CacheService } from './CacheService';
import { LoadBalancerService } from './LoadBalancerService';
import { logger } from '@/lib/logger';
import { Redis } from 'ioredis';
import sharp from 'sharp';
import { createHash } from 'crypto';
import { Project, Framework } from '@prisma/client';
import path from 'path';
import fs from 'fs-extra';
import Dockerode from 'dockerode';

interface AssetOptimizationConfig {
  images: {
    quality: number;
    formats: ('webp' | 'avif')[];
    sizes: number[];
  };
  js: {
    minify: boolean;
    compress: boolean;
    moduleBundle: boolean;
  };
  css: {
    minify: boolean;
    purge: boolean;
  };
}

interface CacheConfig {
  browser: {
    static: string;
    dynamic: string;
  };
  edge: {
    ttl: string;
    staleWhileRevalidate: string;
  };
  server: {
    memory: boolean;
    redis: boolean;
  };
}

interface CDNConfig {
  regions: string[];
  ttl: number;
  purgeOnDeploy: boolean;
}

export class PerformanceService {
  private cache: CacheService;
  private loadBalancer: LoadBalancerService;
  private redis: Redis;
  private assetCache: Map<string, Buffer>;
  private isStaticNextJS = false;

  constructor() {
    this.cache = new CacheService();
    this.loadBalancer = new LoadBalancerService(new Dockerode());
    this.redis = new Redis(process.env.REDIS_URL!);
    this.assetCache = new Map();
  }

  async optimizePerformance(projectId: string): Promise<void> {
    try {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          deployments: {
            where: { status: 'DEPLOYED' },
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      });

      if (!project) {
        throw new Error('Project not found');
      }

      // Setup caching layers
      await this.setupCaching(project);
      
      // Configure CDN
      await this.setupCDN(project);
      
      // Configure load balancing
      await this.setupLoadBalancing(project);
      
      // Optimize assets
      await this.optimizeAssets(project);

      // Track performance metrics
      await this.startPerformanceMonitoring(project.id);

      logger.info(`Performance optimization completed for project ${projectId}`);
    } catch (error) {
      logger.error('Performance optimization failed:', error);
      throw error;
    }
  }

  private async setupCaching(project: Project): Promise<void> {
    const cacheConfig: CacheConfig = {
      browser: {
        static: this.isStaticFramework(project.framework) ? '1y' : '1d',
        dynamic: '1h'
      },
      edge: {
        ttl: '1h',
        staleWhileRevalidate: '1d'
      },
      server: {
        memory: true,
        redis: true
      }
    };

    await this.cache.configure(cacheConfig);
    await this.setupCacheInvalidation(project.id);
    await this.configureBrowserCache(project.id);
    await this.configureEdgeCache(project.id);
  }

  private async setupCacheInvalidation(projectId: string): Promise<void> {
    const invalidationRules = {
      paths: ['/api/*', '/data/*'],
      headers: ['Cache-Control', 'ETag'],
      methods: ['POST', 'PUT', 'DELETE']
    };

    await prisma.projectConfig.update({
      where: { projectId },
      data: {
        cacheConfig: {
          invalidation: invalidationRules
        }
      }
    });
  }

  private async setupCDN(project: Project): Promise<void> {
    const cdnConfig: CDNConfig = {
      regions: ['us-east', 'eu-west', 'ap-south'],
      ttl: 3600,
      purgeOnDeploy: true
    };

    await this.configureCDNDistribution(project.id, cdnConfig);
    await this.setupEdgeLocations(project.id, cdnConfig.regions);
    await this.configureCDNPurging(project.id);
  }

  private async configureCDNDistribution(projectId: string, config: CDNConfig): Promise<void> {
    const domains = await prisma.domain.findMany({
      where: { projectId }
    });

    for (const domain of domains) {
      await this.setupDomainCDN(domain.domain, config);
    }
  }

  private async setupDomainCDN(domain: string, config: CDNConfig): Promise<void> {
    const cacheKey = `cdn:domain:${domain}`;
    await this.redis.hset(cacheKey, {
      domain,
      regions: JSON.stringify(config.regions),
      ttl: config.ttl,
      lastPurge: Date.now()
    });
  }

  private async setupLoadBalancing(project: Project): Promise<void> {
    await this.loadBalancer.setupLoadBalancing(project);
    await this.configureAutoScaling(project.id);
  }

  private async configureAutoScaling(projectId: string): Promise<void> {
    const scalingRules = {
      cpu: { threshold: 70, scaleUp: 1 },
      memory: { threshold: 80, scaleUp: 1 },
      requests: { threshold: 1000, scaleUp: 2 }
    };

    await prisma.projectConfig.update({
      where: { projectId },
      data: {
        autoScalingConfig: scalingRules
      }
    });
  }

  private async optimizeAssets(project: Project): Promise<void> {
    const config: AssetOptimizationConfig = {
      images: {
        quality: 85,
        formats: ['webp', 'avif'],
        sizes: [640, 750, 828, 1080, 1200]
      },
      js: {
        minify: true,
        compress: true,
        moduleBundle: true
      },
      css: {
        minify: true,
        purge: true
      }
    };

    await this.optimizeImages(project.id, config.images);
    await this.optimizeJavaScript(project.id, config.js);
    await this.optimizeCSS(project.id, config.css);
  }

  private async optimizeImages(
    projectId: string,
    config: AssetOptimizationConfig['images']
  ): Promise<void> {
    const projectPath = path.join(process.cwd(), 'projects', projectId);
    const images = await this.findImages(projectPath);

    for (const image of images) {
      const optimized = await this.processImage(image, config);
      await this.cacheOptimizedAsset(projectId, image, optimized);
    }
  }

  private async processImage(
    imagePath: string,
    config: AssetOptimizationConfig['images']
  ): Promise<Buffer> {
    const image = sharp(imagePath);
    const metadata = await image.metadata();

    const optimized = await image
      .resize(config.sizes[0])
      .webp({ quality: config.quality })
      .toBuffer();

    return optimized;
  }

  private async optimizeJavaScript(
    projectId: string,
    config: AssetOptimizationConfig['js']
  ): Promise<void> {
    // JavaScript optimization implementation
  }

  private async optimizeCSS(
    projectId: string,
    config: AssetOptimizationConfig['css']
  ): Promise<void> {
    // CSS optimization implementation
  }

  private async cacheOptimizedAsset(
    projectId: string,
    originalPath: string,
    optimizedContent: Buffer
  ): Promise<void> {
    const hash = createHash('sha256')
      .update(optimizedContent)
      .digest('hex');

    const key = `asset:${projectId}:${hash}`;
    this.assetCache.set(key, optimizedContent);
    await this.redis.set(key, optimizedContent);
  }

  private async startPerformanceMonitoring(projectId: string): Promise<void> {
    setInterval(async () => {
      try {
        const metrics = await this.collectPerformanceMetrics(projectId);
        await this.storeMetrics(projectId, metrics);
      } catch (error) {
        logger.error('Performance monitoring failed:', error);
      }
    }, 60000);
  }

  private async collectPerformanceMetrics(projectId: string): Promise<any> {
    const stats = await this.loadBalancer.getLoadBalancerStats(projectId);
    const cacheStats = await this.cache.getStats(projectId);
    
    return {
      timestamp: new Date(),
      loadBalancer: stats,
      cache: cacheStats,
      // Add more metrics as needed
    };
  }

  private async storeMetrics(projectId: string, metrics: any): Promise<void> {
    await prisma.performanceMetrics.create({
      data: {
        projectId,
        metrics,
        timestamp: new Date()
      }
    });
  }

  async cleanup(projectId: string): Promise<void> {
    await this.cache.cleanup(projectId);
    await this.loadBalancer.cleanup(projectId);
    this.assetCache.clear();
  }

  private async configureBrowserCache(projectId: string): Promise<void> {
    const browserCacheConfig = {
      staticAssets: {
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Vary': 'Accept-Encoding'
      },
      dynamicContent: {
        'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
        'Vary': 'Accept-Encoding, Cookie'
      }
    };

    await prisma.projectConfig.update({
      where: { projectId },
      data: {
        cacheConfig: {
          ...browserCacheConfig
        }
      }
    });
  }

  private async configureEdgeCache(projectId: string): Promise<void> {
    const edgeCacheConfig = {
      rules: [
        {
          pattern: '/*',
          ttl: 3600,
          staleWhileRevalidate: 86400,
          methods: ['GET', 'HEAD']
        },
        {
          pattern: '/api/*',
          ttl: 60,
          staleWhileRevalidate: 300,
          methods: ['GET']
        }
      ]
    };

    await prisma.projectConfig.update({
      where: { projectId },
      data: {
        cacheConfig: {
          edge: edgeCacheConfig
        }
      }
    });
  }

  private async setupEdgeLocations(projectId: string, regions: string[]): Promise<void> {
    const edgeConfig = {
      regions,
      replicationFactor: regions.length > 3 ? 3 : regions.length,
      routingStrategy: 'latency',
      backupRegions: ['us-central', 'eu-central']
    };

    await prisma.projectConfig.update({
      where: { projectId },
      data: {
        cdnConfig: {
          edge: edgeConfig
        }
      }
    });
  }

  private async configureCDNPurging(projectId: string): Promise<void> {
    const purgeConfig = {
      automatic: {
        onDeploy: true,
        onConfigChange: true
      },
      patterns: [
        '/*',
        '/assets/*',
        '/api/*'
      ],
      retryStrategy: {
        attempts: 3,
        backoff: 'exponential'
      }
    };

    await prisma.projectConfig.update({
      where: { projectId },
      data: {
        cdnConfig: {
          purge: purgeConfig
        }
      }
    });
  }

  private async findImages(projectPath: string): Promise<string[]> {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif'];
    const images: string[] = [];

    try {
      const files = await fs.readdir(projectPath, { recursive: true });
      for (const file of files) {
        if (typeof file !== 'string') continue;
        const ext = path.extname(file).toLowerCase();
        if (imageExtensions.includes(ext)) {
          images.push(path.join(projectPath, file));
        }
      }

      return images;
    } catch (error) {
      logger.error('Failed to find images:', error);
      return [];
    }
  }
  private isStaticFramework(framework: Framework): boolean {
    return framework === Framework.ASTRO || 
           (framework === Framework.NEXTJS && this.isStaticNextJS);
  }

  public setNextJSStaticStatus(isStatic: boolean): void {
    this.isStaticNextJS = isStatic;
  }
} 