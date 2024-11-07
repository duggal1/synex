/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { prisma } from '@/lib/prisma';
import { Framework } from '@/types/index';
import { logger } from '@/lib/logger';
import { Prisma } from '@prisma/client';

// Configuration interfaces for each framework
type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

interface BaseConfig {
  [key: string]: JsonValue;
}

interface NextJSConfig extends BaseConfig {
  serverComponents: boolean;
  streaming: boolean;
  suspense: boolean;
  lazyLoading: boolean;
  incrementalCache: {
    ttl: number;
    revalidate: 'on-demand' | 'time-based';
    staleWhileRevalidate: number;
  };
  renderingStrategies: {
    default: 'static' | 'ssr' | 'isr' | 'hybrid';
    static: string[];
    ssr: string[];
    isr: string[];
    revalidationPeriods?: Record<string, number>;
  };
  optimization: {
    minimizeBundleSize: boolean;
    imageOptimization: boolean;
    fontOptimization: boolean;
    preloadCriticalAssets: boolean;
    dynamicImports: boolean;
  };
  experimental: {
    ppr: boolean; // Partial Prerendering
    serverActions: boolean;
    optimizeCss: boolean;
    turbopack: boolean;
  };
}

interface RemixConfig extends BaseConfig {
  serverBundling: 'minimal' | 'optimal' | 'aggressive';
  clientBundling: 'minimal' | 'optimal' | 'aggressive';
  prefetch: 'none' | 'intent' | 'all';
  hydration: 'full' | 'selective' | 'progressive';
  caching: {
    strategy: 'memory' | 'filesystem' | 'redis';
    ttl: number;
    staleWhileRevalidate: number;
    browser: {
      maxAge: number;
      staleWhileRevalidate: number;
    };
  };
  compression: {
    enabled: boolean;
    level: number;
    algorithm: 'gzip' | 'brotli';
  };
  optimization: {
    splitting: boolean;
    treeshaking: boolean;
    minification: boolean;
    modulePreload: boolean;
  };
}

interface AstroConfig extends BaseConfig {
  prerender: boolean;
  prefetch: boolean;
  islandArchitecture: boolean;
  partialHydration: boolean;
  compression: {
    html: boolean;
    assets: boolean;
    level: number;
    algorithm: 'gzip' | 'brotli';
  };
  imageOptimization: {
    enabled: boolean;
    quality: number;
    formats: ('webp' | 'avif')[];
    sizes: number[];
    placeholder: 'blur' | 'dominantColor' | 'none';
  };
  performance: {
    prefetch: 'hover' | 'viewport' | 'none';
    preload: string[];
    modulePreload: boolean;
    inlineStyles: boolean;
    inlineScripts: boolean;
  };
}

// Update the type definitions
type PrismaJson = Prisma.JsonValue;

export class RenderingService {
  async optimizeRendering(projectId: string, framework: Framework): Promise<void> {
    try {
      const project = await prisma.project.findUnique({
        where: { id: projectId }
      });

      if (!project) {
        throw new Error(`Project ${projectId} not found`);
      }

      logger.info(`Optimizing rendering for project ${projectId} using ${framework}`);

      // Framework-specific optimizations
      switch (framework) {
        case 'NEXTJS':
          await this.optimizeNextJS(projectId);
          break;
        case 'REMIX':
          await this.optimizeRemix(projectId);
          break;
        case 'ASTRO':
          await this.optimizeAstro(projectId);
          break;
        default:
          throw new Error(`Unsupported framework: ${framework}`);
      }

      // Update project optimization status
      await this.updateOptimizationStatus(projectId, framework);

      logger.info(`Successfully optimized rendering for project ${projectId}`);
    } catch (error) {
      logger.error(`Rendering optimization failed for project ${projectId}:`, error as Error);
      throw error;
    }
  }

