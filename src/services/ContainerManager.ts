import Docker from 'dockerode';
import { prisma } from '@/lib/prisma';
import { Framework } from '@/types';
import { logger } from '@/lib/logger';
import path from 'path';

interface DeployOptions {
  deploymentId: string;
  buildPath: string;
  framework: Framework;
  env: Record<string, string>;
}

export class ContainerManager {
  private docker: Docker;
  private readonly networkName = 'deployment-network';

  constructor() {
    this.docker = new Docker();
    this.ensureNetwork();
  }

  async deploy(options: DeployOptions) {
    const { deploymentId, buildPath, framework, env } = options;

    try {
      // 1. Build container image
      const image = await this.buildImage(deploymentId, buildPath, framework);

      // 2. Setup container networking
      const network = await this.setupNetworking(deploymentId);

      // 3. Create and start container
      const container = await this.createContainer({
        deploymentId,
        image,
        env,
        network
      });

      // 4. Setup monitoring
      await this.setupMonitoring(container.id);

      return {
        id: container.id,
        network: network.id,
        image: image.id
      };

    } catch (error) {
      await this.cleanup(deploymentId);
      throw error;
    }
  }

  private async buildImage(deploymentId: string, buildPath: string, framework: Framework) {
    const dockerfile = this.getDockerfile(framework);
    
    const image = await this.docker.buildImage({
      context: buildPath,
      src: ['Dockerfile', '.next', 'node_modules', 'package.json']
    }, {
      t: `deployment-${deploymentId}`,
      dockerfile
    });

    return image;
  }

  private async setupNetworking(deploymentId: string) {
    const network = await this.docker.createNetwork({
      Name: `network-${deploymentId}`,
      Driver: 'bridge',
      Internal: false,
      EnableIPv6: true,
      Options: {
        'com.docker.network.bridge.enable_icc': 'true',
        'com.docker.network.bridge.enable_ip_masquerade': 'true'
      }
    });

    return network;
  }

  private async createContainer(options: {
    deploymentId: string;
    image: Docker.Image;
    env: Record<string, string>;
    network: Docker.Network;
  }) {
    const container = await this.docker.createContainer({
      Image: options.image.id,
      name: `deployment-${options.deploymentId}`,
      Env: Object.entries(options.env).map(([k, v]) => `${k}=${v}`),
      HostConfig: {
        NetworkMode: options.network.id,
        Memory: 1024 * 1024 * 1024, // 1GB
        NanoCPUs: 1000000000, // 1 CPU
        RestartPolicy: {
          Name: 'always'
        }
      },
      NetworkingConfig: {
        EndpointsConfig: {
          [options.network.id]: {
            Aliases: [`deployment-${options.deploymentId}`]
          }
        }
      },
      Healthcheck: {
        Test: ['CMD', 'curl', '-f', 'http://localhost:3000/health'],
        Interval: 30000000000, // 30s
        Timeout: 10000000000, // 10s
        Retries: 3
      }
    });

    await container.start();
    return container;
  }

  async checkHealth(containerId: string) {
    const container = this.docker.getContainer(containerId);
    const info = await container.inspect();
    return {
      status: info.State.Health?.Status || 'unknown',
      running: info.State.Running
    };
  }

  async cleanup(deploymentId: string) {
    try {
      // Stop and remove container
      const container = this.docker.getContainer(`deployment-${deploymentId}`);
      await container.stop();
      await container.remove();

      // Remove network
      const network = this.docker.getNetwork(`network-${deploymentId}`);
      await network.remove();

      // Remove image
      const image = this.docker.getImage(`deployment-${deploymentId}`);
      await image.remove();

    } catch (error) {
      logger.error('Cleanup failed', { deploymentId, error });
    }
  }

  private async ensureNetwork() {
    try {
      await this.docker.getNetwork(this.networkName);
    } catch {
      await this.docker.createNetwork({
        Name: this.networkName,
        Driver: 'bridge'
      });
    }
  }

  private getDockerfile(framework: Framework): string {
    const dockerfiles = {
      NEXTJS: path.join(__dirname, '../dockerfiles/nextjs.dockerfile'),
      REMIX: path.join(__dirname, '../dockerfiles/remix.dockerfile'),
      ASTRO: path.join(__dirname, '../dockerfiles/astro.dockerfile')
    };

    return dockerfiles[framework];
  }
} 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async manageContainer(projectId: string) {
    // 1. Container networking
    // 2. Volume management
    // 3. Resource limits
    // 4. Log management
    // 5. Container health monitoring
  }
} 