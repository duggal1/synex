/* eslint-disable @typescript-eslint/no-unused-vars */
import { BuildService } from '../BuildService';
import { Framework, FrameworkType } from '@/types/index';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import path from 'path';
import fs from 'fs-extra';
import * as terser from 'terser';
import cssnano from 'cssnano';
import postcss from 'postcss';
import { BuildPipeline } from '../BuildPipeline';
import { MetricsCollector } from '@/lib/metrics';
import { Prisma } from '@prisma/client';

                        
interface BuildOptimizationConfig {
  treeshaking: {
    enabled: boolean;
    modules: boolean;
    sideEffects: boolean;
  };
  splitting: {
    chunks: 'all' | 'async' | 'initial';
    maxInitialRequests: number;
    maxAsyncRequests: number;
    minSize: number;
  };
  compression: {
    javascript: {
      terser: boolean;
      mangleProps: boolean;
      compress: {
        drop_console: boolean;
        pure_funcs: string[];
      };
    };
    css: {
      cssnano: boolean;
      purgeUnused: boolean;
    };
  };
  caching: {
    buildCache: boolean;
    incrementalCache: boolean;
    persistentCache: boolean;
  };
}

export class BuildOptimizer {
  private buildService: BuildService;
  private buildPipeline: BuildPipeline;
  private metricsCollector: MetricsCollector;
  private readonly cacheDir: string;

  constructor() {
    this.buildService = new BuildService();
    this.buildPipeline = new BuildPipeline();
    this.metricsCollector = new MetricsCollector();
    this.cacheDir = path.join(process.cwd(), 'cache', 'build-optimization');
    this.ensureCacheDirectory();
  }

  async optimize(projectId: string, framework: Framework): Promise<void> {
    const startTime = Date.now();
    
    try {
      logger.info(`Starting build optimization for project ${projectId}`);

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

      if (!project || !project.deployments[0]) {
        throw new Error('Project or active deployment not found');
      }

      const config = await this.getOptimizationConfig(project.id, framework);
      const buildPath = path.join(process.cwd(), 'builds', project.deployments[0].id);

      await this.validateBuildPath(buildPath);
      
      // Track optimization metrics
      const metrics = {
        jsFileCount: 0,
        cssFileCount: 0,
        totalSizeBefore: 0,
        totalSizeAfter: 0
      };

      // Optimize JavaScript files
      metrics.jsFileCount = await this.optimizeJavaScript(buildPath, config.compression.javascript);
      
      // Optimize CSS files
      metrics.cssFileCount = await this.optimizeCSS(buildPath, config.compression.css);
      
      // Setup caching configuration
      await this.setupCaching(project.id, config.caching);
      
      // Update build settings
      await this.updateBuildSettings(project.id, config);

      // Calculate optimization duration
      const duration = Date.now() - startTime;

      // Update optimization status with metrics
      await this.updateOptimizationStatus(project.id, {
        duration,
        metrics,
        framework
      });
      
      logger.info(`Build optimization completed for project ${projectId}`, {
        duration,
        metrics
      });
    } catch (error) {
      logger.error(`Build optimization failed for project ${projectId}:`, error);
      await this.recordOptimizationError(projectId, error as Error);
      throw error;
    }
  }

  private async optimizeJavaScript(
    buildPath: string, 
    config: BuildOptimizationConfig['compression']['javascript']
  ): Promise<number> {
    const jsFiles = await this.findFiles(buildPath, '.js');
    let optimizedCount = 0;
    
    for (const file of jsFiles) {
      try {
        const code = await fs.readFile(file, 'utf-8');
        const result = await terser.minify(code, {
          mangle: {
            properties: config.mangleProps
          },
          compress: config.compress,
          format: {
            comments: false
          }
        });

        if (result.code) {
          await fs.writeFile(file, result.code);
          optimizedCount++;
        }
      } catch (error) {
        logger.warn(`Failed to optimize JavaScript file: ${file}`, error);
      }
    }
    
    return optimizedCount;
  }

  private async optimizeCSS(
    buildPath: string, 
    config: BuildOptimizationConfig['compression']['css']
  ): Promise<number> {
    const cssFiles = await this.findFiles(buildPath, '.css');
    const postcssProcessor = postcss([cssnano()]);
    let optimizedCount = 0;

    for (const file of cssFiles) {
      try {
        const css = await fs.readFile(file, 'utf-8');
        const result = await postcssProcessor.process(css, { from: file });
        await fs.writeFile(file, result.css);
        optimizedCount++;
      } catch (error) {
        logger.warn(`Failed to optimize CSS file: ${file}`, error);
      }
    }

    return optimizedCount;
  }

