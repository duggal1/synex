/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { prisma } from '@/lib/prisma';
import { Framework } from '@/types/index';
import path from 'path';
import fs from 'fs-extra';
import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '@/lib/logger';
import { createHash } from 'crypto';

const execAsync = promisify(exec);

export class BuildPipeline {
  private readonly buildDir: string;
  private readonly cacheDir: string;

  constructor() {
    this.buildDir = path.join(process.cwd(), 'builds');
    this.cacheDir = path.join(process.cwd(), 'cache');
    this.ensureDirectories();
  }

  async build(deploymentId: string, files: Buffer, framework: Framework) {
    const buildPath = path.join(this.buildDir, deploymentId);
    const startTime = Date.now();

    try {
      // Extract files
      await this.extractFiles(buildPath, files);

      // Generate cache key
      const cacheKey = await this.generateCacheKey(buildPath);

      // Check cache
      const cachedBuild = await this.checkCache(cacheKey);
      if (cachedBuild) {
        return cachedBuild;
      }

      // Install dependencies with caching
      await this.installDependencies(buildPath, framework);

      // Framework-specific build
      const buildResult = await this.runFrameworkBuild(buildPath, framework);

      // Optimize output
      await this.optimizeOutput(buildPath, framework);

      // Cache the build
      await this.cacheBuild(buildPath, cacheKey);

      const buildTime = Date.now() - startTime;
      await this.updateBuildStatus(deploymentId, 'DEPLOYED', buildTime);

      return {
        outputPath: buildPath,
        buildTime,
        env: buildResult.env,
        cacheKey
      };
    } catch (error) {
      if (error instanceof Error) {
        await this.updateBuildStatus(deploymentId, 'FAILED', 0, error);
      } else {
        await this.updateBuildStatus(deploymentId, 'FAILED', 0, new Error(String(error)));
      }
      throw error;
    }
  }

  private async extractFiles(buildPath: string, files: Buffer) {
    // Assuming files are in a zip format
    const zip = new (require('adm-zip'))(files);
    zip.extractAllTo(buildPath, true);
  }

  private async installDependencies(buildPath: string, framework: Framework) {
    const packageManager = fs.existsSync(path.join(buildPath, 'yarn.lock')) ? 'yarn' : 'npm';
    await execAsync(`${packageManager} install`, { cwd: buildPath });
  }

  private async runFrameworkBuild(buildPath: string, framework: Framework) {
    switch (framework) {
      case 'NEXTJS':
        return await this.buildNextJS(buildPath);
      case 'REMIX':
        return await this.buildRemix(buildPath);
      case 'ASTRO':
        return await this.buildAstro(buildPath);
      default:
        throw new Error(`Unsupported framework: ${framework}`);
    }
  }

  private async buildNextJS(buildPath: string) {
    await this.optimizeNextConfig(buildPath);
    await execAsync('npm run build', { cwd: buildPath });
    return { env: { NODE_ENV: 'production', NEXT_TELEMETRY_DISABLED: '1' } };
  }

  private async buildRemix(buildPath: string) {
    await execAsync('remix build', { cwd: buildPath });
    return { env: { NODE_ENV: 'production' } };
  }

  private async buildAstro(buildPath: string) {
    await execAsync('astro build', { cwd: buildPath });
    return { env: { NODE_ENV: 'production' } };
  }

  private async optimizeNextConfig(buildPath: string) {
    const config = {
      swcMinify: true,
      experimental: {
        serverActions: true,
        serverComponents: true,
        optimizeCss: true
      },
      compiler: {
        removeConsole: process.env.NODE_ENV === 'production'
      },
      images: {
        unoptimized: false,
        domains: ['*'],
        formats: ['image/avif', 'image/webp']
      },
      webpack: (config: any) => {
        config.optimization = {
          ...config.optimization,
          minimize: true,
          splitChunks: {
            chunks: 'all',
            minSize: 20000,
            maxSize: 244000
          }
        };
        return config;
      }
    };

    await fs.writeFile(
      path.join(buildPath, 'next.config.js'),
      `module.exports = ${JSON.stringify(config, null, 2)}`
    );
  }

  private async optimizeOutput(buildPath: string, framework: Framework) {
    await execAsync(`find . -type f -name "*.js" -exec gzip -k {} \\;`, { cwd: buildPath });
    await execAsync(`find . -type f \\( -name "*.jpg" -o -name "*.png" \\) -exec convert {} -quality 85 {} \\;`, { cwd: buildPath });

    switch (framework) {
      case 'NEXTJS':
        await this.optimizeNextJSOutput(buildPath);
        break;
      case 'REMIX':
        await this.optimizeRemixOutput(buildPath);
        break;
      case 'ASTRO':
        await this.optimizeAstroOutput(buildPath);
        break;
    }
  }

  private async optimizeNextJSOutput(buildPath: string) {
    // Implement Next.js specific optimizations
  }

  private async optimizeRemixOutput(buildPath: string) {
    // Implement Remix specific optimizations
  }

  private async optimizeAstroOutput(buildPath: string) {
    // Implement Astro specific optimizations
  }

  private async generateCacheKey(buildPath: string): Promise<string> {
    const files = ['package.json', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'];
    const hashes = await Promise.all(
      files
        .filter(f => fs.existsSync(path.join(buildPath, f)))
        .map(async f => {
          const content = await fs.readFile(path.join(buildPath, f));
          return createHash('sha256').update(content).digest('hex');
        })
    );
    return hashes.join('-');
  }

  private async cacheBuild(buildPath: string, cacheKey: string) {
    const cachePath = path.join(this.cacheDir, cacheKey);
    await fs.copy(buildPath, cachePath);
  }

  private async checkCache(cacheKey: string) {
    const cachePath = path.join(this.cacheDir, cacheKey);
    if (await fs.pathExists(cachePath)) {
      return {
        outputPath: cachePath,
        buildTime: 0,
        env: {},
        cacheKey
      };
    }
    return null;
  }

  private async updateBuildStatus(deploymentId: string, status: 'DEPLOYED' | 'FAILED', duration: number, error?: Error) {
    await prisma.deployment.update({
      where: { id: deploymentId },
      data: {
        status,
        buildTime: duration,
        buildLogs: error ? { push: error.message } : undefined
      }
    });
  }

  private async ensureDirectories() {
    await fs.ensureDir(this.buildDir);
    await fs.ensureDir(this.cacheDir);
  }
} 