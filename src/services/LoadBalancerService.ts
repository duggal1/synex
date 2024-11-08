/* eslint-disable @typescript-eslint/no-unused-vars */
import { prisma } from '@/lib/prisma';
import { Redis } from 'ioredis';
import { logger } from '@/lib/logger';
import { MetricsCollector } from './MetricsCollector';
import { EventEmitter } from 'events';
import { Project, Domain, Deployment } from '@prisma/client';
import type { Prisma } from '@prisma/client';

interface LoadBalancerStats {
  activeConnections: number;
  requestsPerSecond: number;
  avgResponseTime: number;
  errorRate: number;
}

interface HealthCheck {
  url: string;
  interval: number;
  timeout: number;
  unhealthyThreshold: number;
  healthyThreshold: number;
}

interface LoadBalancerConfig {
  sessionAffinity: boolean;
  sessionTimeout: number;
  cookieName: string;
  failoverEnabled: boolean;
  failoverThreshold: number;
  failoverTimeout: number;
}

export class LoadBalancerService extends EventEmitter {
  private redis: Redis;
  private metricsCollector: MetricsCollector;
  private healthCheckIntervals: Map<string, NodeJS.Timer>;

  constructor() {
    super();
    this.redis = new Redis(process.env.REDIS_URL!);
    this.metricsCollector = new MetricsCollector();
    this.healthCheckIntervals = new Map();
  }

  async getContainerForDomain(domain: string): Promise<string> {
    try {
      const domainRecord = await prisma.domain.findUnique({
        where: { domain },
        include: {
          project: {
            include: {
              deployments: {
                where: { status: 'DEPLOYED' },
                orderBy: { createdAt: 'desc' },
                take: 1
              }
            }
          }
        }
      });

      if (!domainRecord?.project?.deployments?.[0]) {
        throw new Error('No active deployment found');
      }

      const deployment = domainRecord.project.deployments[0];
      const containers = await this.getHealthyContainers(deployment.id);

      if (!containers.length) {
        throw new Error('No healthy containers available');
      }

      // Get least loaded container
      const container = await this.getLeastLoadedContainer(containers);
      await this.trackContainerUsage(container);

      return container;
    } catch (error) {
      logger.error('Load balancer routing failed:', error);
      throw new Error('Failed to route request');
    }
  }

  async setupLoadBalancing(project: Project): Promise<void> {
    try {
      const healthCheck: HealthCheck = {
        url: '/api/health',
        interval: 10000, // 10 seconds
        timeout: 5000,   // 5 seconds
        unhealthyThreshold: 3,
        healthyThreshold: 2
      };

      await this.configureHealthChecks(project.id, healthCheck);
      await this.setupSessionAffinity(project.id);
      await this.configureFailover(project.id);

      logger.info(`Load balancing configured for project ${project.id}`);
    } catch (error) {
      logger.error('Failed to setup load balancing:', error);
      throw error;
    }
  }

  private async getHealthyContainers(deploymentId: string): Promise<string[]> {
    const healthKey = `health:containers:${deploymentId}`;
    const containers = await this.redis.smembers(healthKey);
    return containers;
  }

  private async getLeastLoadedContainer(containers: string[]): Promise<string> {
    const loads = await Promise.all(
      containers.map(async (container) => {
        const stats = await this.metricsCollector.getContainerStats(container);
        return {
          container,
          load: stats.cpu * 0.7 + stats.memory * 0.3 // Weighted score
        };
      })
    );

    loads.sort((a, b) => a.load - b.load);
    return loads[0].container;
  }

  private async trackContainerUsage(containerId: string): Promise<void> {
    const key = `container:usage:${containerId}`;
    await this.redis.incr(key);
    await this.redis.expire(key, 60); // Expire after 1 minute
  }

