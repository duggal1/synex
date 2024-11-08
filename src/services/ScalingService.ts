/* eslint-disable @typescript-eslint/no-unused-vars */
import { prisma } from '@/lib/prisma';
import Docker from 'dockerode';
import { Redis } from 'ioredis';
import { logger } from '@/lib/logger';
import { EventEmitter } from 'events';
import { MetricsCollector } from './MetricsCollector';
import { 
  Project, 
  Deployment, 
  SubscriptionStatus,
  DeploymentStatus 
} from '@prisma/client';

interface ScalingRule {
  metric: 'cpu' | 'memory' | 'requests' | 'responseTime';
  threshold: number;
  action: 'scale_up' | 'scale_down';
  cooldown: number;
}

interface ContainerMetrics {
  cpu: number;
  memory: number;
  requests: number;
  responseTime: number;
}

export class ScalingService extends EventEmitter {
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
    this.startMonitoring();
  }

  async configureScaling(projectId: string): Promise<void> {
    try {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          deployments: {
            where: { status: 'DEPLOYED' }
          },
          user: {
            select: { subscriptionStatus: true }
          }
        }
      });

      if (!project) throw new Error('Project not found');

      // Setup scaling rules based on subscription
      await this.setupScalingRules(project);

      // Initialize container pool
      await this.initializeContainerPool(project);

      // Start monitoring for this project
      await this.monitorProject(project.id);

      logger.info(`Scaling configured for project ${projectId}`);
    } catch (error) {
      logger.error('Failed to configure scaling:', error);
      throw error;
    }
  }

  private async setupScalingRules(project: Project & { user: { subscriptionStatus: SubscriptionStatus } }) {
    const rules: ScalingRule[] = [
      {
        metric: 'cpu',
        threshold: 80,
        action: 'scale_up',
        cooldown: 300
      },
      {
        metric: 'memory',
        threshold: 85,
        action: 'scale_up',
        cooldown: 300
      },
      {
        metric: 'requests',
        threshold: this.getRequestThreshold(project.user.subscriptionStatus),
        action: 'scale_up',
        cooldown: 180
      },
      {
        metric: 'responseTime',
        threshold: 1000, // 1 second
        action: 'scale_up',
        cooldown: 240
      }
    ];

    this.scalingRules.set(project.id, rules);
  }

  private getRequestThreshold(subscriptionStatus: SubscriptionStatus): number {
    const thresholds: Record<SubscriptionStatus, number> = {
      FREE: 500,
      PRO: 2000,
      ENTERPRISE: 5000
    };
    return thresholds[subscriptionStatus];
  }

  private async initializeContainerPool(project: Project & { user: { subscriptionStatus: SubscriptionStatus } }): Promise<void> {
    const minContainers = this.getMinContainers(project.user.subscriptionStatus);
    const currentContainers = await this.getProjectContainers(project.id);

    if (currentContainers.length < minContainers) {
      for (let i = currentContainers.length; i < minContainers; i++) {
        await this.createContainer(project);
      }
    }
  }

  private async monitorProject(projectId: string): Promise<void> {
    const interval = setInterval(async () => {
      try {
        const metrics = await this.collectMetrics(projectId);
        await this.evaluateScaling(projectId, metrics);
      } catch (error) {
        logger.error('Monitoring failed:', error);
      }
    }, 30000); // Check every 30 seconds

    await this.redis.set(`scaling:monitor:${projectId}`, interval[Symbol.toPrimitive]());
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

  private async evaluateScaling(projectId: string, metrics: ContainerMetrics): Promise<void> {
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
    const lastScaleTime = this.cooldowns.get(`${projectId}:${rule.action}`);
    
    if (lastScaleTime && Date.now() - lastScaleTime < rule.cooldown * 1000) {
      return false;
    }

    const currentValue = metrics[rule.metric];
    return rule.action === 'scale_up'
      ? currentValue > rule.threshold
      : currentValue < rule.threshold;
  }

  private async executeScaling(projectId: string, action: 'scale_up' | 'scale_down'): Promise<void> {
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

      if (!project) throw new Error('Project not found');

      const containers = await this.getProjectContainers(projectId);
      const currentCount = containers.length;

      if (action === 'scale_up') {
        if (await this.canScaleUp(project.user.subscriptionStatus, currentCount)) {
          await this.createContainer(project);
        }
      } else {
        if (await this.canScaleDown(project.user.subscriptionStatus, currentCount)) {
          await this.removeContainer(containers[containers.length - 1]);
        }
      }

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

  private getMinContainers(subscriptionStatus: SubscriptionStatus): number {
    const mins: Record<SubscriptionStatus, number> = {
      FREE: 1,
      PRO: 2,
      ENTERPRISE: 3
    };
    return mins[subscriptionStatus];
  }

  private async canScaleUp(subscriptionStatus: SubscriptionStatus, currentCount: number): Promise<boolean> {
    const limits: Record<SubscriptionStatus, number> = {
      FREE: 2,
      PRO: 5,
      ENTERPRISE: 20
    };
    return currentCount < limits[subscriptionStatus];
  }

  private async canScaleDown(subscriptionStatus: SubscriptionStatus, currentCount: number): Promise<boolean> {
    return currentCount > this.getMinContainers(subscriptionStatus);
  }

  private async createContainer(project: Project): Promise<Docker.Container> {
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

  private async removeContainer(container: Docker.Container): Promise<void> {
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
        projectId
      }
    });

    return variables.map(v => `${v.key}=${v.value}`);
  }

  private startMonitoring(): void {
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