  private async optimizeNextJS(projectId: string): Promise<void> {
    const config: NextJSConfig = {
      serverComponents: true,
      streaming: true,
      suspense: true,
      lazyLoading: true,
      incrementalCache: {
        ttl: 3600,
        revalidate: 'on-demand',
        staleWhileRevalidate: 86400 // 24 hours
      },
      renderingStrategies: {
        default: 'hybrid',
        static: ['/', '/blog/*', '/docs/*'],
        ssr: ['/dashboard/*', '/account/*'],
        isr: ['/products/*', '/categories/*'],
        revalidationPeriods: {
          '/products/*': 3600,
          '/categories/*': 7200
        }
      },
      optimization: {
        minimizeBundleSize: true,
        imageOptimization: true,
        fontOptimization: true,
        preloadCriticalAssets: true,
        dynamicImports: true
      },
      experimental: {
        ppr: true,
        serverActions: true,
        optimizeCss: true,
        turbopack: process.env.NODE_ENV === 'development'
      }
    };

    if (!this.validateConfig(config, 'NEXTJS')) {
      throw new Error('Invalid Next.js configuration');
    }

    await this.setupNextJSConfig(projectId, config);
    await this.optimizeNextJSBuild(projectId);
  }

  private async optimizeRemix(projectId: string): Promise<void> {
    const config: RemixConfig = {
      serverBundling: 'aggressive',
      clientBundling: 'aggressive',
      prefetch: 'intent',
      hydration: 'progressive',
      caching: {
        strategy: 'redis',
        ttl: 3600,
        staleWhileRevalidate: 7200,
        browser: {
          maxAge: 3600,
          staleWhileRevalidate: 7200
        }
      },
      compression: {
        enabled: true,
        level: 9,
        algorithm: 'brotli'
      },
      optimization: {
        splitting: true,
        treeshaking: true,
        minification: true,
        modulePreload: true
      }
    };

    if (!this.validateConfig(config, 'REMIX')) {
      throw new Error('Invalid Remix configuration');
    }

    await this.setupRemixConfig(projectId, config);
    await this.optimizeRemixBuild(projectId);
  }

  private async optimizeAstro(projectId: string): Promise<void> {
    const config: AstroConfig = {
      prerender: true,
      prefetch: true,
      islandArchitecture: true,
      partialHydration: true,
      compression: {
        html: true,
        assets: true,
        level: 9,
        algorithm: 'brotli'
      },
      imageOptimization: {
        enabled: true,
        quality: 85,
        formats: ['webp', 'avif'],
        sizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        placeholder: 'blur'
      },
      performance: {
        prefetch: 'viewport',
        preload: ['/fonts/*', '/critical-styles.css'],
        modulePreload: true,
        inlineStyles: true,
        inlineScripts: false
      }
    };

    if (!this.validateConfig(config, 'ASTRO')) {
      throw new Error('Invalid Astro configuration');
    }

    await this.setupAstroConfig(projectId, config);
    await this.optimizeAstroBuild(projectId);
  }

  private async setupNextJSConfig(projectId: string, config: NextJSConfig): Promise<void> {
    try {
      // Update next.config.js
      await this.updateProjectConfig(projectId, 'next.config.js', config);

      const jsonConfig: PrismaJson = {
        ...config,
        _type: 'nextjs'
      };

      // Update rendering strategies in database
      await prisma.projectConfig.upsert({
        where: { projectId },
        update: {
          renderingConfig: jsonConfig,
          framework: 'NEXTJS',
          strategy: this.determineRenderingStrategy(config)
        },
        create: {
          projectId,
          renderingConfig: jsonConfig,
          framework: 'NEXTJS',
          strategy: this.determineRenderingStrategy(config)
        }
      });
    } catch (error) {
      logger.error(`Failed to setup Next.js config for project ${projectId}:`, error);
      throw error;
    }
  }

  private async setupRemixConfig(projectId: string, config: RemixConfig): Promise<void> {
    try {
      // Update remix.config.js
      await this.updateProjectConfig(projectId, 'remix.config.js', config);

      const jsonConfig: PrismaJson = {
        ...config,
        _type: 'remix'
      };

      // Update rendering strategies in database
      await prisma.projectConfig.upsert({
        where: { projectId },
        update: {
          renderingConfig: jsonConfig,
          framework: 'REMIX',
          strategy: this.determineRenderingStrategy(config)
        },
        create: {
          projectId,
          renderingConfig: jsonConfig,
          framework: 'REMIX',
          strategy: this.determineRenderingStrategy(config)
        }
      });
    } catch (error) {
      logger.error(`Failed to setup Remix config for project ${projectId}:`, error);
      throw error;
    }
  }

