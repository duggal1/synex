import { prisma } from '@/lib/prisma';
import { BuildPipeline } from './BuildPipeline';
import { ContainerManager } from './ContainerManager';
import { DomainService } from './DomainService';
import { Framework, DeploymentStatus } from '@/types';
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

  async deploy(projectId: string, files: Buffer) {
    const deployment = await this.createDeployment(projectId);

    try {
      // 1. Framework Detection & Validation
      const framework = await this.detectFramework(files);
      await this.validateProject(files, framework);

      // 2. Build Process
      const buildResult = await this.buildPipeline.build(deployment.id, files, framework);

      // 3. Container Setup
      const container = await this.containerManager.deploy({
        deploymentId: deployment.id,
        buildPath: buildResult.outputPath,
        framework,
        env: buildResult.env
      });

      // 4. Domain Setup
      const domain = await this.domainService.setupDomain(deployment.id);

      // 5. Health Check & Verification
      await this.verifyDeployment(container.id, domain.url);

      // 6. Update Production Traffic
      await this.updateProduction(projectId, deployment.id);

      return {
        deploymentId: deployment.id,
        url: domain.url,
        container: container.id
      };

    } catch (error) {
      await this.handleDeploymentFailure(deployment.id, error);
      throw error;
    }
  }

  private async createDeployment(projectId: string) {
    return await prisma.deployment.create({
      data: {
        projectId,
        status: 'QUEUED',
        version: Date.now().toString()
      }
    });
  }

  private async detectFramework(files: Buffer): Promise<Framework> {
    // Implement framework detection logic
    const hasNextConfig = await this.searchInFiles(files, 'next.config');
    const hasRemixConfig = await this.searchInFiles(files, 'remix.config');
    const hasAstroConfig = await this.searchInFiles(files, 'astro.config');

    if (hasNextConfig) return 'NEXTJS';
    if (hasRemixConfig) return 'REMIX';
    if (hasAstroConfig) return 'ASTRO';
    
    throw new Error('Unsupported framework');
  }

  private async validateProject(files: Buffer, framework: Framework) {
    // Implement project validation
    const validations = {
      NEXTJS: this.validateNextJS,
      REMIX: this.validateRemix,
      ASTRO: this.validateAstro
    };

    await validations[framework](files);
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
      // Update current production deployment
      await tx.project.update({
        where: { id: projectId },
        data: { productionDeploymentId: deploymentId }
      });

      // Clean up old deployments
      const oldDeployments = await tx.deployment.findMany({
        where: { 
          projectId,
          NOT: { id: deploymentId },
          status: 'ACTIVE'
        }
      });

      for (const deployment of oldDeployments) {
        await this.containerManager.stopContainer(deployment.containerId);
      }
    });
  }

  private async handleDeploymentFailure(deploymentId: string, error: Error) {
    await prisma.deployment.update({
      where: { id: deploymentId },
      data: {
        status: 'FAILED',
        error: error.message
      }
    });

    // Cleanup resources
    await this.containerManager.cleanup(deploymentId);
    logger.error('Deployment failed', { deploymentId, error });
  }
} 