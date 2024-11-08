/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { prisma } from '@/lib/prisma';
import { Redis } from 'ioredis';
import { logger } from '@/lib/logger';
import { EventEmitter } from 'events';
import { Project, Domain } from '@prisma/client';
import { createHash } from 'crypto';

interface EdgeRegion {
  id: string;
  name: string;
  location: string;
  latency: number;
  status: 'ACTIVE' | 'DEGRADED' | 'DOWN';
}

interface EdgeConfig {
  regions: EdgeRegion[];
  ttl: number;
  cacheStrategy: 'CacheFirst' | 'NetworkFirst' | 'StaleWhileRevalidate';
  securityRules: SecurityRule[];
}

interface SecurityRule {
  type: 'WAF' | 'RateLimit' | 'IPBlock';
  action: 'ALLOW' | 'BLOCK' | 'CHALLENGE';
  conditions: Record<string, any>;
}

interface EdgeMetrics {
  region: string;
  hits: number;
  bandwidth: number;
  latency: number;
  errorRate: number;
  cacheHitRate: number;
}

export class EdgeNetworkService extends EventEmitter {
  private redis: Redis;
  private regions: Map<string, EdgeRegion>;
  private healthCheckInterval: NodeJS.Timeout | null;

  constructor() {
    super();
    this.redis = new Redis(process.env.REDIS_URL!);
    this.regions = new Map();
    this.healthCheckInterval = null;
    this.initializeEdgeRegions();
  }

  private async initializeEdgeRegions(): Promise<void> {
    const defaultRegions: EdgeRegion[] = [
      {
        id: 'us-east-1',
        name: 'US East',
        location: 'Virginia',
        latency: 0,
        status: 'ACTIVE'
      },
      {
        id: 'eu-west-1',
        name: 'Europe West',
        location: 'Ireland',
        latency: 0,
        status: 'ACTIVE'
      },
      {
        id: 'ap-southeast-1',
        name: 'Asia Pacific',
        location: 'Singapore',
        latency: 0,
        status: 'ACTIVE'
      }
    ];

    for (const region of defaultRegions) {
      this.regions.set(region.id, region);
    }
  }

