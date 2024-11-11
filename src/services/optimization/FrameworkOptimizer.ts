/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { RenderingService } from '../RenderingService';
import { BuildService } from '../BuildService';
import { BuildPipeline } from '../BuildPipeline';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { Framework } from '@/types/index';
import path from 'path';
import fs from 'fs-extra';
import { execAsync } from '@/lib/exec';
import { Prisma } from '@prisma/client';

interface NextJSOptimizations {
  [key: string]: any;
  experimental: {
    ppr: boolean;
    serverActions: boolean;
    serverComponents: boolean;
    optimizeCss: boolean;
    optimizeImages: boolean;
    optimizeFonts: boolean;
    turbopack: boolean;
  };
  compiler: {
    removeConsole: boolean;
    reactRemoveProperties: boolean;
  };
}

interface RemixOptimizations {
  [key: string]: any;
  serverBundling: 'aggressive' | 'balanced' | 'conservative';
  clientBundling: 'aggressive' | 'balanced' | 'conservative';
  hydration: 'progressive' | 'eager' | 'lazy';
  prefetch: 'intent' | 'hover' | 'visible' | 'none';
}

interface AstroOptimizations {
  [key: string]: any;
  prerender: boolean;
  prefetch: boolean;
  islandArchitecture: boolean;
  partialHydration: boolean;
}

type FrameworkOptimizations = {
  NEXTJS: NextJSOptimizations;
  REMIX: RemixOptimizations;
  ASTRO: AstroOptimizations;
};

export class FrameworkOptimizer {
  private renderingService: RenderingService;
  private buildService: BuildService;
  private buildPipeline: BuildPipeline;

  constructor() {
    this.renderingService = new RenderingService();
    this.buildService = new BuildService();
    this.buildPipeline = new BuildPipeline();
  }

