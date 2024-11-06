/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { CloudflareClient } from '@/lib/cloudflare';
import { createHash } from 'crypto';
import { minify } from 'terser';

interface EdgeFunction {
  name: string;
  code: string;
  route: string;
  runtime: 'nodejs' | 'python' | 'rust';
  memory: number;
  timeout: number;
}

interface FunctionMetrics {
  invocations: number;
  errors: number;
  latency: number;
  cpu: number;
  memory: number;
}

type TimeframeType = '1h' | '24h' | '7d';

export class EdgeFunctionService {
  private cloudflare: CloudflareClient;
  private functionCache: Map<string, string>;

  constructor() {
    this.cloudflare = new CloudflareClient(process.env.CLOUDFLARE_API_TOKEN!);
    this.functionCache = new Map();
  }

  async deployEdgeFunction(
    projectId: string, 
    functionCode: string,
    options: Partial<EdgeFunction> = {}
  ): Promise<boolean> {
    try {
      // Validate function code
      await this.validateFunction(functionCode);

      // Generate function hash for versioning
      const functionHash = this.generateFunctionHash(functionCode);

      // Check if function already exists and is unchanged
      if (this.functionCache.get(projectId) === functionHash) {
        logger.info('Function unchanged, skipping deployment');
        return true;
      }

      // Optimize function code
      const optimizedCode = await this.optimizeFunction(functionCode);

      // Create function configuration
      const functionConfig = this.createFunctionConfig(optimizedCode, options);

      // Deploy to edge locations
      await this.deployToEdge(projectId, functionConfig);

      // Setup routing
      await this.setupFunctionRouting(projectId, functionConfig);

      // Update cache
      this.functionCache.set(projectId, functionHash);

      // Store function metadata
      await this.storeFunctionMetadata(projectId, functionConfig);

      return true;
    } catch (error) {
      logger.error('Edge function deployment failed:', error as Error);
      throw error;
    }
  }

  private async validateFunction(code: string): Promise<void> {
    try {
      // Parse and validate syntax
      new Function(code);

      // Check for forbidden APIs
      const forbiddenAPIs = ['fs', 'child_process', 'cluster'];
      for (const api of forbiddenAPIs) {
        if (code.includes(`require('${api}')`)) {
          throw new Error(`Usage of '${api}' is not allowed in edge functions`);
        }
      }

      // Check function size
      const size = Buffer.from(code).length;
      if (size > 1024 * 1024) { // 1MB limit
        throw new Error('Function size exceeds 1MB limit');
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Function validation failed: ${error.message}`);
      } else {
        throw new Error('Function validation failed: Unknown error occurred');
      }
    }
  }

  private async optimizeFunction(code: string): Promise<string> {
    try {
      const minified = await minify(code, {
        compress: {
          dead_code: true,
          unused: true,
          passes: 2
        },
        mangle: true
      });

      if (!minified.code) {
        throw new Error('Minification failed');
      }

      return `
        let warmupCache = new Map();
        ${minified.code}
        if (typeof exports.handler === 'function') {
          const originalHandler = exports.handler;
          exports.handler = async function(event, context) {
            if (warmupCache.has('context')) {
              context = warmupCache.get('context');
            } else {
              warmupCache.set('context', context);
            }
            return originalHandler(event, context);
          }
        }
      `;
    } catch (error) {
      logger.error('Function optimization failed:', error as Error);
      return code;
    }
  }

  private createFunctionConfig(
    code: string,
    options: Partial<EdgeFunction>
  ): EdgeFunction {
    return {
      name: options.name || 'edge-function',
      code,
      route: options.route || '/*',
      runtime: options.runtime || 'nodejs',
      memory: options.memory || 128,
      timeout: options.timeout || 5000,
    };
  }

  private async deployToEdge(
    projectId: string,
    config: EdgeFunction
  ): Promise<void> {
    try {
      const edgeLocations = await this.getEdgeLocations();
      await Promise.all(
        edgeLocations.map(location =>
          this.deployToLocation(projectId, config, location)
        )
      );
      await this.verifyEdgeDeployments(projectId, edgeLocations);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Edge deployment failed: ${error.message}`);
      }
      throw new Error('Edge deployment failed: Unknown error');
    }
  }

  private async setupFunctionRouting(
    projectId: string,
    config: EdgeFunction
  ): Promise<void> {
    try {
      await this.cloudflare.createPageRule(config.route, {
        'edge_function': {
          'name': config.name,
          'project_id': projectId
        }
      });
      await this.setupHealthChecks(projectId, config);
      await this.configureFunctionCaching(projectId, config);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Function routing setup failed: ${error.message}`);
      }
      throw new Error('Function routing setup failed: Unknown error');
    }
  }

  private async setupHealthChecks(
    projectId: string,
    config: EdgeFunction
  ): Promise<void> {
    const healthCheck = {
      name: `health-${config.name}`,
      type: 'http',
      path: '/_health',
      interval: 60,
      timeout: 5,
      retries: 3,
      method: 'GET',
      expected_codes: '200',
      follow_redirects: true
    };

    // Use public method instead of private makeRequest
    await this.cloudflare.createPageRule('/_health', healthCheck);
  }

  async getFunctionMetrics(
    projectId: string,
    timeframe: TimeframeType = '24h'
  ): Promise<FunctionMetrics> {
    try {
      const metrics = await prisma.edgeFunctionMetrics.groupBy({
        by: ['functionId'],
        where: {
          function: {
            projectId
          },
          timestamp: {
            gte: new Date(Date.now() - this.getTimeframeMs(timeframe))
          }
        },
        _sum: {
          invocations: true,
          errors: true
        },
        _avg: {
          latency: true,
          cpu: true,
          memory: true
        }
      });

      return {
        invocations: metrics[0]?._sum.invocations ?? 0,
        errors: metrics[0]?._sum.errors ?? 0,
        latency: metrics[0]?._avg.latency ?? 0,
        cpu: metrics[0]?._avg.cpu ?? 0,
        memory: metrics[0]?._avg.memory ?? 0
      };
    } catch (error) {
      logger.error('Failed to get function metrics:', error as Error);
      throw error;
    }
  }

  private getTimeframeMs(timeframe: TimeframeType): number {
    const ms: Record<TimeframeType, number> = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000
    };
    return ms[timeframe];
  }

  private generateFunctionHash(code: string): string {
    return createHash('sha256').update(code).digest('hex');
  }

  private async getEdgeLocations(): Promise<string[]> {
    // Return list of edge locations where functions can be deployed
    return [
      'sfo', 'nyc', 'ams', 'sin', 'fra',
      'lon', 'hkg', 'syd', 'nrt', 'gru'
    ];
  }

  private async deployToLocation(
    projectId: string,
    config: EdgeFunction,
    location: string
  ): Promise<void> {
    // Implementation for deploying to specific edge location
    // This would interact with the actual edge network
  }

  private async verifyEdgeDeployments(
    projectId: string,
    locations: string[]
  ): Promise<void> {
    // Verify successful deployment to all locations
    // Implement health checks and rollback if needed
  }

  private async configureFunctionCaching(
    projectId: string,
    config: EdgeFunction
  ): Promise<void> {
    // Setup caching rules for the function
    // This would depend on the function's configuration
  }

  private async storeFunctionMetadata(
    projectId: string,
    config: EdgeFunction
  ): Promise<void> {
    await prisma.edgeFunction.create({
      data: {
        projectId,
        name: config.name,
        route: config.route,
        runtime: config.runtime,
        memory: config.memory,
        timeout: config.timeout,
        version: this.generateFunctionHash(config.code),
        code: config.code
      }
    });
  }
} 