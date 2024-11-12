/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { prisma } from '@/lib/prisma';
import { Framework, BuildResult, OptimizationConfig, BundleAnalysis, CachedBuildResult } from '@/types/index';
import path from 'path';
import fs from 'fs-extra';
import { exec } from 'child_process';
import { promisify } from 'util';
import { logger } from '@/lib/logger';
import { createHash } from 'crypto';
import { optimize } from 'svgo';
import sharp from 'sharp';
import * as terser from 'terser';
import cssnano from 'cssnano';
import postcss from 'postcss';

const execAsync = promisify(exec);

interface BuildOptions {
  minify: boolean;
  compress: boolean;
  sourceMaps: boolean;
  target: 'es5' | 'es6';
}

interface AssetManifest {
    entry: Record<string, string>;
    routes: Record<string, string>;
    css: string[];
    js: string[];
}

export class BuildPipeline {
  [x: string]: any;
  private readonly buildDir: string;
  private readonly cacheDir: string;
  private readonly buildOptions: BuildOptions;

  constructor(options: Partial<BuildOptions> = {}) {
    this.buildDir = path.join(process.cwd(), 'builds');
    this.cacheDir = path.join(process.cwd(), 'cache');
    this.buildOptions = {
      minify: options.minify ?? true,
      compress: options.compress ?? true,
      sourceMaps: options.sourceMaps ?? false,
      target: options.target ?? 'es6'
    };
    this.ensureDirectories();
  }

  async build(deploymentId: string, files: Buffer, framework: Framework): Promise<BuildResult> {
    const buildPath = path.join(this.buildDir, deploymentId);
    const startTime = Date.now();

    try {
        logger.info(`Starting build for deployment ${deploymentId} with framework ${framework}`);

        // Extract files
        await this.extractFiles(buildPath, files);
        logger.info('Files extracted successfully');

        // Generate cache key
        const cacheKey = await this.generateCacheKey(buildPath);
        logger.info(`Cache key generated: ${cacheKey}`);

        // Check cache
        const cachedResult = await this.checkCache(cacheKey);
        if (cachedResult) {
            logger.info('Build cache hit, using cached build');
            await this.updateBuildStatus(deploymentId, 'DEPLOYED', 0);
            return cachedResult;
        }

        // Install dependencies with caching
        await this.installDependencies(buildPath, framework);
        logger.info('Dependencies installed successfully');

        // Framework-specific build
        const buildResult = await this.runFrameworkBuild(buildPath, framework);
        logger.info('Framework build completed');

        // Optimize output
        await this.optimizeOutput(buildPath, framework);
        logger.info('Build output optimized');

        // Cache the build
        await this.cacheBuild(buildPath, cacheKey);
        logger.info('Build cached successfully');

        const buildTime = Date.now() - startTime;
        const deployment = await prisma.deployment.findUnique({
            where: { id: deploymentId }
        });

        if (!deployment) {
            throw new Error('Deployment not found');
        }

        const freshResult: BuildResult = {
            buildId: deploymentId,
            buildTime,
            duration: buildTime,
            logs: deployment.buildLogs as string[],
            assets: {
                static: await this.getStaticAssets(buildPath),
                server: await this.getServerAssets(buildPath)
            },
            env: {},
            cacheKey,
            cached: false,
            outputPath: buildPath,
            optimizationStats: await this.getOptimizationStats(buildPath)
        };

        return freshResult;

    } catch (error) {
        logger.error(`Build failed for deployment ${deploymentId}:`, error);
        if (error instanceof Error) {
            await this.updateBuildStatus(deploymentId, 'FAILED', 0, error);
        } else {
            await this.updateBuildStatus(deploymentId, 'FAILED', 0, new Error(String(error)));
        }
        throw error;
    } finally {
        // Cleanup temporary files
        await this.cleanup(buildPath);
    }
  }