  private async configureHealthChecks(
    projectId: string, 
    healthCheck: HealthCheck
  ): Promise<void> {
    const interval = setInterval(async () => {
      try {
        const deployments = await prisma.deployment.findMany({
          where: {
            projectId,
            status: 'DEPLOYED'
          }
        });

        for (const deployment of deployments) {
          await this.performHealthCheck(deployment, healthCheck);
        }
      } catch (error) {
        logger.error('Health check failed:', error);
      }
    }, healthCheck.interval);

    this.healthCheckIntervals.set(projectId, interval);
  }

  private async performHealthCheck(
    deployment: Deployment,
    healthCheck: HealthCheck
  ): Promise<void> {
    const healthKey = `health:containers:${deployment.id}`;
    const unhealthyKey = `unhealthy:containers:${deployment.id}`;

    try {
      const controller = new AbortController();
      const timeoutId = globalThis.setTimeout(() => {
        controller.abort();
      }, healthCheck.timeout);

      try {
        const response = await fetch(
          `http://localhost:${deployment.containerPort}${healthCheck.url}`,
          { 
            signal: controller.signal,
            headers: {
              'Connection': 'keep-alive'
            }
          }
        );

        globalThis.clearTimeout(timeoutId);

        if (response.ok) {
          await this.handleHealthyContainer(deployment.containerId!, healthKey, unhealthyKey);
        } else {
          await this.handleUnhealthyContainer(deployment.containerId!, healthKey, unhealthyKey);
        }
      } catch (error) {
        globalThis.clearTimeout(timeoutId);
        await this.handleUnhealthyContainer(deployment.containerId!, healthKey, unhealthyKey);
      }
    } catch (error) {
      logger.error('Health check failed:', error);
      await this.handleUnhealthyContainer(deployment.containerId!, healthKey, unhealthyKey);
    }
  }

  private async handleHealthyContainer(
    containerId: string,
    healthKey: string,
    unhealthyKey: string
  ): Promise<void> {
    await this.redis.sadd(healthKey, containerId);
    await this.redis.srem(unhealthyKey, containerId);
  }

  private async handleUnhealthyContainer(
    containerId: string,
    healthKey: string,
    unhealthyKey: string
  ): Promise<void> {
    await this.redis.srem(healthKey, containerId);
    await this.redis.sadd(unhealthyKey, containerId);
    
    const unhealthyCount = await this.redis.scard(unhealthyKey);
    if (unhealthyCount >= 3) {
      this.emit('container:unhealthy', containerId);
    }
  }

  private async setupSessionAffinity(projectId: string): Promise<void> {
    const config: Prisma.JsonObject = {
      sessionAffinity: true,
      sessionTimeout: 3600,
      cookieName: 'SERVERID'
    };

    await prisma.project.update({
      where: { id: projectId },
      data: {
        config: config // Changed from loadBalancerConfig to config
      }
    });
  }

  private async configureFailover(projectId: string): Promise<void> {
    const config: Prisma.JsonObject = {
      failoverEnabled: true,
      failoverThreshold: 3,
      failoverTimeout: 30
    };

    await prisma.project.update({
      where: { id: projectId },
      data: {
        config: config // Changed from loadBalancerConfig to config
      }
    });
  }

  async getLoadBalancerStats(projectId: string): Promise<LoadBalancerStats> {
    try {
      const stats = await this.redis.hgetall(`lb:stats:${projectId}`);
      return {
        activeConnections: parseInt(stats.activeConnections || '0'),
        requestsPerSecond: parseFloat(stats.requestsPerSecond || '0'),
        avgResponseTime: parseFloat(stats.avgResponseTime || '0'),
        errorRate: parseFloat(stats.errorRate || '0')
      };
    } catch (error) {
      logger.error('Failed to get load balancer stats:', error);
      throw error;
    }
  }

  async cleanup(projectId: string): Promise<void> {
    const interval = this.healthCheckIntervals.get(projectId);
    if (interval) {
      clearInterval(interval as NodeJS.Timeout);
      this.healthCheckIntervals.delete(projectId);
    }
  }
}