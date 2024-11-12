/* eslint-disable @typescript-eslint/no-unused-vars */
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { BlueGreenDeployer } from './BlueGreenDeployer';
import { HealthCheckService } from '../HealthCheckService';
import { MetricsCollector } from '@/lib/metrics';
import { DeploymentStatus, Framework, Deployment } from '@/types/index';
import Docker from 'dockerode';
import { LoadBalancerService } from '../LoadBalancerService';
import { ContainerManager } from '../ContainerManager';
import { DockerNetworkService } from '../DockerNetworkService';

interface DeploymentStage {
  name: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  startTime?: Date;
  endTime?: Date;
  error?: string;
}

interface ValidationMetrics {
  errorRate: number;
  latencyP95: number;
  cpuUsage: number;
}

interface ValidationThresholds {
  errorRate: number;
  latencyP95: number;
  cpuUsage: number;
}

export class ZeroDowntimeDeployer {
  private readonly blueGreenDeployer: BlueGreenDeployer;
  private readonly healthCheck: HealthCheckService;
  private readonly metricsCollector: MetricsCollector;
  private readonly docker: Docker;
  private readonly containerManager: ContainerManager;
  private readonly networkService: DockerNetworkService;

  constructor() {
    this.docker = new Docker();
    this.healthCheck = new HealthCheckService(this.docker);
    this.metricsCollector = new MetricsCollector();
    this.containerManager = new ContainerManager(this.docker);
    this.networkService = new DockerNetworkService();
    
    const loadBalancer = new LoadBalancerService(this.docker);
    
    this.blueGreenDeployer = new BlueGreenDeployer(
      this.docker,
      loadBalancer,
      this.healthCheck,
      this.containerManager,
      this.networkService
    );
  }

  async deploy(projectId: string, newVersion: string): Promise<void> {
    const stages: DeploymentStage[] = this.initializeStages();
    let currentDeployment;

    try {
      // Get project details
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { environments: true }
      });

      if (!project) {
        throw new Error(`Project ${projectId} not found`);
      }

      // Create new deployment
      currentDeployment = await this.createDeployment(project.id, newVersion);
      
      // Execute deployment stages
      await this.executePreWarmStage(stages[0], currentDeployment.id);
      await this.executeTrafficShiftStage(stages[1], currentDeployment.id);
      await this.executeHealthCheckStage(stages[2], currentDeployment.id);
      await this.executeRollbackReadyStage(stages[3], currentDeployment.id);
      // Update deployment status
      await this.updateDeploymentStatus(currentDeployment.id, DeploymentStatus.DEPLOYED);
      
