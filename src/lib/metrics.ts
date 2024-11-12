import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { Redis } from 'ioredis';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ContainerStats } from 'dockerode';

export interface DockerContainerStats {
  cpu: number;
  memory: number;
  timestamp: Date;
}

export class MetricsCollector {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [x: string]: any;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getContainerStats(deploymentId: string): DockerContainerStats | PromiseLike<DockerContainerStats> {
    throw new Error('Method not implemented.');
  }
  private readonly redis: Redis;
  private readonly metricsPrefix = 'metrics:';

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL!);
  }

  async getErrorRate(deploymentId: string): Promise<number> {
    try {
      // Get error metrics from the last 5 minutes
      const errors = await prisma.metrics.findMany({
        where: {
          deploymentId,
          timestamp: {
            gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
          }
        },
        select: {
          errorRate: true
        }
      });

      if (errors.length === 0) return 0;

      // Calculate average error rate
      const totalErrorRate = errors.reduce((sum, metric) => sum + metric.errorRate, 0);
      return totalErrorRate / errors.length;
    } catch (error) {
      logger.error(`Failed to get error rate for deployment ${deploymentId}:`, error);
      return 0;
    }
  }

  async getLatencyP95(deploymentId: string): Promise<number> {
    try {
      // Get latency metrics from Redis (more real-time)
      const latencies = await this.redis.lrange(
        `${this.metricsPrefix}${deploymentId}:latency`,
        0,
        -1
      );

      if (latencies.length === 0) return 0;

      // Calculate P95 latency
      const sortedLatencies = latencies
        .map(l => parseInt(l))
        .sort((a, b) => a - b);
      
      const p95Index = Math.floor(sortedLatencies.length * 0.95);
      return sortedLatencies[p95Index];
    } catch (error) {
      logger.error(`Failed to get P95 latency for deployment ${deploymentId}:`, error);
      return 0;
    }
  }

  async getCpuUsage(deploymentId: string): Promise<number> {
    try {
      // Get CPU metrics from the last minute
      const cpuMetrics = await prisma.metrics.findMany({
        where: {
          deploymentId,
          timestamp: {
            gte: new Date(Date.now() - 60 * 1000) // Last minute
          }
        },
        select: {
          cpu: true
        },
        orderBy: {
          timestamp: 'desc'
        },
        take: 1
      });

      return cpuMetrics[0]?.cpu ?? 0;
    } catch (error) {
      logger.error(`Failed to get CPU usage for deployment ${deploymentId}:`, error);
      return 0;
    }
  }

  async recordMetrics(deploymentId: string, metrics: {
    errorRate?: number;
    latency?: number;
    cpu?: number;
    memory?: number;
    requests?: number;
  }): Promise<void> {
    try {
      // Store in database
      await prisma.metrics.create({
        data: {
          deploymentId,
          cpu: metrics.cpu ?? 0,
          memory: metrics.memory ?? 0,
          requests: metrics.requests ?? 0,
          errorRate: metrics.errorRate ?? 0,
          responseTime: metrics.latency ?? 0,
          throughput: 0,
          timestamp: new Date()
        }
      });

      // Store latency in Redis for P95 calculations
      if (metrics.latency) {
        await this.redis.lpush(
          `${this.metricsPrefix}${deploymentId}:latency`,
          metrics.latency.toString()
        );
        // Keep only last 1000 latency measurements
        await this.redis.ltrim(
          `${this.metricsPrefix}${deploymentId}:latency`,
          0,
          999
        );
      }
    } catch (error) {
      logger.error(`Failed to record metrics for deployment ${deploymentId}:`, error);
    }
  }

  async cleanup(deploymentId: string): Promise<void> {
    try {
      // Clean up Redis metrics
      await this.redis.del(`${this.metricsPrefix}${deploymentId}:latency`);
      
      // Optionally clean up old database metrics
      await prisma.metrics.deleteMany({
        where: {
          deploymentId,
          timestamp: {
            lt: new Date(Date.now() - 24 * 60 * 60 * 1000) // Older than 24 hours
          }
        }
      });
    } catch (error) {
      logger.error(`Failed to cleanup metrics for deployment ${deploymentId}:`, error);
    }
  }
}
