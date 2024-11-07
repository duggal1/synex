import { prisma } from '@/lib/prisma';
import Docker from 'dockerode';
import { Redis } from 'ioredis';

export class MetricsCollector {
  private redis: Redis;
  private docker: Docker;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL!);
    this.docker = new Docker();
  }

  async getContainerStats(containerId: string) {
    const container = this.docker.getContainer(containerId);
    const stats = await container.stats({ stream: false });
    
    const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
    const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
    
    const cpuPercent = (cpuDelta / systemDelta) * 100;
    const memoryUsage = stats.memory_stats.usage;
    const memoryLimit = stats.memory_stats.limit;
    const memoryPercent = (memoryUsage / memoryLimit) * 100;

    return {
      cpu: cpuPercent,
      memory: memoryPercent,
      timestamp: new Date()
    };
  }

  async calculateAverageCPU(metrics: Array<{ cpu: number }>) {
    if (!metrics.length) return 0;
    const sum = metrics.reduce((acc, curr) => acc + curr.cpu, 0);
    return sum / metrics.length;
  }

  async calculateAverageMemory(metrics: Array<{ memory: number }>) {
    if (!metrics.length) return 0;
    const sum = metrics.reduce((acc, curr) => acc + curr.memory, 0);
    return sum / metrics.length;
  }

  async getRequestRate(projectId: string): Promise<number> {
    const key = `metrics:requests:${projectId}`;
    const requests = await this.redis.get(key);
    return parseInt(requests || '0', 10);
  }

  async getAverageResponseTime(projectId: string): Promise<number> {
    const key = `metrics:responsetime:${projectId}`;
    const times = await this.redis.lrange(key, 0, -1);
    if (!times.length) return 0;
    
    const sum = times.reduce((acc, curr) => acc + parseFloat(curr), 0);
    return sum / times.length;
  }

  async recordMetrics(deploymentId: string, metrics: {
    cpu: number;
    memory: number;
    requests: number;
    responseTime: number;
  }) {
    await prisma.metrics.create({
      data: {
        deploymentId,
        ...metrics,
        timestamp: new Date()
      }
    });
  }

  async getMetricsHistory(deploymentId: string, timeRange: { from: Date; to: Date }) {
    return await prisma.metrics.findMany({
      where: {
        deploymentId,
        timestamp: {
          gte: timeRange.from,
          lte: timeRange.to
        }
      },
      orderBy: {
        timestamp: 'asc'
      }
    });
  }
}
