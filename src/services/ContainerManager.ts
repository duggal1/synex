import Docker from 'dockerode';
import { Framework } from '@/types/index';
import { logger } from '@/lib/logger';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import path from 'path';

interface DeployOptions {
  deploymentId: string;
  buildPath: string;
  framework: Framework;
  env: Record<string, string>;
}

export class ContainerManager {
  private readonly docker: Docker;

  constructor(docker: Docker) {
    this.docker = docker;
  }

  async deploy(options: DeployOptions): Promise<Docker.Container> {
    try {
      logger.info(`Deploying container for deployment ${options.deploymentId}`);

      const container = await this.docker.createContainer({
        Image: this.getDockerImage(options.framework),
        Env: this.formatEnvVariables(options.env),
        Labels: {
          deploymentId: options.deploymentId,
          framework: options.framework
        },
        HostConfig: {
          RestartPolicy: {
            Name: 'unless-stopped'
          },
          Binds: [
            `${options.buildPath}:/app`
          ]
        }
      });

      await container.start();
      return container;
    } catch (error) {
      logger.error('Container deployment failed:', error);
      throw error;
    }
  }

  async waitForReady(containerId: string, timeout = 30000): Promise<void> {
    const startTime = Date.now();
    const container = this.docker.getContainer(containerId);

    while (Date.now() - startTime < timeout) {
      try {
        const info = await container.inspect();
        if (info.State.Running && !info.State.Restarting) {
          // Additional health check
          const stats = await container.stats({ stream: false });
          if (stats.cpu_stats.cpu_usage.total_usage > 0) {
            return;
          }
        }
      } catch (error) {
        logger.error(`Container health check failed: ${error}`);
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    throw new Error(`Container ${containerId} not ready after ${timeout}ms`);
  }

  async cleanup(containerId: string): Promise<void> {
    try {
      const container = this.docker.getContainer(containerId);
      await container.stop();
      await container.remove();
      logger.info(`Successfully cleaned up container ${containerId}`);
    } catch (error) {
      logger.error(`Container cleanup failed: ${error}`);
      throw error;
    }
  }

  private getDockerImage(framework: Framework): string {
    const images = {
      [Framework.NEXTJS]: 'node:18-alpine',
      [Framework.REMIX]: 'node:18-alpine',
      [Framework.ASTRO]: 'node:18-alpine',
      [Framework.STATIC]: 'nginx:alpine'
    };
    return images[framework];
  }

  private formatEnvVariables(env: Record<string, string>): string[] {
    return Object.entries(env).map(([key, value]) => `${key}=${value}`);
  }
}
