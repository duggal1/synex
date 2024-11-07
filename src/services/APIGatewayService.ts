/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from '@/lib/prisma';
import { createProxyMiddleware, RequestHandler } from 'http-proxy-middleware';
import { Redis } from 'ioredis';
import { Framework } from '@/types';
import { logger } from '@/lib/logger';
import WebSocket from 'ws';

interface RouteConfig {
  path: string;
  method: string[];
  cache?: {
    ttl: number;
    invalidateOn?: string[];
  };
}

export class APIGatewayService {
  private redis: Redis;
  private wsServer: WebSocket.Server;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL!);
    this.wsServer = new WebSocket.Server({ noServer: true });
  }

  async setupRoutes(projectId: string, framework: Framework): Promise<RequestHandler> {
    try {
      // Get project configuration
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { deployments: { where: { status: 'DEPLOYED' } } }
      });

      if (!project || !project.deployments.length) {
        throw new Error('No active deployment found');
      }

      // Get framework-specific routes
      const routes = await this.getFrameworkRoutes(project.id, framework);

      // Create middleware chain
      const middleware = this.createMiddlewareChain(project, routes);

      // Setup WebSocket handling if needed
      if (this.hasWebSocketRoutes(routes)) {
        await this.setupWebSocketHandling(project.id);
      }

      return middleware;

    } catch (error) {
      logger.error('Failed to setup routes:', error);
      throw error;
    }
  }

  private async getFrameworkRoutes(projectId: string, framework: Framework): Promise<RouteConfig[]> {
    // Framework-specific route configurations
    const routeConfigs = {
      NEXTJS: await this.getNextJSRoutes(projectId),
      REMIX: await this.getRemixRoutes(projectId),
      ASTRO: await this.getAstroRoutes(projectId)
    };

    return routeConfigs[framework];
  }

  private async getNextJSRoutes(projectId: string): Promise<RouteConfig[]> {
    // Analyze project structure for Next.js routes
    const routes = await this.analyzeNextJSProject(projectId);
    
    return [
      // API routes
      {
        path: '/api/*',
        method: ['GET', 'POST', 'PUT', 'DELETE'],
        cache: {
          ttl: 60,
          invalidateOn: ['POST', 'PUT', 'DELETE']
        }
      },
      // Dynamic routes
      ...routes.map((route: { path: any; isSsr: any; }) => ({
        path: route.path,
        method: ['GET'],
        cache: {
          ttl: route.isSsr ? 0 : 3600,
          invalidateOn: ['POST', 'PUT', 'DELETE']
        }
      })),
      // Static assets
      {
        path: '/_next/static/*',
        method: ['GET'],
        cache: {
          ttl: 31536000 // 1 year
        }
      }
    ];
  }

  private createMiddlewareChain(project: any, routes: RouteConfig[]): RequestHandler {
    return async (req, res, next) => {
      try {
        // 1. Caching
        const cachedResponse = await this.handleCache(req, routes);
        if (cachedResponse) {
          return res.send(cachedResponse);
        }

        // 2. Error boundaries
        this.setupErrorBoundaries(req, res);

        // 3. Proxy to container
        const proxy = this.createProxy(project);
        proxy(req, res, next);

      } catch (error) {
        logger.error('Middleware chain failed:', error);
        next(error);
      }
    };
  }

  private async handleCache(req: any, routes: RouteConfig[]): Promise<any> {
    const route = this.findMatchingRoute(req.path, routes);
    if (!route?.cache) return null;

    const cacheKey = this.generateCacheKey(req);
    const cached = await this.redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached);
    }

    return null;
  }

  private setupErrorBoundaries(req: any, res: any): void {
    const originalSend = res.send;
    res.send = function(data: any) {
      try {
        // Log errors
        if (res.statusCode >= 400) {
          logger.error('API Error:', {
            path: req.path,
            method: req.method,
            status: res.statusCode,
            error: data
          });
        }

        // Track metrics
        this.trackAPIMetrics(req, res);

        return originalSend.call(this, data);
      } catch (error) {
        logger.error('Error boundary caught:', error);
        return originalSend.call(this, {
          error: 'Internal Server Error'
        });
      }
    };
  }

  private createProxy(project: any): RequestHandler {
    return createProxyMiddleware({
      target: `http://container-${project.deployments[0].id}:3000`,
      ws: true,
      pathRewrite: {
        '^/api/': '/'
      },
      onProxyRes: this.handleProxyResponse.bind(this),
      onError: this.handleProxyError.bind(this)
    });
  }

  private async setupWebSocketHandling(projectId: string): Promise<void> {
    this.wsServer.on('connection', (ws, req) => {
      const clientId = req.headers['x-client-id'];
      
      // Store connection
      this.redis.hset(`ws:${projectId}`, clientId, Date.now());

      ws.on('message', async (message) => {
        try {
          await this.handleWebSocketMessage(projectId, clientId, message);
        } catch (error) {
          logger.error('WebSocket message handling failed:', error);
        }
      });

      ws.on('close', () => {
        this.redis.hdel(`ws:${projectId}`, clientId);
      });
    });
  }

  private async trackAPIMetrics(req: any, res: any): Promise<void> {
    const metrics = {
      path: req.path,
      method: req.method,
      status: res.statusCode,
      duration: Date.now() - req.startTime,
      size: res.get('Content-Length')
    };

    await prisma.analytics.create({
      data: {
        projectId: req.projectId,
        type: 'API',
        metrics
      }
    });
  }

  private generateCacheKey(req: any): string {
    return `api:${req.projectId}:${req.method}:${req.path}:${JSON.stringify(req.query)}`;
  }

  private findMatchingRoute(path: string, routes: RouteConfig[]): RouteConfig | null {
    return routes.find(route => {
      const pattern = new RegExp('^' + route.path.replace(/\*/g, '.*') + '$');
      return pattern.test(path);
    }) || null;
  }
} 