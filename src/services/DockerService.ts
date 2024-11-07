/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import Docker, { Container, ContainerCreateOptions } from 'dockerode';
import fs from 'fs-extra';
import path from 'path';
import { logger } from '@/lib/logger';
import { redis } from '@/lib/redis';
import { Readable } from 'stream';

interface ContainerConfig {
  memory: number;
  cpus: number;
  restartPolicy: 'no' | 'always' | 'on-failure' | 'unless-stopped';
  healthcheck: {
    interval: number;
    timeout: number;
    retries: number;
  };
}

export class DockerService {
  getContainer(containerId: string) {
    throw new Error('Method not implemented.');
  }
  private docker: Docker;
  private readonly buildTimeout = 600000; // 10 minutes
  private readonly defaultConfig: ContainerConfig = {
    memory: 1024 * 1024 * 1024, // 1GB
    cpus: 1,
    restartPolicy: 'always',
    healthcheck: {
      interval: 30000,
      timeout: 10000,
      retries: 3
    }
  };

  constructor() {
    try {
      this.docker = new Docker({
        socketPath: '/var/run/docker.sock',
        timeout: this.buildTimeout
      });
    } catch (error) {
      logger.error('Failed to initialize Docker client:', error as Error);
      throw new Error('Docker initialization failed');
    }
  }

  async buildImage(
    projectId: string,
    buildPath: string,
    envVars: Record<string, string>
  ): Promise<string> {
    const imageName = `project-${projectId}:latest`;
    
    try {
      if (!await fs.pathExists(buildPath)) {
        throw new Error(`Build path does not exist: ${buildPath}`);
      }

      const dockerfile = this.generateNextjsDockerfile(envVars);
      await fs.writeFile(path.join(buildPath, 'Dockerfile'), dockerfile);

      const buildContext: Docker.ImageBuildContext = {
        context: buildPath,
        src: ['Dockerfile', '.']
      };

      const buildOptions: Docker.ImageBuildOptions = {
        dockerfile: 'Dockerfile',
        t: imageName,
        buildargs: envVars,
        pull: "true",
       
      };

      const stream = await new Promise<NodeJS.ReadableStream>((resolve, reject) => {
        this.docker.buildImage(buildContext, buildOptions, (err, response) => {
          if (err) reject(err);
          else resolve(response!);
        });
      });

      await this.followBuildProgress(stream);

      const images = await this.docker.listImages({
        filters: { reference: [imageName] }
      });

      if (images.length === 0) {
        throw new Error('Image build completed but image not found');
      }

      await redis.set(
        `docker:build:${projectId}`,
        imageName,
        '86400' // 24 hours
      );

      return imageName;
    } catch (error) {
      logger.error('Docker build failed:', {
        projectId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error(`Docker build failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async runContainer(
    imageName: string,
    projectId: string,
    port: number,
    config: Partial<ContainerConfig> = {}
  ): Promise<string> {
    try {
      const containerConfig = { ...this.defaultConfig, ...config };

      const existingContainer = await this.findContainer(projectId);
      if (existingContainer) {
        await this.stopAndRemoveContainer(existingContainer);
      }

      const createOptions: ContainerCreateOptions = {
        Image: imageName,
        name: `project-${projectId}`,
        ExposedPorts: {
          '3000/tcp': {}
        },
        Healthcheck: {
          Test: ['CMD', 'curl', '-f', 'http://localhost:3000/health'],
          Interval: containerConfig.healthcheck.interval * 1000000,
          Timeout: containerConfig.healthcheck.timeout * 1000000,
          Retries: containerConfig.healthcheck.retries
        },
        HostConfig: {
          PortBindings: {
            '3000/tcp': [{ HostPort: port.toString() }]
          },
          RestartPolicy: {
            Name: containerConfig.restartPolicy
          },
          Memory: containerConfig.memory,
          NanoCpus: containerConfig.cpus * 1000000000
        },
        Env: [
          'NODE_ENV=production',
          `PROJECT_ID=${projectId}`
        ]
      };

      const container = await this.docker.createContainer(createOptions);
      await container.start();

      const healthy = await this.waitForHealthCheck(container);
      if (!healthy) {
        await this.stopAndRemoveContainer(container);
        throw new Error('Container failed health check');
      }

      return container.id;
    } catch (error) {
      logger.error('Container start failed:', {
        projectId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error(`Container start failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async followBuildProgress(stream: NodeJS.ReadableStream): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!stream || !this.docker.modem.followProgress) {
        reject(new Error('Invalid stream or Docker modem'));
        return;
      }

      this.docker.modem.followProgress(
        stream,
        (err: Error | null, result: unknown[]) => {
          if (err) reject(err);
          else resolve();
        },
        (event: { stream?: string; error?: string }) => {
          if (event.error) {
            logger.error('Build progress error:', event.error);
          } else if (event.stream) {
            logger.debug(event.stream.trim());
          }
        }
      );
    });
  }

  private async findContainer(projectId: string): Promise<Container | null> {
    const containers = await this.docker.listContainers({
      all: true,
      filters: {
        name: [`project-${projectId}`]
      }
    });

    return containers.length > 0 
      ? this.docker.getContainer(containers[0].Id)
      : null;
  }

  private async stopAndRemoveContainer(container: Container): Promise<void> {
    try {
      await container.stop();
      await container.remove();
    } catch (error) {
      logger.error('Failed to stop/remove container:', error as Error);
    }
  }

  private async waitForHealthCheck(container: Container): Promise<boolean> {
    for (let i = 0; i < 30; i++) {
      const info = await container.inspect();
      if (info.State?.Health?.Status === 'healthy') {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    return false;
  }

  private generateNextjsDockerfile(envVars: Record<string, string>): string {
    return `
FROM node:18-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

${Object.entries(envVars)
  .map(([key, value]) => `ENV ${key}="${value.replace(/"/g, '\\"')}"`)
  .join('\n')}

RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app

COPY --from=builder /app/package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.js ./

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache curl
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:3000/health || exit 1

EXPOSE 3000
CMD ["npm", "start"]`;
  }
} 