  async optimizeFramework(projectId: string, framework: Framework): Promise<void> {
    try {
      logger.info(`Starting framework optimization for project ${projectId} using ${framework}`);

      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          deployments: {
            where: { status: 'DEPLOYED' },
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      });

      if (!project) {
        throw new Error(`Project ${projectId} not found`);
      }

      const optimizations = this.getFrameworkOptimizations(framework);
      await this.applyFrameworkOptimizations(projectId, framework, optimizations);
      await this.updateProjectConfig(projectId, framework, optimizations);
      await this.optimizeBuild(projectId, framework);

      logger.info(`Framework optimization completed for project ${projectId}`);
    } catch (error) {
      logger.error(`Framework optimization failed for project ${projectId}:`, error);
      await this.recordOptimizationError(projectId, error as Error);
      throw error;
    }
  }

  private getFrameworkOptimizations(framework: Framework): FrameworkOptimizations[keyof FrameworkOptimizations] {
    const optimizations: FrameworkOptimizations = {
      NEXTJS: {
        experimental: {
          ppr: true,
          serverActions: true,
          serverComponents: true,
          optimizeCss: true,
          optimizeImages: true,
          optimizeFonts: true,
          turbopack: process.env.NODE_ENV === 'development'
        },
        compiler: {
          removeConsole: process.env.NODE_ENV === 'production',
          reactRemoveProperties: process.env.NODE_ENV === 'production'
        }
      },
      REMIX: {
        serverBundling: 'aggressive',
        clientBundling: 'aggressive',
        hydration: 'progressive',
        prefetch: 'intent'
      },
      ASTRO: {
        prerender: true,
        prefetch: true,
        islandArchitecture: true,
        partialHydration: true
      }
    };

    if (!(framework in optimizations)) {
      throw new Error(`Unsupported framework: ${framework}`);
    }

    return optimizations[framework as keyof FrameworkOptimizations];
  }

  private async applyFrameworkOptimizations(
    projectId: string,
    framework: Framework,
    optimizations: FrameworkOptimizations[keyof FrameworkOptimizations]
  ): Promise<void> {
    const buildPath = await this.getBuildPath(projectId);
    
    switch (framework) {
      case 'NEXTJS':
        await this.applyNextJSOptimizations(buildPath, optimizations as NextJSOptimizations);
        break;
      case 'REMIX':
        await this.applyRemixOptimizations(buildPath, optimizations as RemixOptimizations);
        break;
      case 'ASTRO':
        await this.applyAstroOptimizations(buildPath, optimizations as AstroOptimizations);
        break;
      default:
        throw new Error(`Unsupported framework: ${framework}`);
    }
  }

  private async getBuildPath(projectId: string): Promise<string> {
    const deployment = await prisma.deployment.findFirst({
      where: { projectId, status: 'DEPLOYED' },
      orderBy: { createdAt: 'desc' }
    });

    if (!deployment) {
      throw new Error('No active deployment found');
    }

    return path.join(process.cwd(), 'builds', deployment.id);
  }

  private async updateProjectConfig(
    projectId: string,
    framework: Framework,
    optimizations: FrameworkOptimizations[keyof FrameworkOptimizations]
  ): Promise<void> {
    // Convert the optimizations to a plain object that Prisma can store as JSON
    const buildSettings = {
      framework: framework,
      optimizations: JSON.parse(JSON.stringify(optimizations)) // Ensure it's a plain object
    };

    await prisma.projectConfig.upsert({
      where: { projectId },
      create: {
        projectId,
        framework,
        renderingConfig: JSON.parse(JSON.stringify(optimizations)), // Convert to plain JSON
        buildSettings: buildSettings as Prisma.JsonObject // Type assertion for Prisma
      },
      update: {
        framework,
        renderingConfig: JSON.parse(JSON.stringify(optimizations)), // Convert to plain JSON
        buildSettings: buildSettings as Prisma.JsonObject // Type assertion for Prisma
      }
    });
  }

  private async recordOptimizationError(projectId: string, error: Error): Promise<void> {
    await prisma.project.update({
      where: { id: projectId },
      data: {
        optimizationStatus: 'FAILED',
        lastOptimized: new Date()
      }
    });

    logger.error(`Framework optimization error for project ${projectId}:`, error);
  }

  private async optimizeBuild(projectId: string, framework: Framework): Promise<void> {
    const buildPath = await this.getBuildPath(projectId);
    
    try {
      // Run framework-specific build optimizations
      switch (framework) {
        case 'NEXTJS':
          await this.optimizeNextJSBuild(buildPath);
          break;
        case 'REMIX':
          await this.optimizeRemixBuild(buildPath);
          break;
        case 'ASTRO':
          await this.optimizeAstroBuild(buildPath);
          break;
      }

      // Update optimization status
      await prisma.project.update({
        where: { id: projectId },
        data: {
          optimizationStatus: 'OPTIMIZED',
          lastOptimized: new Date()
        }
      });
    } catch (error) {
      logger.error(`Build optimization failed for ${framework}:`, error);
      throw error;
    }
  }

  private async optimizeNextJSBuild(buildPath: string): Promise<void> {
    try {
      // Run Next.js specific build optimizations
      await execAsync('npm run build', { cwd: buildPath });
      
      // Additional build optimizations
      await execAsync('next-bundle-analyzer', { cwd: buildPath });
      await execAsync('next-optimize', { cwd: buildPath });
      
      logger.info('Next.js build optimization completed');
    } catch (error) {
      logger.error('Next.js build optimization failed:', error);
      throw error;
    }
  }

  private async optimizeRemixBuild(buildPath: string): Promise<void> {
    try {
      // Run Remix specific build optimizations
      await execAsync('npm run build', { cwd: buildPath });
      
      // Additional build optimizations
      await execAsync('remix-build-optimize', { cwd: buildPath });
      await execAsync('remix-bundle-analyzer', { cwd: buildPath });
      
      logger.info('Remix build optimization completed');
    } catch (error) {
      logger.error('Remix build optimization failed:', error);
      throw error;
    }
  }

  private async optimizeAstroBuild(buildPath: string): Promise<void> {
    try {
      // Run Astro specific build optimizations
      await execAsync('npm run build', { cwd: buildPath });
      
      // Additional build optimizations
      await execAsync('astro-compress', { cwd: buildPath });
      await execAsync('astro-bundle-analyzer', { cwd: buildPath });
      
      logger.info('Astro build optimization completed');
    } catch (error) {
      logger.error('Astro build optimization failed:', error);
      throw error;
    }
  }

  private async applyNextJSOptimizations(buildPath: string, optimizations: NextJSOptimizations): Promise<void> {
    try {
      // 1. Update next.config.js
      const configPath = path.join(buildPath, 'next.config.js');
      const config = {
        ...optimizations,
        webpack: (config: any) => {
          // Enable production optimizations
          config.optimization = {
            minimize: true,
            splitChunks: {
              chunks: 'all',
              minSize: 20000,
              maxSize: 244000,
              cacheGroups: {
                framework: {
                  test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
                  name: 'framework',
                  priority: 10,
                  enforce: true
                }
              }
            }
          };
          return config;
        }
      };

      await fs.writeFile(
        configPath,
        `module.exports = ${JSON.stringify(config, null, 2)}`
      );

      // 2. Install optimization dependencies
      await execAsync('npm install --save-dev terser-webpack-plugin @next/bundle-analyzer', {
        cwd: buildPath
      });

      logger.info('Applied Next.js optimizations successfully');
    } catch (error) {
      logger.error('Failed to apply Next.js optimizations:', error);
      throw error;
    }
  }

  private async applyRemixOptimizations(buildPath: string, optimizations: RemixOptimizations): Promise<void> {
    try {
      // 1. Update remix.config.js
      const configPath = path.join(buildPath, 'remix.config.js');
      const config = {
        serverBuildTarget: "vercel",
        server: "./server.js",
        ignoredRouteFiles: [".*"],
        ...optimizations,
        serverBuildPath: "api/index.js",
        serverDependenciesToBundle: "all",
        future: {
          unstable_cssModules: true,
          unstable_cssSideEffectImports: true,
          unstable_dev: true,
          unstable_postcss: true,
          unstable_tailwind: true,
          v2_errorBoundary: true,
          v2_meta: true,
          v2_normalizeFormMethod: true,
          v2_routeConvention: true
        }
      };

      await fs.writeFile(
        configPath,
        `module.exports = ${JSON.stringify(config, null, 2)}`
      );

      // 2. Install optimization dependencies
      await execAsync('npm install --save-dev @remix-run/dev esbuild-plugin-compress', {
        cwd: buildPath
      });

      logger.info('Applied Remix optimizations successfully');
    } catch (error) {
      logger.error('Failed to apply Remix optimizations:', error);
      throw error;
    }
  }

  private async applyAstroOptimizations(buildPath: string, optimizations: AstroOptimizations): Promise<void> {
    try {
      // 1. Update astro.config.mjs
      const configPath = path.join(buildPath, 'astro.config.mjs');
      const config = {
        output: 'static',
        ...optimizations,
        build: {
          inlineStylesheets: 'auto',
          split: true,
          preserveAssets: true
        },
        vite: {
          build: {
            cssCodeSplit: true,
            rollupOptions: {
              output: {
                manualChunks: {
                  'vendor': [/node_modules/]
                }
              }
            }
          },
          ssr: {
            noExternal: ['@astrojs/*']
          }
        }
      };

      await fs.writeFile(
        configPath,
        `export default ${JSON.stringify(config, null, 2)}`
      );

      // 2. Install optimization dependencies
      await execAsync('npm install --save-dev @astrojs/prefetch rollup-plugin-visualizer', {
        cwd: buildPath
      });

      logger.info('Applied Astro optimizations successfully');
    } catch (error) {
      logger.error('Failed to apply Astro optimizations:', error);
      throw error;
    }
  }
} 