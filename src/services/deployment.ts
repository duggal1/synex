// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Project, Deployment } from '@prisma/client';
import Docker from 'dockerode';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export class DeploymentService {
  private docker: Docker;
  
  constructor() {
    this.docker = new Docker();
  }

  async deployProject(projectId: string, files: Buffer): Promise<Deployment> {
    try {
      // Create unique build directory
      const buildId = uuidv4();
      const buildPath = path.join(process.cwd(), 'builds', buildId);

      // Extract files to build directory
      await this.extractFiles(files, buildPath);

      // Build Docker image
      const image = await this.buildDockerImage(buildPath, projectId);

      // Create container and start it
      const container = await this.createContainer(image.id, projectId);
      await container.start();

      // Setup nginx reverse proxy for the domain
      await this.setupDomainProxy(projectId, container.id);

      return {
        id: buildId,
        status: 'DEPLOYED',
        // ... other deployment details
      };
    } catch (error) {
      throw new Error(`Deployment failed: ${error.message}`);
    }
  }

  private async buildDockerImage(buildPath: string, projectId: string) {
    const dockerfile = `
      FROM node:18-alpine
      WORKDIR /app
      COPY . .
      RUN npm install
      RUN npm run build
      EXPOSE 3000
      CMD ["npm", "start"]
    `;

    // Create Dockerfile
    await fs.writeFile(path.join(buildPath, 'Dockerfile'), dockerfile);

    return await this.docker.buildImage({
      context: buildPath,
      src: ['Dockerfile', '.next', 'package.json', 'node_modules']
    }, { t: `project-${projectId}` });
  }
} 