  private async setupAstroConfig(projectId: string, config: AstroConfig): Promise<void> {
    try {
      // Update astro.config.mjs
      await this.updateProjectConfig(projectId, 'astro.config.mjs', config);

      const jsonConfig: PrismaJson = {
        ...config,
        _type: 'astro'
      };

      // Update rendering strategies in database
      await prisma.projectConfig.upsert({
        where: { projectId },
        update: {
          renderingConfig: jsonConfig,
          framework: 'ASTRO',
          strategy: this.determineRenderingStrategy(config)
        },
        create: {
          projectId,
          renderingConfig: jsonConfig,
          framework: 'ASTRO',
          strategy: this.determineRenderingStrategy(config)
        }
      });
    } catch (error) {
      logger.error(`Failed to setup Astro config for project ${projectId}:`, error);
      throw error;
    }
  }

  private async updateProjectConfig(projectId: string, filename: string, config: any): Promise<void> {
    try {
      await prisma.projectFile.upsert({
        where: {
          projectId_filename: {
            projectId,
            filename
          }
        },
        update: {
          content: JSON.stringify(config, null, 2)
        },
        create: {
          projectId,
          filename,
          content: JSON.stringify(config, null, 2)
        }
      });
    } catch (error) {
      logger.error(`Failed to update project config file ${filename}:`, error as Error);
      throw error;
    }
  }

  private async updateOptimizationStatus(projectId: string, framework: Framework): Promise<void> {
    try {
      await prisma.project.update({
        where: { id: projectId },
        data: {
          optimizationStatus: 'OPTIMIZED',
          lastOptimized: new Date()
        }
      });
    } catch (error) {
      logger.error(`Failed to update optimization status for project ${projectId}:`, error as Error);
      throw error;
    }
  }

  private determineRenderingStrategy(config: NextJSConfig | RemixConfig | AstroConfig): 'STATIC' | 'SSR' | 'ISR' | 'HYBRID' {
    try {
      if ('renderingStrategies' in config && config.renderingStrategies && typeof config.renderingStrategies === 'object' && 'default' in config.renderingStrategies) {
        const strategy = config.renderingStrategies.default;
        if (typeof strategy === 'string') {
          return strategy.toUpperCase() as 'STATIC' | 'SSR' | 'ISR' | 'HYBRID';
        }
      }
      
      if ('prerender' in config && config.prerender) {
        return 'STATIC';
      }
      
      if ('serverBundling' in config) {
        return config.serverBundling === 'aggressive' ? 'SSR' : 'HYBRID';
      }
      
      return 'STATIC';
    } catch (error) {
      logger.warn(`Failed to determine rendering strategy, defaulting to STATIC:`, error);
      return 'STATIC';
    }
  }

  private async optimizeNextJSBuild(projectId: string): Promise<void> {
    try {
      const buildConfig = await this.generateBuildConfig('NEXTJS');
      await this.updateProjectConfig(projectId, 'next.config.js', buildConfig);
    } catch (error) {
      logger.error(`Failed to optimize Next.js build for project ${projectId}:`, error);
      throw error;
    }
  }

  private async optimizeRemixBuild(projectId: string): Promise<void> {
    try {
      const buildConfig = await this.generateBuildConfig('REMIX');
      await this.updateProjectConfig(projectId, 'remix.config.js', buildConfig);
    } catch (error) {
      logger.error(`Failed to optimize Remix build for project ${projectId}:`, error);
      throw error;
    }
  }

  private async optimizeAstroBuild(projectId: string): Promise<void> {
    try {
      const buildConfig = await this.generateBuildConfig('ASTRO');
      await this.updateProjectConfig(projectId, 'astro.config.mjs', buildConfig);
    } catch (error) {
      logger.error(`Failed to optimize Astro build for project ${projectId}:`, error);
      throw error;
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

  private validateConfig(config: NextJSConfig | RemixConfig | AstroConfig, framework: Framework): boolean {
    try {
      switch (framework) {
        case 'NEXTJS':
          return 'renderingStrategies' in config && 'optimization' in config;
        case 'REMIX':
          return 'serverBundling' in config && 'clientBundling' in config;
        case 'ASTRO':
          return 'prerender' in config && 'imageOptimization' in config;
        default:
          return false;
      }
    } catch (error) {
      logger.error(`Config validation failed:`, error);
      return false;
    }
  }
}