/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { prisma } from '@/lib/prisma';
import Docker from 'dockerode';
import { Redis } from 'ioredis';
import { logger } from '@/lib/logger';
import { MetricsCollector } from '@/lib/metrics';
import { EventEmitter } from 'events';
import { SubscriptionStatus } from '@prisma/client';

interface ScalingRule {
  metric: 'cpu' | 'memory' | 'requests';
  threshold: number;
  action: 'scale_up' | 'scale_down';
  cooldown: number; // seconds
}

interface ContainerMetrics {
  cpu: number;
  memory: number;
  requests: number;
  responseTime: number;
}

export class AutoScalingService extends EventEmitter {
  private docker: Docker;
  private redis: Redis;
  private metricsCollector: MetricsCollector;
  private scalingRules: Map<string, ScalingRule[]>;
  private cooldowns: Map<string, number>;

  constructor() {
    super();
    this.docker = new Docker();
    this.redis = new Redis(process.env.REDIS_URL!);
    this.metricsCollector = new MetricsCollector();
    this.scalingRules = new Map();
    this.cooldowns = new Map();

    // Start monitoring loop
    this.startMonitoring();
  }

  async scaleProject(projectId: string) {
    try {
      // Get project configuration
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          deployments: {
            where: { status: 'DEPLOYED' }
          }
        }
      });

      if (!project) throw new Error('Project not found');

      // Setup scaling rules
      await this.setupScalingRules(project);

      // Initialize container pool
      await this.initializeContainerPool(project);

      // Start monitoring for this project
      await this.monitorProject(project.id);

      return true;
    } catch (error) {
      logger.error('Failed to setup auto-scaling:', error);
      throw error;
    }
  }

  private async setupScalingRules(project: any) {
    const rules: ScalingRule[] = [
      {
        metric: 'cpu',
        threshold: 80, // 80% CPU usage
        action: 'scale_up',
        cooldown: 300 // 5 minutes
      },
      {
        metric: 'memory',
        threshold: 85, // 85% memory usage
        action: 'scale_up',
        cooldown: 300
      },
      {
        metric: 'requests',
        threshold: 1000, // requests per minute
        action: 'scale_up',
        cooldown: 180
      },
      {
        metric: 'cpu',
        threshold: 30, // 30% CPU usage
        action: 'scale_down',
        cooldown: 600 // 10 minutes
      }
    ];

    this.scalingRules.set(project.id, rules);
  }

  private async initializeContainerPool(project: any) {
    const minContainers = project.subscriptionStatus === 'FREE' ? 1 : 2;
    const currentContainers = await this.getProjectContainers(project.id);

    if (currentContainers.length < minContainers) {
      for (let i = currentContainers.length; i < minContainers; i++) {
        await this.createContainer(project);
      }
    }
  }

  private async monitorProject(projectId: string) {
    const interval = setInterval(async () => {
      try {
        const metrics = await this.collectMetrics(projectId);
        await this.evaluateScaling(projectId, metrics);
      } catch (error) {
        logger.error('Monitoring failed:', error);
      }
    }, 30000); // Check every 30 seconds

    // Store monitoring interval
    this.redis.set(`scaling:monitor:${projectId}`, interval[Symbol.toPrimitive]());
  }

  private async collectMetrics(projectId: string): Promise<ContainerMetrics> {
    const containers = await this.getProjectContainers(projectId);
    const containerMetrics = await Promise.all(
      containers.map(c => this.metricsCollector.getContainerStats(c.id))
    );

    return {
      cpu: await this.metricsCollector.calculateAverageCPU(containerMetrics),
      memory: await this.metricsCollector.calculateAverageMemory(containerMetrics),
      requests: await this.metricsCollector.getRequestRate(projectId),
      responseTime: await this.metricsCollector.getAverageResponseTime(projectId)
    };
  }

  private async evaluateScaling(projectId: string, metrics: ContainerMetrics) {
    const rules = this.scalingRules.get(projectId);
    if (!rules) return;

    for (const rule of rules) {
      if (await this.shouldScale(projectId, rule, metrics)) {
        await this.executeScaling(projectId, rule.action);
      }
    }
  }

  private async shouldScale(
    projectId: string,
    rule: ScalingRule,
    metrics: ContainerMetrics
  ): Promise<boolean> {
    // Check cooldown
    const lastScaleTime = this.cooldowns.get(`${projectId}:${rule.action}`);
    if (lastScaleTime && Date.now() - lastScaleTime < rule.cooldown * 1000) {
      return false;
    }

    // Check metric threshold
    const currentValue = metrics[rule.metric];
    return rule.action === 'scale_up'
      ? currentValue > rule.threshold
      : currentValue < rule.threshold;
  }

  private async executeScaling(projectId: string, action: 'scale_up' | 'scale_down') {
    try {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          user: {
            select: {
              subscriptionStatus: true
            }
          }
        }
      });

      if (!project) {
        throw new Error('Project not found');
      }

      const containers = await this.getProjectContainers(projectId);
      const currentCount = containers.length;

      if (action === 'scale_up') {
        if (await this.canScaleUp({ subscriptionStatus: project.user.subscriptionStatus }, currentCount)) {
          await this.createContainer(project);
        }
      } else {
        if (await this.canScaleDown({ subscriptionStatus: project.user.subscriptionStatus }, currentCount)) {
          await this.removeContainer(containers[containers.length - 1]);
        }
      }

      // Update cooldown
      this.cooldowns.set(`${projectId}:${action}`, Date.now());

      // Emit scaling event
      this.emit('scaled', {
        projectId,
        action,
        containerCount: action === 'scale_up' ? currentCount + 1 : currentCount - 1
      });

    } catch (error) {
      logger.error('Scaling execution failed:', error);
      throw error;
    }
  }

  private async canScaleUp(project: { subscriptionStatus: SubscriptionStatus }, currentCount: number): Promise<boolean> {
    const limits: Record<SubscriptionStatus, number> = {
      FREE: 2,
      PRO: 5,
      ENTERPRISE: 20
    };

    return currentCount < limits[project.subscriptionStatus];
  }

  private async canScaleDown(project: { subscriptionStatus: SubscriptionStatus }, currentCount: number): Promise<boolean> {
    const minContainers = project.subscriptionStatus === 'FREE' ? 1 : 2;
    return currentCount > minContainers;
  }

  private async createContainer(project: { id: string }) {
    const container = await this.docker.createContainer({
      Image: `project-${project.id}:latest`,
      name: `${project.id}-${Date.now()}`,
      HostConfig: {
        Memory: 1024 * 1024 * 1024, // 1GB
        NanoCpus: 1000000000, // 1 CPU
        RestartPolicy: {
          Name: 'always'
        }
      },
      Labels: {
        project: project.id
      },
      Env: await this.getProjectEnv(project.id)
    });

    await container.start();
    return container;
  }

  private async removeContainer(container: Docker.Container) {
    await container.stop();
    await container.remove();
  }

  private async getProjectContainers(projectId: string): Promise<Docker.Container[]> {
    const containers = await this.docker.listContainers({
      filters: {
        label: [`project=${projectId}`]
      }
    });

    return containers.map(c => this.docker.getContainer(c.Id));
  }

  private async getProjectEnv(projectId: string): Promise<string[]> {
    const variables = await prisma.envVariable.findMany({
      where: {
        environment: {
          projectId
        }
      }
    });

    return variables.map(v => `${v.key}=${v.value}`);
  }

  private startMonitoring() {
    setInterval(async () => {
      try {
        const projects = await prisma.project.findMany({
          where: { status: 'ACTIVE' }
        });

        for (const project of projects) {
          await this.monitorProject(project.id);
        }
      } catch (error) {
        logger.error('Global monitoring failed:', error);
      }
    }, 60000); // Check all projects every minute
  }
} 