      logger.info(`Zero-downtime deployment completed for project ${projectId}`);
    } catch (error) {
      logger.error(`Deployment failed for project ${projectId}:`, error);
      
      if (currentDeployment) {
        await this.handleDeploymentFailure(currentDeployment.id);
      }
      
      throw error;
    }
  }

  private initializeStages(): DeploymentStage[] {
    return [
      { name: 'pre-warm', status: 'PENDING' },
      { name: 'traffic-shift', status: 'PENDING' },
      { name: 'health-check', status: 'PENDING' },
      { name: 'rollback-ready', status: 'PENDING' }
    ];
  }

  private async createDeployment(projectId: string, version: string) {
    return await prisma.deployment.create({
      data: {
        projectId,
        version,
        status: 'QUEUED',
        buildCommand: 'npm run build',
        userId: '', // Required field based on the lint error
        nodeVersion: '18.x',
        branch: 'main',
        buildLogs: [],
        memory: 0,
        cpu: 0,
        environmentId: '', // Will be set during deployment
      }
    });
  }

  private async executePreWarmStage(stage: DeploymentStage, deploymentId: string): Promise<void> {
    stage.status = 'IN_PROGRESS';
    stage.startTime = new Date();

    try {
      const deployment = await this.getDeployment(deploymentId);
      
      // Create a properly typed deployment object
      const typedDeployment: Deployment = {
        id: deployment.id,
        projectId: deployment.projectId,
        userId: deployment.userId,
        buildCommand: deployment.buildCommand,
        nodeVersion: deployment.nodeVersion,
        version: deployment.version,
        commitHash: deployment.commitHash,
        branch: deployment.branch,
        environmentId: deployment.environmentId,
        buildLogs: deployment.buildLogs,
        status: deployment.status as DeploymentStatus,
        framework: deployment.project.framework as Framework,
        containerId: deployment.containerId || undefined,
        containerPort: deployment.containerPort || undefined,
        healthCheckResults: deployment.healthCheckResults || null,
        lastHealthCheck: deployment.lastHealthCheck || null,
        memory: deployment.memory || 0,
        cpu: deployment.cpu || 0,
        createdAt: deployment.createdAt,
        updatedAt: deployment.updatedAt,
        url: deployment.url || null,
        env: {},
        buildPath: '/app/build' // Default build path
      };

      await this.blueGreenDeployer.deploy(typedDeployment);
      await this.waitForContainerReadiness(deploymentId);
      stage.status = 'COMPLETED';
    } catch (error) {
      stage.status = 'FAILED';
      stage.error = error instanceof Error ? error.message : 'Pre-warm stage failed';
      throw error;
    } finally {
      stage.endTime = new Date();
    }
  }

  private async executeTrafficShiftStage(stage: DeploymentStage, deploymentId: string): Promise<void> {
    stage.status = 'IN_PROGRESS';
    stage.startTime = new Date();

    try {
      // Gradually shift traffic to new version
      await this.gradualTrafficShift(deploymentId);
      stage.status = 'COMPLETED';
    } catch (error) {
      stage.status = 'FAILED';
      stage.error = error instanceof Error ? error.message : 'Traffic shift stage failed';
      throw error;
    } finally {
      stage.endTime = new Date();
    }
  }

  private async executeHealthCheckStage(stage: DeploymentStage, deploymentId: string): Promise<void> {
    stage.status = 'IN_PROGRESS';
    stage.startTime = new Date();

    try {
      // Monitor health and metrics
      const isHealthy = await this.monitorDeploymentHealth(deploymentId);
      
      if (!isHealthy) {
        throw new Error('Health check failed');
      }

      stage.status = 'COMPLETED';
    } catch (error) {
      stage.status = 'FAILED';
      stage.error = error instanceof Error ? error.message : 'Health check stage failed';
      throw error;
    } finally {
      stage.endTime = new Date();
    }
  }

  private async executeRollbackReadyStage(stage: DeploymentStage, deploymentId: string): Promise<void> {
    stage.status = 'IN_PROGRESS';
    stage.startTime = new Date();

    try {
      // Keep old version ready for rollback for 1 hour
      await this.setupRollbackWindow(deploymentId);
      stage.status = 'COMPLETED';
    } catch (error) {
      stage.status = 'FAILED';
      stage.error = error instanceof Error ? error.message : 'Rollback ready stage failed';
      throw error;
    } finally {
      stage.endTime = new Date();
    }
  }

  private async getDeployment(deploymentId: string) {
    const deployment = await prisma.deployment.findUnique({
      where: { id: deploymentId },
      include: {
        project: {
          select: {
            id: true,
            framework: true,
            buildCommand: true,
            nodeVersion: true,
            rootDirectory: true
          }
        }
      }
    });

    if (!deployment) {
      throw new Error(`Deployment ${deploymentId} not found`);
    }

    return deployment;
  }

  private async waitForContainerReadiness(deploymentId: string): Promise<void> {
    const deployment = await this.getDeployment(deploymentId);
    if (!deployment.containerId) {
      throw new Error('Container ID not found');
    }

    await this.healthCheck.waitForHealthy(deployment.containerId);
  }

  private async gradualTrafficShift(deploymentId: string): Promise<void> {
    const deployment = await this.getDeployment(deploymentId);
    const trafficSteps = [0.1, 0.25, 0.5, 0.75, 1.0];
    
    for (const trafficPercentage of trafficSteps) {
      await this.shiftTraffic(deployment.id, trafficPercentage);
      await this.validateDeploymentMetrics(deployment.id);
      await new Promise(resolve => setTimeout(resolve, 30000)); // 30 second pause between shifts
    }
  }

  private async shiftTraffic(deploymentId: string, percentage: number): Promise<void> {
    // Implementation would depend on your load balancer service
    logger.info(`Shifting ${percentage * 100}% traffic to deployment ${deploymentId}`);
  }

  private async validateDeploymentMetrics(deploymentId: string): Promise<boolean> {
    const metrics = await this.collectMetrics(deploymentId);
    const thresholds = this.getValidationThresholds();

    return (
      metrics.errorRate <= thresholds.errorRate &&
      metrics.latencyP95 <= thresholds.latencyP95 &&
      metrics.cpuUsage <= thresholds.cpuUsage
    );
  }

  private async collectMetrics(deploymentId: string): Promise<ValidationMetrics> {
    const deployment = await this.getDeployment(deploymentId);
    
    return {
      errorRate: await this.metricsCollector.getErrorRate(deployment.id),
      latencyP95: await this.metricsCollector.getLatencyP95(deployment.id),
      cpuUsage: await this.metricsCollector.getCpuUsage(deployment.id)
    };
  }

  private getValidationThresholds(): ValidationThresholds {
    return {
      errorRate: 0.1, // 10% error rate
      latencyP95: 500, // 500ms
      cpuUsage: 80 // 80% CPU usage
    };
  }

  private async monitorDeploymentHealth(deploymentId: string): Promise<boolean> {
    const monitoringDuration = 600000; // 10 minutes
    const checkInterval = 30000; // 30 seconds
    const startTime = Date.now();

    while (Date.now() - startTime < monitoringDuration) {
      const isHealthy = await this.validateDeploymentMetrics(deploymentId);
      
      if (!isHealthy) {
        return false;
      }

      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }

    return true;
  }

  private async setupRollbackWindow(deploymentId: string): Promise<void> {
    const deployment = await this.getDeployment(deploymentId);
    
    // Keep old version available for 1 hour
    setTimeout(async () => {
      try {
        await this.cleanupOldDeployment(deployment.id);
      } catch (error) {
        logger.error(`Failed to cleanup old deployment ${deployment.id}:`, error);
      }
    }, 3600000); // 1 hour
  }

  private async cleanupOldDeployment(deploymentId: string): Promise<void> {
    const deployment = await this.getDeployment(deploymentId);
    
    if (deployment.containerId) {
      const container = this.docker.getContainer(deployment.containerId);
      await container.remove({ force: true });
    }
  }
  private async handleDeploymentFailure(deploymentId: string): Promise<void> {
    await this.updateDeploymentStatus(deploymentId, DeploymentStatus.FAILED);
    await this.rollback(deploymentId);
  }

  private async rollback(deploymentId: string): Promise<void> {
    // Implementation would depend on your rollback strategy
    logger.warn(`Rolling back deployment ${deploymentId}`);
  }

  private async updateDeploymentStatus(
    deploymentId: string, 
    status: DeploymentStatus
  ): Promise<void> {
    await prisma.deployment.update({
      where: { id: deploymentId },
      data: { status }
    });
  }
} 