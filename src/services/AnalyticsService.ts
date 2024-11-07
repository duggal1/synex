/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from '@/lib/prisma';
import { Redis } from 'ioredis';
import { MetricsCollector } from '@/lib/metrics';
import { logger } from '@/lib/logger';
import { Request, Response } from 'express';


// Add this interface at the top with other interfaces
interface ContainerStats {
  cpu: number;
  memory: number;
  networkIn?: number;
  networkOut?: number;
  timestamp: Date;
}

interface MetricData {
  cpu: number;
  memory: number;
  requests: number;
  responseTime: number;
  errors: number;
  bandwidth: number;
}

interface RequestMetrics {
  path: string;
  method: string;
  timestamp: Date;
  userAgent: string | null;
  ip: string | null;
  country: string | null;
}

interface ResponseMetrics {
  responseTime: number;
  status: number;
  size: number;
}

interface BuildLog {
  level: string;
  message: string;
  timestamp: Date;
}

interface TimePeriods {
  '1h': number;
  '24h': number;
  '7d': number;
  '30d': number;
  [key: string]: number;
}

interface BuildMetrics {
  duration: number | null;
  success: boolean;
  memory: number | null;
  cpu: number | null;
  errors: number;
  errorLogs: Array<{
    message: string;
    timestamp: Date;
  }>;
}