  private async setupCaching(
    projectId: string, 
    config: BuildOptimizationConfig['caching']
  ): Promise<void> {
    await prisma.projectConfig.upsert({
      where: { projectId },
      create: {
        projectId,
        buildCache: config.buildCache,
        incrementalCache: config.incrementalCache,
        persistentCache: config.persistentCache,
        renderingConfig: {},
        framework: Framework.NEXTJS
      },
      update: {
        buildCache: config.buildCache,
        incrementalCache: config.incrementalCache,
        persistentCache: config.persistentCache
      }
    });
  }

  private async updateBuildSettings(
    projectId: string, 
    config: BuildOptimizationConfig
  ): Promise<void> {
    const buildSettings = {
      treeshaking: config.treeshaking,
      splitting: config.splitting
    };

    await prisma.projectConfig.upsert({
      where: { projectId },
      create: {
        projectId,
        buildSettings: buildSettings as Prisma.JsonObject,
        renderingConfig: {},
        framework: Framework.NEXTJS
      },
      update: {
        buildSettings: buildSettings as Prisma.JsonObject
      }
    });
  }

  private async findFiles(dir: string, extension: string): Promise<string[]> {
    const files: string[] = [];
    
    try {
      const items = await fs.readdir(dir, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
          files.push(...await this.findFiles(fullPath, extension));
        } else if (item.isFile() && item.name.endsWith(extension)) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      logger.error(`Error finding files in directory ${dir}:`, error);
    }
    
    return files;
  }

  private async validateBuildPath(buildPath: string): Promise<void> {
    try {
      const exists = await fs.pathExists(buildPath);
      if (!exists) {
        throw new Error(`Build path does not exist: ${buildPath}`);
      }
      
      const stats = await fs.stat(buildPath);
      if (!stats.isDirectory()) {
        throw new Error(`Build path is not a directory: ${buildPath}`);
      }
    } catch (error) {
      logger.error(`Build path validation failed: ${buildPath}`, error);
      throw error;
    }
  }

  private async getOptimizationConfig(
    projectId: string, 
    framework: Framework
  ): Promise<BuildOptimizationConfig> {
    const projectConfig = await prisma.projectConfig.findUnique({
      where: { projectId },
      select: {
        buildSettings: true
      }
    });

    const defaultConfig: BuildOptimizationConfig = {
      treeshaking: {
        enabled: true,
        modules: true,
        sideEffects: true
      },
      splitting: {
        chunks: 'all',
        maxInitialRequests: 25,
        maxAsyncRequests: 30,
        minSize: 20000
      },
      compression: {
        javascript: {
          terser: true,
          mangleProps: true,
          compress: {
            drop_console: true,
            pure_funcs: ['console.log']
          }
        },
        css: {
          cssnano: true,
          purgeUnused: true
        }
      },
      caching: {
        buildCache: true,
        incrementalCache: true,
        persistentCache: true
      }
    };

    const buildSettings = projectConfig?.buildSettings as { optimization?: BuildOptimizationConfig };
    if (!buildSettings?.optimization) {
      return defaultConfig;
    }

    return buildSettings.optimization;
  }
  private async updateOptimizationStatus(
    projectId: string,
    data: {
      duration: number;
      metrics: Record<string, number>;
      framework: Framework;
    }
  ): Promise<void> {
    await prisma.$transaction([
      // Update project status
      prisma.project.update({
        where: { id: projectId },
        data: {
          optimizationStatus: 'OPTIMIZED',
          lastOptimized: new Date(),
        }
      }),
      // Create optimization metrics
      prisma.optimizationMetrics.create({
        data: {
          projectId,
          type: 'OPTIMIZATION',
          duration: data.duration,
          framework: data.framework,
          data: data.metrics as Prisma.JsonObject,
        }
      })
    ]);
  }

  private async recordOptimizationError(projectId: string, error: Error): Promise<void> {
    await prisma.$transaction([
      // Update project status
      prisma.project.update({
        where: { id: projectId },
        data: {
          optimizationStatus: 'FAILED',
        }
      }),
      // Create error metrics
      prisma.optimizationMetrics.create({
        data: {
          projectId,
          type: 'OPTIMIZATION_ERROR',
          error: error.message,
          stack: error.stack || '',
        }
      })
    ]);
  }

  private async ensureCacheDirectory(): Promise<void> {
    try {
      await fs.ensureDir(this.cacheDir);
      logger.info(`Cache directory ensured: ${this.cacheDir}`);
    } catch (error) {
      logger.error(`Failed to create cache directory: ${this.cacheDir}`, error);
      throw error;
    }
  }
}