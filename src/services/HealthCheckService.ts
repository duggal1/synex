import Docker from 'dockerode';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import fetch from 'node-fetch';
import { Framework } from '@/types/index';
import { Prisma } from '@prisma/client';

interface HealthCheckConfig {
  endpoints: string[];
  timeout: number;
  interval: number;
  retries: number;
  successThreshold: number;
  allowedStatusCodes: number[];
  headers?: Record<string, string>;
}

interface HealthCheckResult {
  success: boolean;
  responseTime: number;
  statusCode: number;
  error?: string;
}

export class HealthCheckService {
  private readonly docker: Docker;
  private frameworkConfigs!: Map<Framework, HealthCheckConfig>;

  constructor(docker: Docker) {
    this.docker = docker;
    this.initializeFrameworkConfigs();
  }

  private initializeFrameworkConfigs() {
    this.frameworkConfigs = new Map([
      [Framework.NEXTJS, {
        endpoints: ['/api/health', '/_next/health'],
        timeout: 5000,
        interval: 10000,
        retries: 3,
        successThreshold: 2,
        allowedStatusCodes: [200, 204],
        headers: {
          'X-Health-Check': 'true'
        }
      }],
      [Framework.REMIX, {
        endpoints: ['/health', '/resources/health'],
        timeout: 5000,
        interval: 10000,
        retries: 3,
        successThreshold: 2,
        allowedStatusCodes: [200, 204]
      }],
      [Framework.ASTRO, {
        endpoints: ['/health.json', '/api/health'],
        timeout: 5000,
        interval: 10000,
        retries: 3,
        successThreshold: 2,
        allowedStatusCodes: [200, 204]
      }]
    ]);
  }

  async isHealthy(containerId: string): Promise<boolean> {
    try {
      logger.info(`Starting health check for container ${containerId}`);

      // Get container details
      const container = this.docker.getContainer(containerId);
      const containerInfo = await container.inspect();

      if (!containerInfo.State.Running) {
        logger.error(`Container ${containerId} is not running`);
        return false;
      }

      // Get deployment details for framework-specific checks
      const deployment = await prisma.deployment.findFirst({
        where: { containerId }
      });

      if (!deployment) {
        logger.error(`No deployment found for container ${containerId}`);
        return false;
      }

      // Get framework-specific health check config
      const config = this.frameworkConfigs.get(deployment.framework as Framework) || this.getDefaultConfig();

      // Perform health checks
      const results = await this.performHealthChecks(containerId, config);
      
      // Check Docker health status
      const dockerHealth = await this.checkDockerHealth(container);
      
      // Check container metrics
      const metricsHealth = await this.checkContainerMetrics(container);

      // Combine all health check results
      const isHealthy = results.every(r => r.success) && dockerHealth && metricsHealth;

      // Log results
      logger.info(`Health check completed for ${containerId}`, {
        containerId,
        isHealthy,
        results,
        dockerHealth,
        metricsHealth
      });

      // Store health check results
      await this.storeHealthCheckResults(deployment.id, {
        success: isHealthy,
        timestamp: new Date(),
        results,
        dockerHealth,
        metricsHealth
      });

      return isHealthy;
    } catch (error) {
      logger.error(`Health check failed for container ${containerId}:`, error);
      return false;
    }
  }

  private async performHealthChecks(
    containerId: string,
    config: HealthCheckConfig
  ): Promise<HealthCheckResult[]> {
    const results: HealthCheckResult[] = [];
    let successCount = 0;

    for (let attempt = 0; attempt < config.retries; attempt++) {
      const endpointResults = await Promise.all(
        config.endpoints.map(endpoint => this.checkEndpoint(containerId, endpoint, config))
      );

      const attemptSuccess = endpointResults.every(r => r.success);
      if (attemptSuccess) {
        successCount++;
        if (successCount >= config.successThreshold) {
          return endpointResults;
        }
      }

      results.push(...endpointResults);
      if (attempt < config.retries - 1) {
        await new Promise(resolve => setTimeout(resolve, config.interval));
      }
    }

    return results;
  }

  private async checkEndpoint(
    containerId: string,
    endpoint: string,
    config: HealthCheckConfig
  ): Promise<HealthCheckResult> {
    const startTime = Date.now();
    try {
      const containerIp = await this.getContainerIp(containerId);
      const url = `http://${containerIp}:3000${endpoint}`;

      const response = await fetch(url, {
        method: 'GET',
        headers: config.headers,
        timeout: config.timeout
      });

      const responseTime = Date.now() - startTime;

      return {
        success: config.allowedStatusCodes.includes(response.status),
        responseTime,
        statusCode: response.status
      };
    } catch (error) {
      return {
        success: false,
        responseTime: Date.now() - startTime,
        statusCode: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async checkDockerHealth(container: Docker.Container): Promise<boolean> {
    try {
      const info = await container.inspect();
      const healthcheck = info.State.Health;

      if (!healthcheck) {
        return true; // No healthcheck configured, assume healthy
      }

      return healthcheck.Status === 'healthy';
    } catch (error) {
      logger.error('Docker health check failed:', error);
      return false;
    }
  }

  private async checkContainerMetrics(container: Docker.Container): Promise<boolean> {
    try {
      const stats = await container.stats({ stream: false });
      
      // Calculate CPU usage percentage
      const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
      const systemDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
      const cpuUsage = (cpuDelta / systemDelta) * 100;

      // Calculate memory usage percentage
      const memoryUsage = (stats.memory_stats.usage / stats.memory_stats.limit) * 100;

      // Define thresholds
      const CPU_THRESHOLD = 90; // 90% CPU usage
      const MEMORY_THRESHOLD = 85; // 85% memory usage

      return cpuUsage < CPU_THRESHOLD && memoryUsage < MEMORY_THRESHOLD;
    } catch (error) {
      logger.error('Container metrics check failed:', error);
      return false;
    }
  }

  private async getContainerIp(containerId: string): Promise<string> {
    const container = this.docker.getContainer(containerId);
    const info = await container.inspect();
    const networks = info.NetworkSettings.Networks;
    const network = Object.values(networks)[0];
    
    if (!network || !network.IPAddress) {
      throw new Error(`No IP address found for container ${containerId}`);
    }

    return network.IPAddress;
  }

  private getDefaultConfig(): HealthCheckConfig {
    return {
      endpoints: ['/health', '/api/health'],
      timeout: 5000,
      interval: 10000,
      retries: 3,
      successThreshold: 2,
      allowedStatusCodes: [200, 204]
    };
  }
  private async storeHealthCheckResults(
    deploymentId: string,
    results: unknown
  ): Promise<void> {
    await prisma.deployment.update({
      where: { id: deploymentId },
      data: {
        healthCheckResults: results as Prisma.InputJsonValue,
        lastHealthCheck: new Date()
      }
    });
  }

  async waitForHealthy(
    containerId: string,
    timeout: number = 300000 // 5 minutes default timeout
  ): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (await this.isHealthy(containerId)) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds between checks
    }
    
    return false;
  }
} 