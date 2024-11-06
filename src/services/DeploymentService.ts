import { prisma } from '@/lib/prisma';
import { DockerService } from './DockerService';
import { DomainService } from './DomainService';
import { StorageService } from './StorageService';
import { BuildService } from './BuildService';
import { ProjectConfig } from '@/types';
import { logger } from '@/lib/logger';

export class DeploymentService {
  private dockerService: DockerService;
  private domainService: DomainService;
  private storageService: StorageService;
  private buildService: BuildService;

  constructor() {
    this.dockerService = new DockerService();
    this.domainService = new DomainService();
    this.storageService = new StorageService();
    this.buildService = new BuildService();
  }

  async createDeployment(
    projectId: string,
    userId: string,
    files: Buffer,
    config: ProjectConfig
  ) {
    try {
      // Create deployment record
      const deployment = await prisma.deployment.create({
        data: {
          projectId,
          userId,
          status: 'QUEUED',
          version: config.version,
          buildLogs: [],
        }
      });

      // Process deployment asynchronously
      this.processDeployment(deployment.id, files, config).catch(error => {
        logger.error('Deployment processing failed', { deploymentId: deployment.id, error });
      });

      return deployment;
    } catch (error) {
      logger.error('Deployment creation failed', { projectId, error });
      throw error;
    }
  }

  private async processDeployment(
    deploymentId: string,
    files: Buffer,
    config: ProjectConfig
  ) {
    try {
      // Update status to building
      await this.updateDeploymentStatus(deploymentId, 'BUILDING');

      // Extract and prepare build directory
      const buildPath = await this.storageService.prepareBuildDirectory(deploymentId, files);

      // Get environment variables
      const envVars = await this.getEnvironmentVariables(config.projectId, config.environment);

      // Build the project
      const buildResult = await this.buildService.build(buildPath, config);

      // Build Docker image
      const imageName = await this.dockerService.buildImage(
        config.projectId,
        buildPath,
        envVars
      );

      // Get available port
      const port = await this.getAvailablePort();

      // Run container
      const containerId = await this.dockerService.runContainer(
        imageName,
        config.projectId,
        port
      );

      // Setup domain routing
      await this.domainService.setupRouting(config.projectId, port);

      // Update deployment record
      await prisma.deployment.update({
        where: { id: deploymentId },
        data: {
          status: 'DEPLOYED',
          containerId,
          containerPort: port,
          buildTime: buildResult.buildTime,
        }
      });

      // Cleanup old deployments
      await this.cleanupOldDeployments(config.projectId);

    } catch (error) {
      logger.error('Deployment processing failed', { deploymentId, error });
      await this.updateDeploymentStatus(deploymentId, 'FAILED', error.message);
      throw error;
    }
  }

  private async updateDeploymentStatus(
    deploymentId: string,
    status: string,
    error?: string
  ) {
    await prisma.deployment.update({
      where: { id: deploymentId },
      data: {
        status,
        buildLogs: error ? { push: error } : undefined
      }
    });
  }

  private async getEnvironmentVariables(
    projectId: string,
    environment: string
  ): Promise<Record<string, string>> {
    const vars = await prisma.envVariable.findMany({
      where: {
        environment: {
          projectId,
          name: environment
        }
      }
    });

    return vars.reduce((acc, { key, value }) => ({
      ...acc,
      [key]: value
    }), {});
  }

  private async getAvailablePort(): Promise<number> {
    // Implementation to find available port
    return 3000; // Simplified for example
  }

  private async cleanupOldDeployments(projectId: string) {
    // Keep only last 5 deployments
    const oldDeployments = await prisma.deployment.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      skip: 5
    });

    for (const deployment of oldDeployments) {
      if (deployment.containerId) {
        try {
          const container = await this.dockerService.docker.getContainer(deployment.containerId);
          await container.stop();
          await container.remove();
        } catch (error) {
          logger.error('Container cleanup failed', { deploymentId: deployment.id, error });
        }
      }
    }
  }
} 