  private async extractFiles(buildPath: string, files: Buffer): Promise<void> {
    try {
      const AdmZip = require('adm-zip');
      const zip = new AdmZip(files);
      zip.extractAllTo(buildPath, true);
      
      // Verify extraction
      const extractedFiles = await fs.readdir(buildPath);
      if (extractedFiles.length === 0) {
        throw new Error('No files were extracted');
      }
    } catch (error) {
      logger.error('File extraction failed:', error);
      throw new Error(`Failed to extract files: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async installDependencies(buildPath: string, framework: Framework) {
    const packageManager = fs.existsSync(path.join(buildPath, 'yarn.lock')) ? 'yarn' : 'npm';
    await execAsync(`${packageManager} install`, { cwd: buildPath });
  }

  private async runFrameworkBuild(buildPath: string, framework: Framework): Promise<BuildResult> {
    logger.info(`Starting ${framework} build process`);
    
    try {
        // Validate project structure
        await this.validateProjectStructure(buildPath, framework);
        
        // Install dependencies with proper error handling
        await this.installDependencies(buildPath, framework).catch(error => {
            logger.error(`Failed to install dependencies for ${framework}:`, error);
            throw new Error(`Dependency installation failed: ${error.message}`);
        });
        
        // Run framework-specific build
        let buildResult: BuildResult;
        switch (framework) {
            case 'NEXTJS':
                buildResult = await this.buildNextJS(buildPath);
                break;
            case 'REMIX':
                buildResult = await this.buildRemix(buildPath);
                break;
            case 'ASTRO':
                buildResult = await this.buildAstro(buildPath);
                break;
            default:
                throw new Error(`Unsupported framework: ${framework}`);
        }
        
        logger.info(`${framework} build completed successfully`);
        return buildResult;
        
    } catch (error) {
        logger.error(`Build failed for ${framework}:`, error);
        throw error;
    }
  }

  private async buildNextJS(buildPath: string): Promise<BuildResult> {
    try {
        // Configure Next.js
        await this.configureNextJS(buildPath);
        
        // Run build
        const { stdout, stderr } = await execAsync('npm run build', {
            cwd: buildPath,
            env: { ...process.env, NODE_ENV: 'production' }
        });

        // Verify build output
        const outputPath = path.join(buildPath, '.next');
        if (!await fs.pathExists(outputPath)) {
            throw new Error('Next.js build failed to generate output directory');
        }

        return {
            outputPath,
            buildTime: Date.now(), // Track actual build time
            env: { NODE_ENV: 'production' },
            buildId: await this.generateBuildId(buildPath),
            cached: false,
            duration: process.hrtime()[0],
            logs: [stdout, stderr],
            assets: await this.getNextAssets(outputPath),
            cacheKey: await this.generateCacheKey(buildPath),
           // size: await this.calculateBuildSize(outputPath),
            optimizationStats: await this.getOptimizationStats(outputPath)
        };
    } catch (error) {
        logger.error('Next.js build failed:', error);
        throw error;
    }
  }

  private async configureNextJS(buildPath: string): Promise<void> {
    const nextConfig = {
        output: 'standalone',
        experimental: {
            optimizeCss: true,
            optimizeImages: true,
            optimizeFonts: true
        },
        compiler: {
            removeConsole: process.env.NODE_ENV === 'production'
        },
        swcMinify: true,
        compress: true
    };

    await fs.writeFile(
        path.join(buildPath, 'next.config.js'),
        `module.exports = ${JSON.stringify(nextConfig, null, 2)}`
    );
  }

  private async buildRemix(buildPath: string): Promise<BuildResult> {
    logger.info('Starting Remix build process');
    
    try {
      // Install Remix dependencies
      await execAsync('npm install @remix-run/dev @remix-run/serve', { cwd: buildPath });

      // Configure Remix for production
      await this.configureRemixForProduction(buildPath);

      // Run build
      const { stdout, stderr } = await execAsync('npx remix build', { 
        cwd: buildPath,
        env: { ...process.env, NODE_ENV: 'production' }
      });

      // Verify build output
      const buildOutputPath = path.join(buildPath, 'build');
      if (!await fs.pathExists(buildOutputPath)) {
        throw new Error('Remix build failed to generate output directory');
      }

      // Optimize build output
      await this.optimizeRemixOutput(buildPath);

      const buildTime = Date.now();
      const cacheKey = await this.generateBuildCacheKey(buildPath);
      const buildId = crypto.randomUUID();
      const duration = Date.now() - buildTime;
      const logs = { stdout, stderr };
      const assets = await this.collectAssets(buildOutputPath);

      return {
        outputPath: buildOutputPath,
        env: { NODE_ENV: 'production' },
        buildTime,
        buildId,
        duration,
        logs: [stdout, stderr],
        assets,
        cached: false,
        cacheKey
      };
    } catch (error) {
      logger.error('Remix build failed:', error);
      throw new Error(`Remix build failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async optimizeRemixOutput(buildPath: string): Promise<void> {
    const remixBuildDir = path.join(buildPath, 'build');
    
    // Optimize client bundles
    await this.optimizeClientBundles(path.join(remixBuildDir, 'client'));
    
    // Optimize server bundle
    await this.optimizeServerBundle(path.join(remixBuildDir, 'server'));
    
    // Generate asset manifest
    await this.generateAssetManifest(remixBuildDir);
  }

  private async optimizeClientBundles(clientDir: string): Promise<void> {
    // Optimize client-side JavaScript
    await this.optimizeJavaScript(clientDir);
    
    // Optimize CSS
    await this.optimizeCSS(clientDir);
    
    // Optimize chunks
    const entries = await fs.readdir(clientDir);
    for (const entry of entries) {
        if (entry.endsWith('.js') && entry.includes('chunk')) {
            const filePath = path.join(clientDir, entry);
            await this.optimizeJavaScript(filePath);
        }
    }
  }

  private async optimizeServerBundle(serverDir: string): Promise<void> {
    // Server bundle optimization should be more conservative
    const jsFiles = await this.findFiles(serverDir, '.js');
    
    for (const file of jsFiles) {
        const code = await fs.readFile(file, 'utf-8');
        const result = await terser.minify(code, {
            compress: {
                dead_code: true,
                drop_debugger: true,
                passes: 1
            },
            mangle: {
                keep_classnames: true,
                keep_fnames: true
            }
        });
        
        if (result.code) {
            await fs.writeFile(file, result.code);
        }
    }
  }

  private async generateAssetManifest(buildDir: string): Promise<void> {
    const assets: AssetManifest = {
        entry: {},
        routes: {},
        css: [],
        js: []
    };

    // Find all assets
    const files = await this.findFiles(buildDir, ['.js', '.css']);
    
    for (const file of files) {
        const relativePath = path.relative(buildDir, file);
        if (file.endsWith('.css')) {
            assets.css.push(relativePath);
        } else if (file.endsWith('.js')) {
            if (file.includes('entry')) {
                assets.entry[path.basename(file)] = relativePath;
            } else if (file.includes('routes')) {
                const routeName = path.basename(file, '.js');
                assets.routes[routeName] = relativePath;
            } else {
                assets.js.push(relativePath);
            }
        }
    }

    await fs.writeJson(
        path.join(buildDir, 'asset-manifest.json'),
        assets,
        { spaces: 2 }
    );
  }

  private async buildAstro(buildPath: string): Promise<BuildResult> {
    logger.info('Starting Astro build process');
    
    try {
      // Install Astro dependencies
      await execAsync('npm install astro', { cwd: buildPath });

      // Configure Astro for production
      await this.configureAstroForProduction(buildPath);

      // Run build
      const { stdout, stderr } = await execAsync('npx astro build', { 
        cwd: buildPath,
        env: { ...process.env, NODE_ENV: 'production' }
      });

      // Verify build output
      const buildOutputPath = path.join(buildPath, 'dist');
      if (!await fs.pathExists(buildOutputPath)) {
        throw new Error('Astro build failed to generate output directory');
      }

      // Optimize build output
      await this.optimizeAstroOutput(buildPath);

      const buildTime = Date.now();
      const cacheKey = await this.generateCacheKey(buildPath);
      const duration = Date.now() - buildTime;
      const buildId = crypto.randomUUID();

      return {
        outputPath: buildOutputPath,
        env: { NODE_ENV: 'production' },
        buildTime,
        buildId,
        duration,
        cached: false,
        logs: [stdout, stderr],
        assets: await this.collectAssets(buildOutputPath),
        cacheKey
      };
    } catch (error) {
      logger.error('Astro build failed:', error);
      throw new Error(`Astro build failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async optimizeAstroOutput(buildPath: string): Promise<void> {
    const astroBuildDir = path.join(buildPath, 'dist');
    
    // Optimize static assets
    await this.optimizeStaticAssets(path.join(astroBuildDir, '_astro'));
    
    // Optimize client scripts
    await this.optimizeClientScripts(astroBuildDir);
    
    // Generate service worker
    await this.generateServiceWorker(astroBuildDir);
  }
 

  private async optimizeJavaScript(buildDir: string): Promise<void> {
    const jsFiles = await this.findFiles(buildDir, '.js');
    
    for (const file of jsFiles) {
      const code = await fs.readFile(file, 'utf-8');
      const result = await terser.minify(code, {
        compress: {
          dead_code: true,
          drop_console: process.env.NODE_ENV === 'production',
          drop_debugger: true,
          passes: 2
        },
        mangle: true,
        format: {
          comments: false
        }
      });

      if (result.code) {
        await fs.writeFile(file, result.code);
      }
    }
  }

  private async optimizeCSS(buildDir: string): Promise<void> {
    const cssFiles = await this.findFiles(buildDir, '.css');
    const postcssProcessor = postcss([cssnano({ preset: 'advanced' })]);
    
    for (const file of cssFiles) {
      const css = await fs.readFile(file, 'utf-8');
      const result = await postcssProcessor.process(css, { from: file });
      await fs.writeFile(file, result.css);
    }
  }

  private async optimizeImages(buildDir: string): Promise<void> {
    const imageFiles = await this.findFiles(buildDir, ['.jpg', '.jpeg', '.png', '.webp']);
    
    for (const file of imageFiles) {
      const image = sharp(file);
      
      if (file.endsWith('.jpg') || file.endsWith('.jpeg')) {
        await image
          .jpeg({ quality: 80, progressive: true })
          .toFile(file + '.optimized');
      } else if (file.endsWith('.png')) {
        await image
          .png({ quality: 80, progressive: true })
          .toFile(file + '.optimized');
      } else if (file.endsWith('.webp')) {
        await image
          .webp({ quality: 80 })
          .toFile(file + '.optimized');
      }

      await fs.move(file + '.optimized', file, { overwrite: true });
    }
  }

  private async findFiles(dir: string, extensions: string | string[]): Promise<string[]> {
    const ext = Array.isArray(extensions) ? extensions : [extensions];
    const files: string[] = [];
    
    const items = await fs.readdir(dir, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      
      if (item.isDirectory()) {
        files.push(...await this.findFiles(fullPath, ext));
      } else if (ext.some(e => item.name.endsWith(e))) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  private async optimizeOutput(buildPath: string, framework: Framework): Promise<void> {
    // First, run general optimizations
    await this.optimizeStaticFiles(buildPath);
    
    // Then, run framework-specific optimizations
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

    // Finally, generate compressed versions
    await this.generateCompressedFiles(buildPath);
  }

  private async optimizeNextJSOutput(buildPath: string): Promise<void> {
    const nextBuildDir = path.join(buildPath, '.next');
    
    try {
        // Optimize static files
        await this.optimizeStaticFiles(path.join(nextBuildDir, 'static'));
        
        // Optimize server files (more conservatively)
        await this.optimizeServerFiles(path.join(nextBuildDir, 'server'));
        
        // Generate preload hints
        await this.generatePreloadHints(nextBuildDir);
        
        // Optimize chunks
        await this.optimizeChunks(nextBuildDir);
        
        // Generate service worker for offline support
        if (this.buildOptions.compress) {
            await this.generateServiceWorker(nextBuildDir);
        }
        
        logger.info('Next.js build output optimized successfully');
    } catch (error) {
        logger.error('Failed to optimize Next.js output:', error);
        throw error;
    }
  }

  //private async optimizeRemixOutput(buildPath: string) {
    // Implement Remix specific optimizations
  //}

  ///private async optimizeAstroOutput(buildPath: string) {
    // Implement Astro specific optimizations
  //}

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

  private async checkCache(cacheKey: string): Promise<CachedBuildResult | null> {
    const cachePath = path.join(this.cacheDir, cacheKey);
    if (await fs.pathExists(cachePath)) {
        const deployment = await prisma.deployment.findFirst({
            //where: { cacheKey },
            orderBy: { createdAt: 'desc' }
        });

        if (!deployment) {
            return null;
        }

        return {
            buildId: deployment.id,
            buildTime: 0,
            duration: 0,
            logs: deployment.buildLogs as string[],
            assets: {
                static: await this.getStaticAssets(cachePath),
                server: await this.getServerAssets(cachePath)
            },
            env: {},
            cacheKey,
            cached: true,
            outputPath: cachePath
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

  private async validateProjectStructure(buildPath: string, framework: Framework): Promise<void> {
    const requiredFiles: Record<Framework, string[]> = {
      NEXTJS: ['package.json', 'next.config.js', 'tsconfig.json'],
      REMIX: ['package.json', 'remix.config.js', 'tsconfig.json'],
      ASTRO: ['package.json', 'astro.config.mjs', 'tsconfig.json'],
      [Framework.STATIC]: []
    };

    const missingFiles = requiredFiles[framework].filter(
        file => !fs.existsSync(path.join(buildPath, file))
    );

    if (missingFiles.length > 0) {
        throw new Error(`Missing required files for ${framework}: ${missingFiles.join(', ')}`);
    }

    // Validate package.json
    const packageJson = await fs.readJson(path.join(buildPath, 'package.json'));
    if (!packageJson.dependencies && !packageJson.devDependencies) {
        throw new Error('Invalid package.json: No dependencies found');
    }
  }

  private async configureRemixForProduction(buildPath: string): Promise<void> {
    const remixConfig = {
        serverBuildTarget: "vercel",
        server: "server.js",
        ignoredRouteFiles: [".*"],
        appDirectory: "app",
        assetsBuildDirectory: "public/build",
        serverBuildPath: "build/index.js",
        publicPath: "/build/",
        devServerPort: 8002,
        serverDependenciesToBundle: "all"
    };

    await fs.writeFile(
        path.join(buildPath, 'remix.config.js'),
        `module.exports = ${JSON.stringify(remixConfig, null, 2)}`
    );
  }

  private async configureAstroForProduction(buildPath: string): Promise<void> {
    const astroConfig = {
        output: 'static',
        build: {
            inlineStylesheets: 'auto',
            split: true,
            sourcemap: false,
            minify: true,
            format: 'file'
        },
        vite: {
            build: {
                cssMinify: true,
                rollupOptions: {
                    output: {
                        manualChunks: {
                            vendor: ['react', 'react-dom']
                        }
                    }
                }
            }
        }
    };

    await fs.writeFile(
        path.join(buildPath, 'astro.config.mjs'),
        `export default ${JSON.stringify(astroConfig, null, 2)}`
    );
  }

  private async optimizeStaticFiles(dir: string): Promise<void> {
    // Optimize JS files
    await this.optimizeJavaScript(dir);
    
    // Optimize CSS files
    await this.optimizeCSS(dir);
    
    // Optimize images
    await this.optimizeImages(dir);
    
    // Generate compressed versions
    await this.generateCompressedFiles(dir);
  }

  private async optimizeServerFiles(dir: string): Promise<void> {
    const jsFiles = await this.findFiles(dir, '.js');
    
    for (const file of jsFiles) {
        const code = await fs.readFile(file, 'utf-8');
        const result = await terser.minify(code, {
            compress: {
                dead_code: true,
                drop_console: true,
                drop_debugger: true,
                passes: 2
            },
            mangle: true
        });
        
        if (result.code) {
            await fs.writeFile(file, result.code);
        }
    }
  }

  private async generatePreloadHints(buildDir: string): Promise<void> {
    const manifest = await fs.readJson(path.join(buildDir, 'build-manifest.json'));
    const preloadHints: string[] = [];
    // Generate preload hints for critical resources
    Object.values(manifest.pages).forEach((value: unknown) => {
        const assets = value as string[];
        assets.forEach(asset => {
            if (asset.endsWith('.js')) {
                preloadHints.push(`<link rel="preload" href="${asset}" as="script">`);
            } else if (asset.endsWith('.css')) {
                preloadHints.push(`<link rel="preload" href="${asset}" as="style">`);
            }
        });
    });
    
    await fs.writeFile(
        path.join(buildDir, 'preload-hints.json'),
        JSON.stringify(preloadHints, null, 2)
    );
  }

  private async collectNextJSBuildStats(buildPath: string): Promise<Record<string, any>> {
    const buildStats = await fs.readJson(path.join(buildPath, '.next', 'build-manifest.json'));
    const bundleAnalysis = await this.analyzeBundleSize(buildPath);
    
    return {
        pageCount: Object.keys(buildStats.pages).length,
        totalPages: buildStats.pages.length,
        staticPages: buildStats.staticPages?.length || 0,
        dynamicPages: buildStats.dynamicPages?.length || 0,
        totalBundleSize: bundleAnalysis.total,
        pageWiseBundleSize: bundleAnalysis.pages,
        optimization: {
            imageCount: bundleAnalysis.images,
            compressedFiles: bundleAnalysis.compressed,
            cacheableResources: bundleAnalysis.cacheable
        }
    };
  }

  private async collectRemixBuildStats(buildPath: string): Promise<Record<string, any>> {
    const buildStats = await fs.readJson(path.join(buildPath, 'build', 'asset-manifest.json'));
    const bundleAnalysis = await this.analyzeBundleSize(buildPath);
    
    return {
        routeCount: Object.keys(buildStats.routes).length,
        totalAssets: buildStats.assets.length,
        bundleSize: bundleAnalysis.total,
        chunkCount: buildStats.chunks?.length || 0,
        optimization: {
            compressedSize: bundleAnalysis.compressedSize,
            originalSize: bundleAnalysis.originalSize,
            compressionRatio: bundleAnalysis.compressionRatio
        }
    };
  }

  private async collectAstroBuildStats(buildPath: string): Promise<Record<string, any>> {
    const manifest = await fs.readJson(path.join(buildPath, 'dist', '_astro', 'manifest.json'));
    const bundleAnalysis = await this.analyzeBundleSize(buildPath);
    
    return {
        pageCount: Object.keys(manifest.routes).length,
        componentCount: manifest.components?.length || 0,
        totalAssets: manifest.assets.length,
        bundleSize: bundleAnalysis.total,
        optimization: {
            hydrationSize: bundleAnalysis.hydrationSize,
            staticSize: bundleAnalysis.staticSize,
            imageOptimization: bundleAnalysis.imageStats
        }
    };
  }

  private async cleanup(buildPath: string): Promise<void> {
    try {
        // Remove temporary files
        const tempFiles = [
            '.next/cache',
            'node_modules/.cache',
            '.astro/cache',
            'build/cache'
        ];
        
        for (const file of tempFiles) {
            const fullPath = path.join(buildPath, file);
            if (await fs.pathExists(fullPath)) {
                await fs.remove(fullPath);
            }
        }
        
        // Clean up node_modules if not needed
        if (!process.env.KEEP_NODE_MODULES) {
            await fs.remove(path.join(buildPath, 'node_modules'));
        }
        
    } catch (error) {
        logger.error('Cleanup failed:', error);
        // Don't throw error as this is cleanup
    }
  }

  private async calculateBuildSize(buildPath: string): Promise<number> {
    const { stdout } = await execAsync(`du -sb ${buildPath}`);
    return parseInt(stdout.split('\t')[0]);
  }

  private async getOptimizationStats(buildPath: string): Promise<Record<string, any>> {
    const stats = {
        originalSize: 0,
        optimizedSize: 0,
        compressionRatio: 0,
        imageStats: {
            count: 0,
            totalSaved: 0
        },
        jsStats: {
            count: 0,
            totalSaved: 0
        },
        cssStats: {
            count: 0,
            totalSaved: 0
        }
    };

    // Calculate stats for each type
    stats.originalSize = await this.calculateBuildSize(buildPath);
    stats.optimizedSize = await this.calculateBuildSize(path.join(buildPath, '.optimized'));
    stats.compressionRatio = (stats.originalSize - stats.optimizedSize) / stats.originalSize;

    return stats;
  }

  private async generateCompressedFiles(dir: string): Promise<void> {
    const files = await this.findFiles(dir, ['.js', '.css', '.html', '.json', '.xml', '.svg']);
    
    for (const file of files) {
        try {
            // Gzip compression
            await execAsync(`gzip -9 -k ${file}`);
            
            // Brotli compression
            await execAsync(`brotli -9 -k ${file}`);
        } catch (error) {
            logger.warn(`Failed to compress ${file}:`, error);
        }
    }
  }

  private async analyzeBundleSize(buildPath: string): Promise<BundleAnalysis> {
    const analysis: BundleAnalysis = {
        total: 0,
        pages: {},
        images: 0,
        compressed: 0,
        cacheable: 0,
        compressedSize: 0,
        originalSize: 0,
        compressionRatio: 0
    };

    try {
        analysis.total = await this.calculateBuildSize(buildPath);
        
        // Analyze pages
        const pages = await this.findFiles(buildPath, ['.js', '.html']);
        for (const page of pages) {
            analysis.pages[page] = (await fs.stat(page)).size;
        }

        // Count images
        const images = await this.findFiles(buildPath, ['.jpg', '.png', '.webp', '.gif']);
        analysis.images = images.length;

        // Count compressed files
        const compressed = await this.findFiles(buildPath, ['.gz', '.br']);
        analysis.compressed = compressed.length;

        // Calculate compression ratio
        analysis.originalSize = analysis.total;
        analysis.compressedSize = await this.calculateBuildSize(path.join(buildPath, '.optimized'));
        analysis.compressionRatio = (analysis.originalSize - analysis.compressedSize) / analysis.originalSize;

        return analysis;
    } catch (error) {
        logger.error('Bundle analysis failed:', error);
        throw error;
    }
  }

  private async optimizeChunks(buildDir: string): Promise<void> {
    const manifest = await fs.readJson(path.join(buildDir, 'build-manifest.json'));
    
    // Group chunks by type
    const chunks = {
        shared: new Set<string>(),
        pages: new Map<string, Set<string>>()
    };
    // Analyze chunk usage
    Object.entries(manifest.pages).forEach(([page, assets]) => {
        if (!Array.isArray(assets)) return;
        assets.forEach(asset => {
            if (typeof asset === 'string' && asset.includes('chunks')) {
                if (Object.keys(manifest.pages).every(p => Array.isArray(manifest.pages[p]) && manifest.pages[p].includes(asset))) {
                    chunks.shared.add(asset);
                } else {
                    if (!chunks.pages.has(page)) {
                        chunks.pages.set(page, new Set());
                    }
                    chunks.pages.get(page)?.add(asset);
                }
            }
        });
    });

    // Update build manifest with optimized chunks
    await fs.writeJson(
        path.join(buildDir, 'build-manifest.json'),
        {
            ...manifest,
            optimizedChunks: {
                shared: Array.from(chunks.shared),
                pages: Object.fromEntries(chunks.pages)
            }
        },
        { spaces: 2 }
    );
  }

  private async optimizeStaticAssets(dir: string): Promise<void> {
    // Optimize images
    await this.optimizeImages(dir);
    
    // Optimize SVGs
    const svgFiles = await this.findFiles(dir, '.svg');
    for (const file of svgFiles) {
        const content = await fs.readFile(file, 'utf-8');
        const result = optimize(content);
        if ('data' in result) {
            await fs.writeFile(file, result.data);
        }
    }
    
    // Optimize fonts
    const fontFiles = await this.findFiles(dir, ['.woff', '.woff2', '.ttf']);
    for (const file of fontFiles) {
        // Copy to optimized directory
        await fs.copy(file, file.replace(dir, dir + '/.optimized'));
    }
  }

  private async optimizeClientScripts(buildDir: string): Promise<void> {
    // Optimize JavaScript
    await this.optimizeJavaScript(buildDir);
    
    // Optimize CSS
    await this.optimizeCSS(buildDir);
    
    // Generate source maps if enabled
    if (this.buildOptions.sourceMaps) {
        await this.generateSourceMaps(buildDir);
    }
  }

  private async generateSourceMaps(buildDir: string): Promise<void> {
    const jsFiles = await this.findFiles(buildDir, '.js');
    
    for (const file of jsFiles) {
        if (!file.endsWith('.min.js')) {
            const result = await terser.minify(await fs.readFile(file, 'utf-8'), {
                sourceMap: {
                    filename: path.basename(file),
                    url: path.basename(file) + '.map'
                }
            });
            
            if (result.code && result.map) {
                await fs.writeFile(file, result.code);
                await fs.writeFile(file + '.map', JSON.stringify(result.map));
            }
        }
    }
  }

  private async generateServiceWorker(buildDir: string): Promise<void> {
    const swContent = `
        const CACHE_NAME = 'app-cache-v1';
        const urlsToCache = [
            '/',
            '/index.html',
            '/styles.css',
            '/main.js'
        ];

        self.addEventListener('install', event => {
            event.waitUntil(
                caches.open(CACHE_NAME)
                    .then(cache => cache.addAll(urlsToCache))
            );
        });

        self.addEventListener('fetch', event => {
            event.respondWith(
                caches.match(event.request)
                    .then(response => response || fetch(event.request))
            );
        });
    `;

    await fs.writeFile(path.join(buildDir, 'service-worker.js'), swContent);
    
    // Register service worker in index.html
    const indexPath = path.join(buildDir, 'index.html');
    if (await fs.pathExists(indexPath)) {
        let indexContent = await fs.readFile(indexPath, 'utf-8');
        if (!indexContent.includes('serviceWorker')) {
            indexContent = indexContent.replace(
                '</body>',
                `<script>
                    if ('serviceWorker' in navigator) {
                        navigator.serviceWorker.register('/service-worker.js');
                    }
                </script>
                </body>`
            );
            await fs.writeFile(indexPath, indexContent);
        }
    }
  }

  private async getStaticAssets(buildPath: string): Promise<string[]> {
    const staticPaths = [
        path.join(buildPath, 'public'),
        path.join(buildPath, '.next/static'),
        path.join(buildPath, 'build/client')
    ];

    const assets: string[] = [];
    for (const staticPath of staticPaths) {
        if (await fs.pathExists(staticPath)) {
            const files = await this.findFiles(staticPath, ['.js', '.css', '.jpg', '.png', '.svg']);
            assets.push(...files.map(file => path.relative(buildPath, file)));
        }
    }
    return assets;
  }

  private async getServerAssets(buildPath: string): Promise<string[]> {
    const serverPaths = [
        path.join(buildPath, '.next/server'),
        path.join(buildPath, 'build/server'),
        path.join(buildPath, 'dist/server')
    ];

    const assets: string[] = [];
    for (const serverPath of serverPaths) {
        if (await fs.pathExists(serverPath)) {
            const files = await this.findFiles(serverPath, ['.js']);
            assets.push(...files.map(file => path.relative(buildPath, file)));
        }
    }
    return assets;
  }
} 