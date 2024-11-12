/* eslint-disable @typescript-eslint/no-unused-vars */
import { prisma } from '@/lib/prisma';
import { BuildPipeline } from './BuildPipeline';
import { ContainerManager } from './ContainerManager';
import { DomainService } from './DomainService';
import { Framework, DeploymentStatus } from '@/types/index';
import { logger } from '@/lib/logger';
import Docker from 'dockerode';

interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
  details?: string;
}

type FrameworkValidation = (files: Buffer) => Promise<void>;

interface FrameworkValidations {
  [Framework.NEXTJS]: FrameworkValidation;
  [Framework.REMIX]: FrameworkValidation;
  [Framework.ASTRO]: FrameworkValidation;
  [Framework.STATIC]: FrameworkValidation;
}

export class DeploymentOrchestrator {
  private buildPipeline: BuildPipeline;
  private containerManager: ContainerManager;
  private domainService: DomainService;
  private docker: Docker;

  constructor() {
    this.docker = new Docker();
    this.buildPipeline = new BuildPipeline({});
    this.containerManager = new ContainerManager(this.docker);
    this.domainService = new DomainService();
  }

  async deploy(projectId: string, userId: string, files: Buffer) {
    const deployment = await this.createDeployment(projectId, userId);

    try {
      const framework = await this.detectFramework(files);
      await this.validateProject(files, framework);

      const buildResult = await this.buildPipeline.build(deployment.id, files, framework);

      const container = await this.containerManager.deploy({
        deploymentId: deployment.id,
        buildPath: buildResult.outputPath,
        framework,
        env: buildResult.env
      });

      const domain = await this.domainService.setupDomain(deployment.id);

      await this.verifyDeployment(container.id, domain.url);

      await this.updateProduction(projectId, deployment.id);

      return {
        deploymentId: deployment.id,
        url: domain.url,
        container: container.id
      };
    } catch (error) {
      if (error instanceof Error) {
        await this.handleDeploymentFailure(deployment.id, error);
      } else {
        await this.handleDeploymentFailure(deployment.id, new Error('Unknown error'));
      }
      throw error;
    }
  }

  private async createDeployment(projectId: string, userId: string) {
    return await prisma.deployment.create({
      data: {
        projectId,
        userId,
        status: 'QUEUED' as DeploymentStatus,
        version: Date.now().toString(),
        buildCommand: 'npm run build',
        nodeVersion: '18.x',
        environmentId: 'default',
        buildLogs: []
      }
    });
  }

  private async detectFramework(files: Buffer): Promise<Framework> {
    const hasNextConfig = await this.searchInFiles(files, 'next.config');
    const hasRemixConfig = await this.searchInFiles(files, 'remix.config');
    const hasAstroConfig = await this.searchInFiles(files, 'astro.config');

    if (hasNextConfig) return Framework.NEXTJS;
    if (hasRemixConfig) return Framework.REMIX; 
    if (hasAstroConfig) return Framework.ASTRO;
    
    return Framework.STATIC; // Default to static if no framework detected
  }

  private async searchInFiles(files: Buffer, configName: string): Promise<boolean> {
    return files.includes(Buffer.from(configName));
  }

  private async validateProject(files: Buffer, framework: Framework) {
    const validations: FrameworkValidations = {
      [Framework.NEXTJS]: this.validateNextJS.bind(this),
      [Framework.REMIX]: this.validateRemix.bind(this),
      [Framework.ASTRO]: this.validateAstro.bind(this),
      [Framework.STATIC]: this.validateStatic.bind(this)
    };

    await validations[framework](files);
  }

  private async validateNextJS(files: Buffer) {
    const requiredFiles = ['package.json', 'next.config.js'];
    await this.validateRequiredFiles(files, requiredFiles);
  }

  private async validateRemix(files: Buffer) {
    const requiredFiles = ['package.json', 'remix.config.js'];
    await this.validateRequiredFiles(files, requiredFiles);
  }

  private async validateAstro(files: Buffer) {
    const requiredFiles = ['package.json', 'astro.config.mjs'];
    await this.validateRequiredFiles(files, requiredFiles);
  }

  private async validateStatic(files: Buffer) {
    const requiredFiles = ['index.html'];
    await this.validateRequiredFiles(files, requiredFiles);
  }

  private async validateRequiredFiles(files: Buffer, requiredFiles: string[]) {
    for (const file of requiredFiles) {
      if (!await this.searchInFiles(files, file)) {
        throw new Error(`Missing required file: ${file}`);
      }
    }
  }

  private async verifyDeployment(containerId: string, url: string) {
    const maxRetries = 10;
    const retryDelay = 2000;

    for (let i = 0; i < maxRetries; i++) {
      try {
        const health = await this.checkContainerHealth(containerId);
        const response = await fetch(url);

        if (health.status === 'healthy' && response.ok) {
          return true;
        }
      } catch (error) {
        logger.warn(`Verification attempt ${i + 1} failed`);
      }

      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }

    throw new Error('Deployment verification failed');
  }

  private async checkContainerHealth(containerId: string): Promise<HealthCheckResult> {
    try {
      const container = this.docker.getContainer(containerId);
      const info = await container.inspect();

      if (!info.State) {
        return { status: 'unhealthy', details: 'Container state not available' };
      }

      if (info.State.Health) {
        return {
          status: info.State.Health.Status === 'healthy' ? 'healthy' : 'unhealthy',
          details: info.State.Health.Log?.[0]?.Output
        };
      }

      // If no health check is configured, check if container is running
      return {
        status: info.State.Running ? 'healthy' : 'unhealthy',
        details: info.State.Status
      };
    } catch (error) {
      logger.error('Container health check failed:', error);
      return { status: 'unhealthy', details: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async updateProduction(projectId: string, deploymentId: string) {
    await prisma.$transaction(async (tx) => {
      await tx.project.update({
        where: { id: projectId },
        data: { productionDeploymentId: deploymentId }
      });

      const oldDeployments = await tx.deployment.findMany({
        where: { 
          projectId,
          NOT: { id: deploymentId },
          status: 'DEPLOYED' as DeploymentStatus
        }
      });

      for (const deployment of oldDeployments) {
        if (deployment.containerId) {
          const container = this.docker.getContainer(deployment.containerId);
          await container.stop();
          await container.remove();
        }
      }
    });
  }

  private async handleDeploymentFailure(deploymentId: string, error: Error) {
    await prisma.deployment.update({
      where: { id: deploymentId },
      data: {
        status: 'FAILED' as DeploymentStatus,
        buildLogs: [{ message: error.message, timestamp: new Date() }]
      }
    });

    try {
      const deployment = await prisma.deployment.findUnique({
        where: { id: deploymentId },
        select: { containerId: true }
      });

      if (deployment?.containerId) {
        const container = this.docker.getContainer(deployment.containerId);
        await container.stop();
        await container.remove();
      }
    } catch (cleanupError) {
      logger.error('Cleanup after deployment failure failed:', cleanupError);
    }

    logger.error('Deployment failed', { deploymentId, error });
  }
} 