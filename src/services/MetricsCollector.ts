import { Redis } from 'ioredis';
import { logger } from '@/lib/logger';
import Docker from 'dockerode';
import { prisma } from '@/lib/prisma';

interface ContainerStats {
  cpu: number;
  memory: number;
  networkIn: number;
  networkOut: number;
  timestamp: Date;
}

export class MetricsCollector {
  private redis: Redis;
  private docker: Docker;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL!);
    this.docker = new Docker();
  }

  async getContainerStats(containerId: string): Promise<ContainerStats> {
    try {
      const container = this.docker.getContainer(containerId);
      const stats = await container.stats({ stream: false });

      const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
      const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
      const cpuUsage = (cpuDelta / systemDelta) * 100;

      const metrics = {
        cpu: cpuUsage,
        memory: (stats.memory_stats.usage / stats.memory_stats.limit) * 100,
        networkIn: stats.networks?.eth0?.rx_bytes || 0,
        networkOut: stats.networks?.eth0?.tx_bytes || 0,
        timestamp: new Date()
      };

      // Store metrics in database
      await this.storeContainerMetrics(containerId, metrics);

      return metrics;
    } catch (error) {
      logger.error('Failed to get container stats:', error);
      throw error;
    }
  }

  private async storeContainerMetrics(containerId: string, stats: ContainerStats): Promise<void> {
    try {
      const deployment = await prisma.deployment.findFirst({
        where: { containerId }
      });

      if (!deployment) {
        logger.warn(`No deployment found for container ${containerId}`);
        return;
      }

      await prisma.metrics.create({
        data: {
          deploymentId: deployment.id,
          cpu: stats.cpu,
          memory: Math.round(stats.memory),
          requests: 0, // Will be updated by trackRequest
          responseTime: 0, // Will be updated by trackRequest
          throughput: Math.round((stats.networkIn + stats.networkOut) / 1024 / 1024), // MB
          timestamp: stats.timestamp
        }
      });
    } catch (error) {
      logger.error('Failed to store container metrics:', error);
    }
  }

  async calculateAverageCPU(metrics: ContainerStats[]): Promise<number> {
    if (!metrics.length) return 0;
    const sum = metrics.reduce((acc, curr) => acc + curr.cpu, 0);
    return sum / metrics.length;
  }

  async calculateAverageMemory(metrics: ContainerStats[]): Promise<number> {
    if (!metrics.length) return 0;
    const sum = metrics.reduce((acc, curr) => acc + curr.memory, 0);
    return sum / metrics.length;
  }

  async getRequestRate(projectId: string): Promise<number> {
    try {
      const key = `metrics:requests:${projectId}`;
      const requestCount = await this.redis.get(key);
      await this.redis.del(key); // Reset counter

      const count = parseInt(requestCount || '0', 10);

      // Store request rate in database
      await this.storeRequestMetrics(projectId, count);

      return count;
    } catch (error) {
      logger.error('Failed to get request rate:', error);
      return 0;
    }
  }

  private async storeRequestMetrics(projectId: string, requestCount: number): Promise<void> {
    try {
      const deployment = await prisma.deployment.findFirst({
        where: {
          projectId,
          status: 'DEPLOYED'
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (!deployment) return;

      await prisma.metrics.updateMany({
        where: {
          deploymentId: deployment.id,
          timestamp: {
            gte: new Date(Date.now() - 60000) // Last minute
          }
        },
        data: {
          requests: requestCount
        }
      });
    } catch (error) {
      logger.error('Failed to store request metrics:', error);
    }
  }

  async getAverageResponseTime(projectId: string): Promise<number> {
    try {
      const key = `metrics:response_times:${projectId}`;
      const times = await this.redis.lrange(key, 0, -1);
      await this.redis.del(key);

      if (!times.length) return 0;
      const sum = times.reduce((acc, time) => acc + parseInt(time, 10), 0);
      const average = sum / times.length;

      // Store response time in database
      await this.storeResponseTimeMetrics(projectId, average);

      return average;
    } catch (error) {
      logger.error('Failed to get average response time:', error);
      return 0;
    }
  }

  private async storeResponseTimeMetrics(projectId: string, responseTime: number): Promise<void> {
    try {
      const deployment = await prisma.deployment.findFirst({
        where: {
          projectId,
          status: 'DEPLOYED'
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (!deployment) return;

      await prisma.metrics.updateMany({
        where: {
          deploymentId: deployment.id,
          timestamp: {
            gte: new Date(Date.now() - 60000) // Last minute
          }
        },
        data: {
          responseTime
        }
      });
    } catch (error) {
      logger.error('Failed to store response time metrics:', error);
    }
  }

  async trackRequest(projectId: string, responseTime: number): Promise<void> {
    try {
      const requestKey = `metrics:requests:${projectId}`;
      const responseTimeKey = `metrics:response_times:${projectId}`;

      await Promise.all([
        this.redis.incr(requestKey),
        this.redis.lpush(responseTimeKey, responseTime.toString()),
        this.redis.ltrim(responseTimeKey, 0, 999), // Keep last 1000 response times
        this.storeRequestMetrics(projectId, 1), // Increment request count in database
        this.storeResponseTimeMetrics(projectId, responseTime)
      ]);
    } catch (error) {
      logger.error('Failed to track request:', error);
    }
  }
} 