/* eslint-disable @typescript-eslint/no-empty-object-type */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import Docker, { Container, ContainerCreateOptions } from 'dockerode';
import fs from 'fs-extra';
import path from 'path';
import { logger } from '@/lib/logger';
import { redis } from '@/lib/redis';
import { Readable } from 'stream';

interface ContainerConfig {
  name(name: any): unknown;
  memory: number;
  cpus: number;
  restartPolicy: 'no' | 'always' | 'on-failure' | 'unless-stopped';
  healthcheck: {
    interval: number;  // in milliseconds
    timeout: number;   // in milliseconds
    retries: number;
  };
}

interface DockerContainerConfig {
  Memory?: number;
  NanoCpus?: number;
  NetworkMode?: string;
  Env?: string[];
  HealthCheck?: {
    Test: string[];
    Interval: number;
    Timeout: number;
    Retries: number;
  };
  Ports?: {
    [key: string]: { HostPort: string; }[];
  };
  Volumes?: {
    [key: string]: {};
  };
}

interface CreateContainerOptions {
  image: string;
  name: string;
  config: DockerContainerConfig;
}

export class DockerService {
  private docker: Docker;

  constructor() {
    this.docker = new Docker();
  }

  async createContainer(options: CreateContainerOptions): Promise<Docker.Container> {
    try {
      const container = await this.docker.createContainer({
        Image: options.image,
        name: options.name,
        ...options.config,
        HostConfig: {
          Memory: options.config.Memory,
          NanoCpus: options.config.NanoCpus,
          NetworkMode: options.config.NetworkMode,
          RestartPolicy: {
            Name: 'always'
          }
        }
      });

      logger.info('Container created successfully', {
        name: options.name,
        image: options.image
      });

      return container;
    } catch (error) {
      logger.error('Failed to create container:', error);
      throw new Error(`Failed to create container: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  getContainer(containerId: string): Docker.Container {
    return this.docker.getContainer(containerId);
  }

  private readonly buildTimeout = 600000; // 10 minutes
  private readonly defaultConfig: ContainerConfig = {
    memory: 1024 * 1024 * 1024, // 1GB
    cpus: 1,
    restartPolicy: 'always',
    healthcheck: {
      interval: 30000,
      timeout: 10000,
      retries: 3
    },
    name: function (name: any): unknown {
      throw new Error('Function not implemented.');
    }
  };

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

  async startContainer(containerNameOrId: string): Promise<string> {
    try {
      // Get container instance
      const container = this.docker.getContainer(containerNameOrId);
      
      // Start the container
      await container.start();

      // Wait for container to be running
      const info = await container.inspect();
      if (info.State?.Status !== 'running') {
        throw new Error(`Container failed to start. Status: ${info.State?.Status}`);
      }

      // Wait for health check
      const isHealthy = await this.waitForHealthCheck(container);
      if (!isHealthy) {
        logger.error('Container health check failed', { containerNameOrId });
        await this.stopAndRemoveContainer(container);
        throw new Error('Container failed health check');
      }

      // Setup container networking
      await this.setupContainerNetworking(container);

      // Monitor container logs
      this.monitorContainerLogs(container);

      logger.info('Container started successfully', {
        containerId: info.Id,
        name: info.Name,
        status: info.State?.Status
      });

      return info.Id;
    } catch (error) {
      logger.error('Failed to start container:', {
        containerNameOrId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw new Error(`Failed to start container: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async setupContainerNetworking(container: Container): Promise<void> {
    try {
      const info = await container.inspect();
      const networkMode = info.HostConfig?.NetworkMode;

      // If container is not in the security network, connect it
      if (networkMode !== 'security-network') {
        const network = await this.docker.getNetwork('security-network');
        await network.connect({
          Container: container.id,
          EndpointConfig: {
            IPAMConfig: {
              IPv4Address: ''  // Auto-assign IP
            }
          }
        });
      }
    } catch (error) {
      logger.error('Failed to setup container networking:', error);
      throw error;
    }
  }

  private monitorContainerLogs(container: Container): void {
    const logOptions = {
      follow: true,
      stdout: true,
      stderr: true,
      timestamps: true
    };

    container.logs({...logOptions, follow: true} as const)
      .then((stream) => {
        if (stream instanceof Buffer) {
          logger.debug('Container log:', {
            containerId: container.id,
            log: stream.toString('utf8').trim()
          });
          return;
        }
        stream.on('data', (chunk: Buffer) => {
          const log = chunk.toString('utf8').trim();
          logger.debug('Container log:', {
            containerId: container.id,
            log
          });
        });

        stream.on('error', (error) => {
          logger.error('Container log stream error:', {
            containerId: container.id,
            error: error.message
          });
        });
      })
      .catch((error) => {
        logger.error('Failed to attach container logs:', {
          containerId: container.id,
          error: error.message
        });
      });
  }

  async updateContainerResources(containerId: string, resources: {
    NanoCPUs?: number;
    CpuQuota?: number;
    CpuPeriod?: number;
    Memory?: number;
    MemorySwap?: number;
    MemoryReservation?: number;
  }): Promise<void> {
    try {
      const container = this.docker.getContainer(containerId);
      
      // Get current container info
      const info = await container.inspect();
      
      // Prepare update configuration
      const updateConfig = {
        ...info.HostConfig,
        ...resources
      };

      // Update container resources
      await container.update(updateConfig);
      
      logger.info('Container resources updated successfully', {
        containerId,
        resources
      });
    } catch (error) {
      logger.error('Failed to update container resources:', error);
      throw new Error(`Failed to update container resources: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

 

  private async verifyContainerHealth(containerId: string): Promise<void> {
    const container = await this.docker.getContainer(containerId);
    const info = await container.inspect();
    
    if (info.State?.Health?.Status !== 'healthy') {
      throw new Error('Container health check failed');
    }
  }

  private async cleanup(containerName: string): Promise<void> {
    try {
      const container = await this.docker.getContainer(containerName);
      await container.remove({ force: true });
    } catch (error) {
      logger.error('Container cleanup failed:', error);
    }
  }
} 