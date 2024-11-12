import Docker from 'dockerode';
import { Deployment } from '@/types/index';
import { LoadBalancerService } from '../LoadBalancerService';
import { HealthCheckService } from '../HealthCheckService';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { ContainerManager } from '../ContainerManager';
import { DockerNetworkService } from '../DockerNetworkService';

interface Environment {
  id: string;
  name: string;
  containerId: string;
  networkId: string;
  deployment: Deployment;
  status: 'CREATING' | 'RUNNING' | 'FAILED' | 'DESTROYED';
}

export class BlueGreenDeployer {
  constructor(
    private readonly docker: Docker,
    private readonly loadBalancer: LoadBalancerService,
    private readonly healthCheck: HealthCheckService,
    private readonly containerManager: ContainerManager,
    private readonly networkService: DockerNetworkService
  ) {}

  async deploy(deployment: Deployment): Promise<void> {
    try {
      logger.info(`Starting blue-green deployment for deployment ${deployment.id}`);

      // Get current production environment if exists
      const currentEnv = await this.getCurrentEnvironment(deployment.projectId);
      const blueEnv = currentEnv || await this.createEnvironment('blue', deployment);
      const greenEnv = await this.createEnvironment('green', deployment);

      // Warm up new environment
      await this.warmupEnvironment(greenEnv);
      
      // Perform health checks
      const isHealthy = await this.healthCheck.isHealthy(greenEnv.containerId);
      
      if (isHealthy) {
        logger.info(`Health checks passed for environment ${greenEnv.id}`);
        
        // Switch traffic
        await this.loadBalancer.switchTraffic(
          blueEnv.containerId, 
          greenEnv.containerId,
          deployment.projectId
        );

        // Update deployment status
        await this.updateDeploymentStatus(deployment.id, 'DEPLOYED');

        // Keep old environment for rollback window
        setTimeout(() => this.cleanup(blueEnv), 3600000); // 1 hour
        
        logger.info(`Successfully deployed ${deployment.id} to green environment`);
      } else {
        logger.error(`Health checks failed for environment ${greenEnv.id}`);
        await this.rollback(blueEnv, greenEnv);
      }
    } catch (error) {
      logger.error(`Blue-green deployment failed for ${deployment.id}:`, error);
      await this.updateDeploymentStatus(deployment.id, 'FAILED');
      throw error;
    }
  }

  private async getCurrentEnvironment(projectId: string): Promise<Environment | null> {
    const currentDeployment = await prisma.deployment.findFirst({
      where: {
        projectId,
        status: 'DEPLOYED'
      },
      select: {
        id: true,
        projectId: true,
        userId: true,
        buildCommand: true,
        nodeVersion: true,
        version: true,
        commitHash: true,
        branch: true,
        environmentId: true,
        buildLogs: true,
        status: true,
        containerId: true,
        containerPort: true,
        memory: true,
        cpu: true,
        createdAt: true,
        updatedAt: true,
        url: true,
       //buildPath: true,
        //env: true
      }
    });

    if (!currentDeployment || !currentDeployment.containerId) {
      return null;
    }

    return {
      id: currentDeployment.id,
      name: 'blue',
      containerId: currentDeployment.containerId,
      networkId: currentDeployment.environmentId,
      deployment: currentDeployment as unknown as Deployment,
      status: 'RUNNING'
    };
  }

  private async createEnvironment(name: string, deployment: Deployment): Promise<Environment> {
    logger.info(`Creating ${name} environment for deployment ${deployment.id}`);

    try {
      // Create network for the environment
      const network = await this.networkService.createNetwork(`${deployment.id}-${name}`);

      // Deploy container
      const container = await this.containerManager.deploy({
        deploymentId: deployment.id,
        buildPath: deployment.buildPath || '',
        framework: deployment.framework,
        env: deployment.env || {}
      });

      const environment: Environment = {
        id: `${deployment.id}-${name}`,
        name,
        containerId: container.id,
        networkId: network.id,
        deployment,
        status: 'RUNNING'
      };

      logger.info(`Successfully created ${name} environment`, environment);
      return environment;
    } catch (error) {
      logger.error(`Failed to create ${name} environment:`, error);
      throw error;
    }
  }

  private async warmupEnvironment(environment: Environment): Promise<void> {
    logger.info(`Warming up environment ${environment.id}`);
    
    try {
      // Wait for container to be ready
      await this.containerManager.waitForReady(environment.containerId);

      // Send warmup requests
      const warmupEndpoints = ['/', '/api/health'];
      const warmupPromises = warmupEndpoints.map(endpoint =>
        fetch(`http://localhost:3000${endpoint}`)
          .then(response => {
            if (!response.ok) {
              throw new Error(`Warmup request to ${endpoint} failed`);
            }
          })
      );

      await Promise.all(warmupPromises);
      logger.info(`Successfully warmed up environment ${environment.id}`);
    } catch (error) {
      logger.error(`Environment warmup failed:`, error);
      throw error;
    }
  }

  private async rollback(blueEnv: Environment, greenEnv: Environment): Promise<void> {
    logger.warn(`Rolling back deployment ${greenEnv.deployment.id}`);

    try {
      // Switch traffic back to blue environment
      await this.loadBalancer.switchTraffic(
        greenEnv.containerId,
        blueEnv.containerId,
        blueEnv.deployment.projectId
      );

      // Update deployment status
      await this.updateDeploymentStatus(greenEnv.deployment.id, 'FAILED');

      // Clean up failed green environment
      await this.cleanup(greenEnv);

      logger.info(`Successfully rolled back to ${blueEnv.id}`);
    } catch (error) {
      logger.error(`Rollback failed:`, error);
      throw error;
    }
  }

  private async cleanup(environment: Environment): Promise<void> {
    logger.info(`Cleaning up environment ${environment.id}`);

    try {
      // Stop and remove container
      await this.containerManager.cleanup(environment.containerId);

      // Remove network
      await this.networkService.removeNetwork(environment.networkId);

      logger.info(`Successfully cleaned up environment ${environment.id}`);
    } catch (error) {
      logger.error(`Environment cleanup failed:`, error);
      throw error;
    }
  }

  private async updateDeploymentStatus(
    deploymentId: string,
    status: 'DEPLOYED' | 'FAILED'
  ): Promise<void> {
    await prisma.deployment.update({
      where: { id: deploymentId },
      data: { status }
    });
  }
}