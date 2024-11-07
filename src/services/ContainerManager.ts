import Docker from 'dockerode';
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
      const image = await this.buildImage(deploymentId, buildPath, framework);
      const network = await this.setupNetworking(deploymentId);
      const container = await this.createContainer({
        deploymentId,
        image,
        env,
        network
      });

      await container.start();

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
    
    return new Promise<Docker.Image>((resolve, reject) => {
      this.docker.buildImage({
        context: buildPath,
        src: ['Dockerfile', '.next', 'node_modules', 'package.json']
      }, {
        t: `deployment-${deploymentId}`,
        dockerfile
      }, (error, stream) => {
        if (error) {
          return reject(error);
        }
        if (!stream) {
          return reject(new Error('Docker build stream is undefined'));
        }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        this.docker.modem.followProgress(stream, (err, res) => {
          if (err) {
            return reject(err);
          }
          resolve(this.docker.getImage(`deployment-${deploymentId}`));
        });
      });
    });
  }

  private async setupNetworking(deploymentId: string) {
    return this.docker.createNetwork({
      Name: `network-${deploymentId}`,
      Driver: 'bridge',
      Internal: false,
      EnableIPv6: true,
      Options: {
        'com.docker.network.bridge.enable_icc': 'true',
        'com.docker.network.bridge.enable_ip_masquerade': 'true'
      }
    });
  }

  private async createContainer(options: {
    deploymentId: string;
    image: Docker.Image;
    env: Record<string, string>;
    network: Docker.Network;
  }) {
    return this.docker.createContainer({
      Image: options.image.id,
      name: `deployment-${options.deploymentId}`,
      Env: Object.entries(options.env).map(([k, v]) => `${k}=${v}`),
      HostConfig: {
        NetworkMode: options.network.id,
        Memory: 1024 * 1024 * 1024, // 1GB
        NanoCpus: 1000000000, // 1 CPU
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
      const container = this.docker.getContainer(`deployment-${deploymentId}`);
      await container.stop();
      await container.remove();

      const network = this.docker.getNetwork(`network-${deploymentId}`);
      await network.remove();

      const image = this.docker.getImage(`deployment-${deploymentId}`);
      await image.remove();

    } catch (error) {
      logger.error('Cleanup failed', { deploymentId, error });
    }
  }

  async stopContainer(containerId: string) {
    try {
      const container = this.docker.getContainer(containerId);
      await container.stop();
      await container.remove();
    } catch (error) {
      logger.error('Failed to stop container', { containerId, error });
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
