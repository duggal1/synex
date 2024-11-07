import { prisma } from '@/lib/prisma';
import { DockerService } from './DockerService';
import { DomainService } from './DomainService';
import { StorageService } from './StorageService';
import { BuildService } from './BuildService';
import { ProjectConfig, DeploymentStatus, BuildConfig } from '@/types';
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
      if (!config.buildCommand) {
        throw new Error('buildCommand is required');
      }
      if (!config.nodeVersion) {
        throw new Error('nodeVersion is required');
      }
      if (!config.userId) {
        throw new Error('userId is required');
      }

      const deployment = await prisma.deployment.create({
        data: {
          projectId,
          userId,
          status: 'QUEUED' as DeploymentStatus,
          version: config.version,
          buildLogs: [],
          environmentId: config.environment,
          buildCommand: config.buildCommand,
          nodeVersion: config.nodeVersion,
        }
      });

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
      await this.updateDeploymentStatus(deploymentId, 'BUILDING');

      const buildPath = await this.storageService.prepareBuildDirectory(deploymentId, files);

      const envVars = await this.getEnvironmentVariables(config.projectId, config.environment);

      const buildConfig: BuildConfig = {
        projectId: config.projectId,
        userId: config.userId,
        framework: config.framework,
        buildCommand: config.buildCommand,
        nodeVersion: config.nodeVersion,
        env: envVars
      };

      const buildResult = await this.buildService.build(
        buildConfig.projectId,
        buildConfig.userId,
        config.environment,
        buildConfig
      );

      const imageName = await this.dockerService.buildImage(
        config.projectId,
        buildPath,
        envVars
      );

      const port = await this.getAvailablePort();

      const containerId = await this.dockerService.runContainer(
        imageName,
        config.projectId,
        port
      );

      await this.domainService.setupRouting(config.projectId, port);

      await prisma.deployment.update({
        where: { id: deploymentId },
        data: {
          status: 'DEPLOYED' as DeploymentStatus,
          containerId,
          containerPort: port,
          buildTime: buildResult.buildTime,
        }
      });

      await this.cleanupOldDeployments(config.projectId);

      const project = await prisma.project.findUnique({
        where: { id: config.projectId }
      });

      if (project) {
        const domain = await this.domainService.createProjectSubdomain(
          config.projectId,
          project.name
        );

        await prisma.deployment.update({
          where: { id: deploymentId },
          data: {
            deploymentUrl: domain.domain,
            status: 'DEPLOYED' as DeploymentStatus
          }
        });
      }

    } catch (error) {
      logger.error('Deployment processing failed', { deploymentId, error });
      if (error instanceof Error) {
        await this.updateDeploymentStatus(deploymentId, 'FAILED', error.message);
      } else {
        await this.updateDeploymentStatus(deploymentId, 'FAILED', 'Unknown error');
      }
      throw error;
    }
  }

  private async updateDeploymentStatus(
    deploymentId: string,
    status: DeploymentStatus,
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
    return 3000; // Simplified for example
  }

  private async cleanupOldDeployments(projectId: string) {
    const oldDeployments = await prisma.deployment.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
      skip: 5
    });

    for (const deployment of oldDeployments) {
      if (deployment.containerId) {
        try {
          const container = this.dockerService.getContainer(deployment.containerId);
          await container.stop();
          await container.remove();
        } catch (error) {
          logger.error('Container cleanup failed', { deploymentId: deployment.id, error });
        }
      }
    }
  }
} 