import Docker from 'dockerode';
import fs from 'fs-extra';
import path from 'path';
import { logger } from '@/lib/logger';
import { redis } from '@/lib/redis';

export class DockerService {
  private docker: Docker;
  private readonly buildTimeout = 600000; // 10 minutes

  constructor() {
    this.docker = new Docker({
      socketPath: '/var/run/docker.sock',
      timeout: this.buildTimeout
    });
  }

  async buildImage(
    projectId: string,
    buildPath: string,
    envVars: Record<string, string>
  ): Promise<string> {
    const imageName = `project-${projectId}:latest`;
    
    try {
      // Create optimized Dockerfile for Next.js
      const dockerfile = this.generateNextjsDockerfile(envVars);
      await fs.writeFile(path.join(buildPath, 'Dockerfile'), dockerfile);

      // Build with cache optimization
      const stream = await this.docker.buildImage({
        context: buildPath,
        src: ['.'],
      }, {
        t: imageName,
        buildargs: envVars,
        cachefrom: [imageName],
      });

      await new Promise((resolve, reject) => {
        this.docker.modem.followProgress(stream, (err: Error, res: any[]) => {
          if (err) reject(err);
          resolve(res);
        });
      });

      return imageName;
    } catch (error) {
      logger.error('Docker build failed', { projectId, error });
      throw new Error(`Docker build failed: ${error.message}`);
    }
  }

  private generateNextjsDockerfile(envVars: Record<string, string>): string {
    return `
      FROM node:18-alpine AS builder
      WORKDIR /app
      
      # Install dependencies
      COPY package*.json ./
      RUN npm ci
      
      # Copy source
      COPY . .
      
      # Set build-time variables
      ${Object.entries(envVars)
        .map(([key, value]) => `ENV ${key}=${value}`)
        .join('\n')}
      
      # Build
      RUN npm run build
      
      # Production image
      FROM node:18-alpine AS runner
      WORKDIR /app
      
      # Copy built assets
      COPY --from=builder /app/.next ./.next
      COPY --from=builder /app/node_modules ./node_modules
      COPY --from=builder /app/package.json ./package.json
      COPY --from=builder /app/public ./public
      
      # Runtime optimizations
      ENV NODE_ENV=production
      ENV NEXT_TELEMETRY_DISABLED=1
      
      # Expose and run
      EXPOSE 3000
      CMD ["npm", "start"]
    `;
  }

  async runContainer(
    imageName: string,
    projectId: string,
    port: number
  ): Promise<string> {
    try {
      const container = await this.docker.createContainer({
        Image: imageName,
        name: `project-${projectId}`,
        ExposedPorts: {
          '3000/tcp': {}
        },
        HostConfig: {
          PortBindings: {
            '3000/tcp': [{ HostPort: port.toString() }]
          },
          RestartPolicy: {
            Name: 'always'
          },
          Memory: 1024 * 1024 * 1024, // 1GB
          NanoCPUs: 1000000000 // 1 CPU
        },
        Env: [
          'NODE_ENV=production'
        ]
      });

      await container.start();
      return container.id;
    } catch (error) {
      logger.error('Container start failed', { projectId, error });
      throw new Error(`Container start failed: ${error.message}`);
    }
  }
} 