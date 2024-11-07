/* eslint-disable @typescript-eslint/no-unused-vars */
import { prisma } from '@/lib/prisma';
import { BuildPipeline } from './BuildPipeline';
import { ContainerManager } from './ContainerManager';
import { DomainService } from './DomainService';
import { Framework, DeploymentStatus } from '@/types/index';
import { logger } from '@/lib/logger';

export class DeploymentOrchestrator {
  private buildPipeline: BuildPipeline;
  private containerManager: ContainerManager;
  private domainService: DomainService;

  constructor() {
    this.buildPipeline = new BuildPipeline();
    this.containerManager = new ContainerManager();
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
        environmentId: 'default',
        buildLogs: []
      }
    });
  }

  private async detectFramework(files: Buffer): Promise<Framework> {
    const hasNextConfig = await this.searchInFiles(files, 'next.config');
    const hasRemixConfig = await this.searchInFiles(files, 'remix.config');
    const hasAstroConfig = await this.searchInFiles(files, 'astro.config');

    if (hasNextConfig) return 'NEXTJS';
    if (hasRemixConfig) return 'REMIX';
    if (hasAstroConfig) return 'ASTRO';
    
    throw new Error('Unsupported framework');
  }

  private async searchInFiles(files: Buffer, configName: string): Promise<boolean> {
    return files.includes(Buffer.from(configName));
  }

  private async validateProject(files: Buffer, framework: Framework) {
    const validations = {
      NEXTJS: this.validateNextJS,
      REMIX: this.validateRemix,
      ASTRO: this.validateAstro
    };

    await validations[framework].call(this, files);
  }

  private async validateNextJS(files: Buffer) {
    // Implement Next.js validation logic
  }

  private async validateRemix(files: Buffer) {
    // Implement Remix validation logic
  }

  private async validateAstro(files: Buffer) {
    // Implement Astro validation logic
  }

  private async verifyDeployment(containerId: string, url: string) {
    const maxRetries = 10;
    const retryDelay = 2000;

    for (let i = 0; i < maxRetries; i++) {
      try {
        const health = await this.containerManager.checkHealth(containerId);
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
          status: 'ACTIVE' as DeploymentStatus
        }
      });
      for (const deployment of oldDeployments) {
        if (deployment.containerId !== null) {
          await this.containerManager.stopContainer(deployment.containerId);
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

    await this.containerManager.cleanup(deploymentId);
    logger.error('Deployment failed', { deploymentId, error });
  }
} 