import { prisma } from '@/lib/prisma';
import { Framework } from '@/types';
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
      await this.updateBuildStatus(deploymentId, 'SUCCESS', buildTime);

      return {
        outputPath: buildPath,
        buildTime,
        env: buildResult.env,
        cacheKey
      };

    } catch (error) {
      await this.updateBuildStatus(deploymentId, 'FAILED', 0, error);
      throw error;
    }
  }

  private async runFrameworkBuild(buildPath: string, framework: Framework) {
    const builds = {
      NEXTJS: this.buildNextJS,
      REMIX: this.buildRemix,
      ASTRO: this.buildAstro
    };

    return await builds[framework](buildPath);
  }

  private async buildNextJS(buildPath: string) {
    // Optimize next.config.js
    await this.optimizeNextConfig(buildPath);

    // Run build
    await execAsync('npm run build', { cwd: buildPath });

    // Collect env
    const env = {
      NODE_ENV: 'production',
      NEXT_TELEMETRY_DISABLED: '1'
    };

    return { env };
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
    // Compress assets
    await execAsync(`find . -type f -name "*.js" -exec gzip -k {} \\;`, {
      cwd: buildPath
    });

    // Optimize images
    await execAsync(
      `find . -type f \\( -name "*.jpg" -o -name "*.png" \\) -exec convert {} -quality 85 {} \\;`,
      { cwd: buildPath }
    );

    // Framework-specific optimizations
    const optimizations = {
      NEXTJS: this.optimizeNextJSOutput,
      REMIX: this.optimizeRemixOutput,
      ASTRO: this.optimizeAstroOutput
    };

    await optimizations[framework](buildPath);
  }

  private async generateCacheKey(buildPath: string): Promise<string> {
    const files = [
      'package.json',
      'package-lock.json',
      'yarn.lock',
      'pnpm-lock.yaml'
    ];

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

  private async updateBuildStatus(
    deploymentId: string,
    status: 'SUCCESS' | 'FAILED',
    duration: number,
    error?: Error
  ) {
    await prisma.deployment.update({
      where: { id: deploymentId },
      data: {
        buildStatus: status,
        buildDuration: duration,
        error: error?.message
      }
    });
  }

  private async ensureDirectories() {
    await fs.ensureDir(this.buildDir);
    await fs.ensureDir(this.cacheDir);
  }
} 