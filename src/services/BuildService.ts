/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { prisma } from '@/lib/prisma';
import path from 'path';
import fs from 'fs-extra';
import { exec } from 'child_process';
import { promisify } from 'util';
import { BuildConfig, Framework, BuildResult } from '@/types/index';


const execAsync = promisify(exec);

export class BuildService {
  private readonly buildDir: string;
  private readonly cacheDir: string;

  constructor() {
    this.buildDir = path.join(process.cwd(), 'builds');
    this.cacheDir = path.join(process.cwd(), 'cache');
  }

  async build(
    projectId: string,
    userId: string,
    environmentId: string,
    config: BuildConfig
  ): Promise<BuildResult> {
    // Validate all required parameters are present
    if (!projectId || !userId || !environmentId || !config) {
      throw new Error('Missing required parameters for build');
    }

    let deployment;

    try {
      // Create a new deployment record
      deployment = await prisma.deployment.create({
        data: {
          projectId,
          userId,
          environmentId,
          status: 'BUILDING',
          buildLogs: [],
          version: Date.now().toString(),
        }
      });

      const buildPath = path.join(this.buildDir, projectId);
      
      // Optimize build configuration based on framework
      const optimizedConfig = await this.generateBuildConfig(config.framework);
      
      // Create next.config.js with optimizations
      await this.createNextConfig(buildPath, optimizedConfig);

      // Run framework-specific build
      const buildResult = await this.runFrameworkBuild(
        buildPath, 
        config.framework
      );

      // Apply post-build optimizations
      await this.applyPostBuildOptimizations(buildPath, config.framework);

      // Update successful build in database
      await prisma.deployment.update({
        where: { id: deployment.id },
        data: {
          status: 'DEPLOYED',
          buildLogs: { push: 'Build completed successfully' }
        }
      });

      return {
        buildId: deployment.id,
        success: true,
        duration: Date.now() - new Date(deployment.createdAt).getTime(),
        logs: deployment.buildLogs as string[],
        assets: {
          static: [],  // Add actual asset paths
          server: []   // Add actual server files
        },
        buildTime: Date.now() - new Date(deployment.createdAt).getTime()
      };

    } catch (error) {
      if (deployment) {
        // Update failed build in database
        await prisma.deployment.update({
          where: { id: deployment.id },
          data: {
            status: 'FAILED',
            buildLogs: { push: (error as Error).message }
          }
        });
      }

      throw error;
    }
  }

  private async runFrameworkBuild(buildPath: string, framework: Framework) {
    switch (framework) {
      case 'NEXTJS':
        await execAsync('npm run build', { cwd: buildPath });
        break;
      case 'REMIX':
        await execAsync('remix build', { cwd: buildPath });
        break;
      case 'ASTRO':
        await execAsync('astro build', { cwd: buildPath });
        break;
    }
  }

  private async generateBuildConfig(framework: Framework) {
    switch (framework) {
      case 'NEXTJS':
        return {
          swcMinify: true,
          compiler: {
            removeConsole: process.env.NODE_ENV === 'production',
          },
          experimental: {
            optimizeCss: true,
            optimizeImages: true,
            serverActions: true,
            serverComponentsExternalPackages: [],
          },
          images: {
            domains: ['*'],
            formats: ['image/avif', 'image/webp'],
          },
          webpack: (config: any) => {
            config.optimization = {
              ...config.optimization,
              splitChunks: {
                chunks: 'all',
                minSize: 20000,
                maxSize: 244000,
                cacheGroups: {
                  commons: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    chunks: 'all',
                  },
                },
              },
              runtimeChunk: { name: 'runtime' },
            };
            return config;
          },
        };

      case 'REMIX':
        return {
          serverBuildTarget: "vercel",
          server: "cloudflare",
          serverBuildPath: "build/index.js",
          serverMainFields: ["browser", "module", "main"],
          serverModuleFormat: "cjs",
          serverPlatform: "node",
          serverMinify: true,
        };

      case 'ASTRO':
        return {
          output: 'hybrid',
          adapter: '@astrojs/node',
          compressHTML: true,
          build: {
            inlineStylesheets: 'auto',
            split: true,
            excludeMiddleware: false,
          },
        };
    }
  }

  private async createNextConfig(buildPath: string, config: any) {
    const configContent = `
      module.exports = {
        ...${JSON.stringify(config, null, 2)},
        generateEtags: true,
        compress: true,
        poweredByHeader: false,
        generateBuildId: async () => {
          return '${Date.now().toString()}'
        },
        headers: async () => [{
          source: '/:all*(svg|jpg|png)',
          headers: [{
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }]
        }],
      }
    `;

    await fs.writeFile(
      path.join(buildPath, 'next.config.js'),
      configContent
    );
  }

  private async applyPostBuildOptimizations(buildPath: string, framework: Framework) {
    switch (framework) {
      case 'NEXTJS':
        await this.optimizeNextjsBuild(buildPath);
        break;
      case 'REMIX':
        await this.optimizeRemixBuild(buildPath);
        break;
      case 'ASTRO':
        await this.optimizeAstroBuild(buildPath);
        break;
    }

    await this.optimizeAssets(buildPath);
    await this.setupCaching(buildPath);
  }

  private async optimizeNextjsBuild(buildPath: string) {
    await execAsync(`
      node --experimental-json-modules scripts/optimize-server-components.js
    `, { cwd: buildPath });

    const appDir = path.join(buildPath, 'app');
    const layoutPath = path.join(appDir, 'layout.tsx');
    
    if (await fs.pathExists(layoutPath)) {
      let content = await fs.readFile(layoutPath, 'utf8');
      content = content.replace(
        'export default function',
        'export default async function'
      );
      await fs.writeFile(layoutPath, content);
    }
  }

  private async optimizeRemixBuild(buildPath: string) {
    // Implement Remix-specific optimizations
    console.log(`Optimizing Remix build at ${buildPath}`);
  }

  private async optimizeAstroBuild(buildPath: string) {
    // Implement Astro-specific optimizations
    console.log(`Optimizing Astro build at ${buildPath}`);
  }

  private async optimizeAssets(buildPath: string) {
    await execAsync(`
      npx sharp-cli --input "**/*.{jpg,png}" --output-dir "public/optimized"
    `, { cwd: buildPath });

    await execAsync(`
      npx postcss "**/*.css" --replace --use autoprefixer cssnano
    `, { cwd: buildPath });
  }

  private async setupCaching(buildPath: string) {
    const swContent = `
      import { setupWorkbox } from '@/lib/workbox';
      
      setupWorkbox({
        runtime: 'workbox-v6',
        precache: true,
        offline: true,
        cachingStrategies: {
          static: 'CacheFirst',
          dynamic: 'NetworkFirst',
          api: 'StaleWhileRevalidate',
        },
      });
    `;

    await fs.writeFile(
      path.join(buildPath, 'sw.js'),
      swContent
    );
  }
} 