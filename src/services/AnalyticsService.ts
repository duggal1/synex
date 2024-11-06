import { prisma } from '@/lib/prisma';
import { Redis } from 'ioredis';
import { MetricsCollector } from '@/lib/metrics';
import { logger } from '@/lib/logger';

interface MetricData {
  cpu: number;
  memory: number;
  requests: number;
  responseTime: number;
  errors: number;
  bandwidth: number;
}

export class AnalyticsService {
  private redis: Redis;
  private metricsCollector: MetricsCollector;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
    this.metricsCollector = new MetricsCollector();
  }

  async trackDeployment(projectId: string, deploymentId: string) {
    try {
      // Track build metrics
      const buildMetrics = await this.collectBuildMetrics(deploymentId);
      await this.storeBuildMetrics(projectId, deploymentId, buildMetrics);

      // Start real-time monitoring
      await this.startRealTimeMonitoring(projectId, deploymentId);

      // Track resource usage
      await this.trackResourceUsage(projectId, deploymentId);

      return true;
    } catch (error) {
      logger.error('Analytics tracking failed:', error);
      throw error;
    }
  }

  async trackRequest(projectId: string, req: Request, res: Response) {
    const startTime = process.hrtime();
    
    try {
      // Track request metrics
      const metrics = {
        path: req.url,
        method: req.method,
        timestamp: new Date(),
        userAgent: req.headers['user-agent'],
        ip: req.ip,
        country: req.headers['cf-ipcountry'],
      };

      // Store request metrics
      await this.storeRequestMetrics(projectId, metrics);

      // Track response time
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const responseTime = seconds * 1000 + nanoseconds / 1000000;

      // Update response metrics
      await this.updateResponseMetrics(projectId, {
        responseTime,
        status: res.statusCode,
        size: parseInt(res.getHeader('content-length') as string || '0'),
      });

    } catch (error) {
      logger.error('Request tracking failed:', error);
    }
  }

  private async collectBuildMetrics(deploymentId: string) {
    const deployment = await prisma.deployment.findUnique({
      where: { id: deploymentId },
      include: { buildLogs: true }
    });

    return {
      duration: deployment.buildTime,
      success: deployment.status === 'DEPLOYED',
      memory: deployment.memory,
      cpu: deployment.cpu,
      errors: deployment.buildLogs.filter(log => log.level === 'ERROR').length
    };
  }

  private async storeBuildMetrics(
    projectId: string, 
    deploymentId: string, 
    metrics: any
  ) {
    await prisma.analytics.create({
      data: {
        projectId,
        deploymentId,
        type: 'BUILD',
        metrics: metrics,
        timestamp: new Date()
      }
    });

    // Cache recent metrics
    const cacheKey = `metrics:build:${projectId}`;
    await this.redis.lpush(cacheKey, JSON.stringify(metrics));
    await this.redis.ltrim(cacheKey, 0, 99); // Keep last 100 builds
  }

  private async startRealTimeMonitoring(projectId: string, deploymentId: string) {
    // Start collecting metrics every 10 seconds
    const interval = setInterval(async () => {
      try {
        const metrics = await this.collectRealTimeMetrics(deploymentId);
        await this.storeRealTimeMetrics(projectId, deploymentId, metrics);
      } catch (error) {
        logger.error('Real-time monitoring failed:', error);
        clearInterval(interval);
      }
    }, 10000);

    // Store interval reference
    this.redis.set(
      `monitoring:${deploymentId}`, 
      interval[Symbol.toPrimitive]()
    );
  }

  private async collectRealTimeMetrics(deploymentId: string): Promise<MetricData> {
    const container = await this.metricsCollector.getContainerStats(deploymentId);
    
    return {
      cpu: container.cpu_stats.cpu_usage.total_usage,
      memory: container.memory_stats.usage,
      requests: await this.getRequestCount(deploymentId),
      responseTime: await this.getAverageResponseTime(deploymentId),
      errors: await this.getErrorCount(deploymentId),
      bandwidth: container.networks.eth0.rx_bytes + container.networks.eth0.tx_bytes
    };
  }

  private async storeRealTimeMetrics(
    projectId: string, 
    deploymentId: string, 
    metrics: MetricData
  ) {
    // Store in database
    await prisma.analytics.create({
      data: {
        projectId,
        deploymentId,
        type: 'REALTIME',
        metrics: metrics,
        timestamp: new Date()
      }
    });

    // Update cache for quick access
    const cacheKey = `metrics:realtime:${deploymentId}`;
    await this.redis.set(cacheKey, JSON.stringify(metrics), 'EX', 60);
  }

  async getProjectMetrics(projectId: string, period: string = '24h') {
    const metrics = await prisma.analytics.findMany({
      where: {
        projectId,
        timestamp: {
          gte: new Date(Date.now() - this.getPeriodInMs(period))
        }
      },
      orderBy: { timestamp: 'asc' }
    });

    return this.aggregateMetrics(metrics);
  }

  private getPeriodInMs(period: string): number {
    const periods = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };
    return periods[period] || periods['24h'];
  }

  private aggregateMetrics(metrics: any[]) {
    return {
      requests: {
        total: metrics.reduce((sum, m) => sum + m.metrics.requests, 0),
        average: metrics.reduce((sum, m) => sum + m.metrics.requests, 0) / metrics.length
      },
      performance: {
        averageResponseTime: metrics.reduce((sum, m) => sum + m.metrics.responseTime, 0) / metrics.length,
        p95ResponseTime: this.calculatePercentile(metrics.map(m => m.metrics.responseTime), 95)
      },
      resources: {
        averageCpu: metrics.reduce((sum, m) => sum + m.metrics.cpu, 0) / metrics.length,
        averageMemory: metrics.reduce((sum, m) => sum + m.metrics.memory, 0) / metrics.length,
        peakCpu: Math.max(...metrics.map(m => m.metrics.cpu)),
        peakMemory: Math.max(...metrics.map(m => m.metrics.memory))
      },
      errors: {
        total: metrics.reduce((sum, m) => sum + m.metrics.errors, 0),
        rate: metrics.reduce((sum, m) => sum + m.metrics.errors, 0) / metrics.reduce((sum, m) => sum + m.metrics.requests, 0)
      },
      bandwidth: {
        total: metrics.reduce((sum, m) => sum + m.metrics.bandwidth, 0),
        average: metrics.reduce((sum, m) => sum + m.metrics.bandwidth, 0) / metrics.length
      }
    };
  }

  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }
} 