export class AnalyticsService {
  private redis: Redis;
  private metricsCollector: MetricsCollector;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL!);
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

  async trackRequest(projectId: string, req: Request, res: Response): Promise<void> {
    const startTime = process.hrtime();
    
    try {
      const metrics: RequestMetrics = {
        path: req.path || req.url,
        method: req.method,
        timestamp: new Date(),
        userAgent: req.headers['user-agent'] || null,
        ip: req.ip || req.socket.remoteAddress || null,
        country: req.headers['cf-ipcountry'] as string || null,
      };

      await this.storeRequestMetrics(projectId, metrics);

      const [seconds, nanoseconds] = process.hrtime(startTime);
      const responseTime = seconds * 1000 + nanoseconds / 1000000;

      await this.updateResponseMetrics(projectId, {
        responseTime,
        status: res.statusCode,
        size: parseInt(res.get('content-length') || '0'),
      });

    } catch (error) {
      logger.error('Request tracking failed:', error);
    }
  }

  private async storeRequestMetrics(projectId: string, metrics: RequestMetrics): Promise<void> {
    try {
      // First get the project to get the userId
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { userId: true }
      });

      if (!project) {
        throw new Error(`Project not found: ${projectId}`);
      }

      await prisma.analytics.create({
        data: {
          projectId,
          userId: project.userId,
          type: 'REQUEST',
          metrics: metrics as any,
          timestamp: new Date()
        }
      });

      // Update request count in cache
      const cacheKey = `metrics:requests:${projectId}`;
      await this.redis.incr(cacheKey);
    } catch (error) {
      logger.error('Failed to store request metrics:', {
        projectId,
        error
      });
      throw error;
    }
  }

  private async updateResponseMetrics(projectId: string, metrics: ResponseMetrics): Promise<void> {
    try {
      // Get the project to fetch userId
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { userId: true }
      });
  
      if (!project) {
        throw new Error(`Project not found: ${projectId}`);
      }
  
      await prisma.analytics.create({
        data: {
          projectId,
          userId: project.userId,
          type: 'RESPONSE',
          metrics: metrics as any,
          timestamp: new Date()
        }
      });
  
      // Update response time stats in cache
      const cacheKey = `metrics:response:${projectId}`;
      await this.redis.lpush(cacheKey, metrics.responseTime);
      await this.redis.ltrim(cacheKey, 0, 999); // Keep last 1000 response times
    } catch (error) {
      logger.error('Failed to update response metrics:', {
        projectId,
        metrics,
        error
      });
      throw error;
    }
  }

  private async collectBuildMetrics(deploymentId: string) {
    const deployment = await prisma.deployment.findUnique({
      where: { id: deploymentId },
      select: {
        buildTime: true,
        status: true,
        memory: true,
        cpu: true,
        logs: {
          where: {
            level: 'ERROR'
          },
          select: {
            id: true,
            message: true,
            timestamp: true
          }
        }
      }
    });

    if (!deployment) {
      throw new Error(`Deployment ${deploymentId} not found`);
    }

    return {
      duration: deployment.buildTime,
      success: deployment.status === 'DEPLOYED',
      memory: deployment.memory,
      cpu: deployment.cpu,
      errors: deployment.logs?.length || 0,
      errorLogs: deployment.logs?.map((log: any) => ({
        message: log.message,
        timestamp: log.timestamp
      }))
    };
  }
  private async storeBuildMetrics(
    projectId: string, 
    deploymentId: string, 
    metrics: BuildMetrics
  ): Promise<void> {
    try {
      // First get the project to get the userId
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { userId: true }
      });
  
      if (!project) {
        throw new Error(`Project not found: ${projectId}`);
      }
  
      await prisma.analytics.create({
        data: {
          projectId,
          deploymentId,
          userId: project.userId,
          type: 'BUILD',
          metrics: metrics as any,
          timestamp: new Date()
        }
      });
  
      // Cache recent metrics
      const cacheKey = `metrics:build:${projectId}`;
      await this.redis.lpush(cacheKey, JSON.stringify(metrics));
      await this.redis.ltrim(cacheKey, 0, 99); // Keep last 100 builds
    } catch (error) {
      logger.error('Failed to store build metrics:', {
        projectId,
        deploymentId,
        error
      });
      throw error;
    }
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
    const container: ContainerStats = await this.metricsCollector.getContainerStats(deploymentId);
    
    return {
      cpu: container.cpu,
      memory: container.memory,
      requests: await this.getRequestCount(deploymentId),
      responseTime: await this.getAverageResponseTime(deploymentId),
      errors: await this.getErrorCount(deploymentId),
      bandwidth: (container.networkIn || 0) + (container.networkOut || 0)
    };
  }
  private async storeRealTimeMetrics(
    projectId: string, 
    deploymentId: string, 
    metrics: MetricData
  ): Promise<void> {
    try {
      // Get the project to fetch userId
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { userId: true }
      });
  
      if (!project) {
        throw new Error(`Project not found: ${projectId}`);
      }
  
      // Store in database
      await prisma.analytics.create({
        data: {
          projectId,
          deploymentId,
          userId: project.userId,
          type: 'REALTIME',
          metrics: JSON.stringify(metrics),
          timestamp: new Date()
        }
      });
  
      // Update cache for quick access
      const cacheKey = `metrics:realtime:${deploymentId}`;
      await this.redis.set(cacheKey, JSON.stringify(metrics), 'EX', 60);
    } catch (error) {
      logger.error('Failed to store realtime metrics:', {
        projectId,
        deploymentId,
        error
      });
      throw error;
    }
  }
  
  async getProjectMetrics(projectId: string, period: string = '24h'): Promise<any> {
    try {
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
    } catch (error) {
      logger.error('Failed to get project metrics:', {
        projectId,
        period,
        error
      });
      throw error;
    }
  }
  
  private getPeriodInMs(period: string): number {
    const periods: TimePeriods = {
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

  private async getRequestCount(deploymentId: string): Promise<number> {
    const cacheKey = `metrics:requests:${deploymentId}`;
    const count = await this.redis.get(cacheKey);
    return parseInt(count || '0');
  }

  private async getAverageResponseTime(deploymentId: string): Promise<number> {
    const cacheKey = `metrics:response:${deploymentId}`;
    const times = await this.redis.lrange(cacheKey, 0, -1);
    if (!times.length) return 0;
    
    const sum = times.reduce((acc, time) => acc + parseFloat(time), 0);
    return sum / times.length;
  }

  private async getErrorCount(deploymentId: string): Promise<number> {
    const cacheKey = `metrics:errors:${deploymentId}`;
    const count = await this.redis.get(cacheKey);
    return parseInt(count || '0');
  }
  async trackResourceUsage(projectId: string, deploymentId: string): Promise<void> {
    try {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { userId: true }
      });

      if (!project) {
        throw new Error(`Project not found: ${projectId}`);
      }

      const stats: ContainerStats = await this.metricsCollector.getContainerStats(deploymentId);
      
      await prisma.analytics.create({
        data: {
          projectId,
          deploymentId,
          userId: project.userId,
          type: 'RESOURCE',
          metrics: {
            cpu: stats.cpu,
            memory: stats.memory,
            networkIn: stats.networkIn || 0,
            networkOut: stats.networkOut || 0,
          },
          timestamp: new Date()
        }
      });
    } catch (error) {
      logger.error('Resource usage tracking failed:', {
        projectId,
        deploymentId,
        error
      });
      throw error;
    }
  }
  }