  async setupEdgeDistribution(projectId: string): Promise<void> {
    try {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          domains: true,
          config: true
        }
      });

      if (!project) {
        throw new Error('Project not found');
      }

      // Setup edge configuration
      const edgeConfig = await this.createEdgeConfig(project);
      
      // Configure CDN for each domain
      await this.setupDomainCDN(project.domains, edgeConfig);
      
      // Setup edge caching rules
      await this.setupEdgeCaching(projectId, edgeConfig);
      
      // Configure security rules
      await this.setupSecurityRules(projectId);
      
      // Start health monitoring
      this.startEdgeMonitoring(projectId);

      logger.info(`Edge network setup completed for project ${projectId}`);
    } catch (error) {
      logger.error('Edge network setup failed:', error);
      throw error;
    }
  }

  private async createEdgeConfig(project: Project): Promise<EdgeConfig> {
    return {
      regions: Array.from(this.regions.values()),
      ttl: 3600,
      cacheStrategy: 'StaleWhileRevalidate',
      securityRules: this.getDefaultSecurityRules()
    };
  }

  private async setupDomainCDN(domains: Domain[], config: EdgeConfig): Promise<void> {
    for (const domain of domains) {
      await this.configureDomainEdge(domain, config);
      await this.setupSSL(domain);
      await this.configureDDoSProtection(domain);
    }
  }

  private async configureDomainEdge(domain: Domain, config: EdgeConfig): Promise<void> {
    const edgeKey = `edge:domain:${domain.domain}`;
    await this.redis.hset(edgeKey, {
      config: JSON.stringify(config),
      lastUpdated: Date.now(),
      status: 'ACTIVE'
    });

    // Configure edge routing
    await this.setupEdgeRouting(domain, config.regions);
  }

  private async setupEdgeRouting(domain: Domain, regions: EdgeRegion[]): Promise<void> {
    const routingRules = regions.map(region => ({
      region: region.id,
      weight: 1,
      failover: regions
        .filter(r => r.id !== region.id)
        .map(r => r.id)
    }));

    await prisma.projectConfig.update({
      where: { projectId: domain.projectId },
      data: {
        edgeConfig: {
          routing: routingRules
        }
      }
    });
  }

  private async setupEdgeCaching(projectId: string, config: EdgeConfig): Promise<void> {
    const cacheRules = [
      {
        pattern: '/*',
        ttl: config.ttl,
        strategy: config.cacheStrategy,
        methods: ['GET', 'HEAD'],
        headers: ['Cache-Control', 'If-None-Match']
      },
      {
        pattern: '/api/*',
        ttl: 60,
        strategy: 'NetworkFirst',
        methods: ['GET'],
        headers: ['Cache-Control', 'Authorization']
      }
    ];

    await prisma.projectConfig.update({
      where: { projectId },
      data: {
        edgeConfig: {
          cache: cacheRules
        }
      }
    });
  }

  private getDefaultSecurityRules(): SecurityRule[] {
    return [
      {
        type: 'WAF',
        action: 'BLOCK',
        conditions: {
          rulesets: ['OWASP-CRS'],
          sensitivity: 'medium'
        }
      },
      {
        type: 'RateLimit',
        action: 'CHALLENGE',
        conditions: {
          requests: 1000,
          period: 60,
          byIP: true
        }
      }
    ];
  }

  private async setupSecurityRules(projectId: string): Promise<void> {
    const securityConfig = {
      waf: {
        enabled: true,
        rulesets: ['OWASP-CRS'],
        customRules: []
      },
      ddos: {
        enabled: true,
        sensitivity: 'auto',
        rateLimit: {
          requests: 1000,
          period: 60
        }
      },
      ssl: {
        minVersion: 'TLSv1.2',
        ciphers: ['ECDHE-ECDSA-AES128-GCM-SHA256'],
        hsts: true
      }
    };

    await prisma.projectConfig.update({
      where: { projectId },
      data: {
        edgeConfig: {
          security: securityConfig
        }
      }
    });
  }

  private async setupSSL(domain: Domain): Promise<void> {
    // SSL configuration implementation
    const sslConfig = {
      type: 'managed',
      provider: 'lets-encrypt',
      settings: {
        minVersion: 'TLSv1.2',
        ciphers: ['ECDHE-ECDSA-AES128-GCM-SHA256'],
        hsts: true
      }
    };

    await prisma.domain.update({
      where: { id: domain.id },
      data: {
        ssl: true,
        verified: true
      }
    });
  }

  private async configureDDoSProtection(domain: Domain): Promise<void> {
    const ddosConfig = {
      enabled: true,
      sensitivity: 'auto',
      mitigation: ['challenge', 'rate-limit', 'block'],
      thresholds: {
        requests: 10000,
        bandwidth: 100 // MB/s
      }
    };

    await prisma.projectConfig.update({
      where: { projectId: domain.projectId },
      data: {
        edgeConfig: {
          ddos: ddosConfig
        }
      }
    });
  }

  private startEdgeMonitoring(projectId: string): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.checkEdgeHealth(projectId);
        await this.collectEdgeMetrics(projectId);
      } catch (error) {
        logger.error('Edge monitoring failed:', error);
      }
    }, 30000) as NodeJS.Timeout;
  }

  private async checkEdgeHealth(projectId: string): Promise<void> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    for (const region of this.regions.values()) {
      try {
        const startTime = Date.now();
        const response = await fetch(
          `https://${region.id}.edge-check.${process.env.EDGE_DOMAIN}/health`,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'X-Project-ID': projectId
            },
            next: {
              revalidate: 30, // Revalidate every 30 seconds
              tags: [`edge-health-${region.id}`]
            },
            signal: controller.signal
          }
        );

        clearTimeout(timeoutId);

        if (response.ok) {
          region.latency = Date.now() - startTime;
          region.status = 'ACTIVE';
          
          // Update region status in Redis
          await this.redis.hset(
            `edge:region:${region.id}`,
            {
              status: 'ACTIVE',
              latency: region.latency,
              lastCheck: Date.now()
            }
          );
        } else {
          throw new Error(`Health check failed with status: ${response.status}`);
        }
      } catch (error) {
        region.status = 'DEGRADED';
        
        // Update degraded status in Redis
        await this.redis.hset(
          `edge:region:${region.id}`,
          {
            status: 'DEGRADED',
            error: error instanceof Error ? error.message : 'Unknown error',
            lastCheck: Date.now()
          }
        );

        this.emit('edge:degraded', { region: region.id, error });
        logger.error(`Edge health check failed for region ${region.id}:`, error);
      }
    }
  }

  private async collectEdgeMetrics(projectId: string): Promise<void> {
    const metrics: EdgeMetrics[] = [];

    for (const region of this.regions.values()) {
      try {
        const response = await fetch(
          `https://${region.id}.edge-metrics.${process.env.EDGE_DOMAIN}/metrics/${projectId}`,
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'X-Project-ID': projectId
            },
            next: {
              revalidate: 60, // Revalidate every minute
              tags: [`edge-metrics-${region.id}`]
            }
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to collect metrics: ${response.status}`);
        }

        const regionMetrics = await response.json();
        metrics.push({
          region: region.id,
          ...regionMetrics
        });
      } catch (error) {
        logger.error(`Failed to collect metrics for region ${region.id}:`, error);
      }
    }

    if (metrics.length > 0) {
      await this.storeEdgeMetrics(projectId, metrics);
    }
  }

  private async storeEdgeMetrics(projectId: string, metrics: EdgeMetrics[]): Promise<void> {
    // Create all metrics entries in a transaction
    await prisma.$transaction(
      metrics.map(metric => 
        prisma.edgeMetrics.create({
          data: {
            projectId,
            region: metric.region,
            hits: metric.hits,
            bandwidth: metric.bandwidth,
            latency: metric.latency,
            errorRate: metric.errorRate,
            cacheHitRate: metric.cacheHitRate,
            timestamp: new Date()
          }
        })
      )
    );
  }

  async cleanup(projectId: string): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    // Cleanup edge configurations
    await this.redis.del(`edge:config:${projectId}`);
    
    // Remove monitoring
    this.removeAllListeners();
  }

  async invalidateEdgeCache(projectId: string, paths: string[]): Promise<void> {
    try {
      const response = await fetch(
        `/api/edge/cache/invalidate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            projectId,
            paths
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Cache invalidation failed: ${response.status}`);
      }

      // Revalidate paths using Next.js
      await Promise.all(
        paths.map(path => 
          fetch(`/api/revalidate?path=${encodeURIComponent(path)}`, {
            method: 'POST'
          })
        )
      );

      logger.info(`Edge cache invalidated for project ${projectId}, paths: ${paths.join(', ')}`);
    } catch (error) {
      logger.error('Edge cache invalidation failed:', error);
      throw error;
    }
  }

  async purgeEdgeCache(projectId: string): Promise<void> {
    try {
      const response = await fetch(
        `/api/edge/cache/purge`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ projectId })
        }
      );

      if (!response.ok) {
        throw new Error(`Cache purge failed: ${response.status}`);
      }

      // Revalidate all paths for the project
      await fetch(`/api/revalidate-project?projectId=${projectId}`, {
        method: 'POST'
      });

      logger.info(`Edge cache purged for project ${projectId}`);
    } catch (error) {
      logger.error('Edge cache purge failed:', error);
      throw error;
    }
  }
} 