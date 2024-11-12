/* eslint-disable @typescript-eslint/no-this-alias */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from '@/lib/prisma';
import { createProxyMiddleware, RequestHandler } from 'http-proxy-middleware';
import { Redis } from 'ioredis';
import { Framework } from '@/types/index';
import { logger } from '@/lib/logger';
import WebSocket from 'ws';
import { IncomingMessage, ServerResponse } from 'http';
import path from 'path';
import fs from 'fs-extra';
import { Response, Request } from 'express';

interface RouteConfig {
  path: string;
  method: string[];
  websocket?: boolean;
  cache?: {
    ttl: number;
    invalidateOn?: string[];
  };
}

interface ProxyResponseHandler {
  (proxyRes: IncomingMessage, req: IncomingMessage, res: ServerResponse): void;
}

interface FileInfo {
  path: string;
  content: string;
}

interface ExtendedRequest extends Request {
  [x: string]: any;
  projectId: string;
  startTime: number;
}

interface ExtendedResponse extends Response {
  trackAPIMetrics?: (req: ExtendedRequest, res: Response) => Promise<void>;
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
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { deployments: { where: { status: 'DEPLOYED' } } }
      });

      if (!project || !project.deployments.length) {
        throw new Error('No active deployment found');
      }

      const routes = await this.getFrameworkRoutes(project.id, framework);
      const middleware = this.createMiddlewareChain(project, routes);

      if (this.hasWebSocketRoutes(routes)) {
        await this.setupWebSocketHandling(project.id);
      }

      return middleware;

    } catch (error) {
      logger.error('Failed to setup routes:', error);
      throw error;
    }
  }

  private hasWebSocketRoutes(routes: RouteConfig[]): boolean {
    return routes.some(route => route.websocket);
  }

  private async getFrameworkRoutes(projectId: string, framework: Framework): Promise<RouteConfig[]> {
    const routeConfigs: Record<Framework, Promise<RouteConfig[]>> = {
      NEXTJS: this.getNextJSRoutes(projectId),
      REMIX: this.getRemixRoutes(projectId),
      ASTRO: this.getAstroRoutes(projectId),
      [Framework.STATIC]: Promise.resolve([])
    };

    return routeConfigs[framework];
  }

  private async analyzeNextJSProject(projectId: string): Promise<Array<{ path: string; isSsr: boolean }>> {
    const projectPath = path.join(process.cwd(), 'projects', projectId);
    const pagesDir = path.join(projectPath, 'pages');
    const routes: Array<{ path: string; isSsr: boolean }> = [];

    try {
      if (!(await fs.pathExists(pagesDir))) {
        logger.warn(`Pages directory not found for project ${projectId}`);
        return routes;
      }

      const files = await this.getFilesRecursively(pagesDir);

      for (const file of files) {
        if (this.isValidNextJSFile(file.path)) {
          const isSsr = this.isServerSideRendered(file.content);
          const routePath = this.convertFilePathToRoute(file.path, 'nextjs');
          routes.push({ path: routePath, isSsr });
        }
      }

      return routes;
    } catch (error) {
      logger.error('Failed to analyze Next.js project:', error);
      return routes;
    }
  }

  private async getFilesRecursively(dir: string): Promise<FileInfo[]> {
    const files: FileInfo[] = [];
    
    try {
      const items = await fs.readdir(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = await fs.stat(fullPath);

        if (stat.isDirectory()) {
          const subFiles = await this.getFilesRecursively(fullPath);
          files.push(...subFiles);
        } else {
          const content = await fs.readFile(fullPath, 'utf-8');
          files.push({
            path: fullPath,
            content
          });
        }
      }
    } catch (error) {
      logger.error('Error reading directory:', error);
    }

    return files;
  }

  private isValidNextJSFile(filePath: string): boolean {
    const validExtensions = ['.tsx', '.jsx', '.js'];
    return validExtensions.some(ext => filePath.endsWith(ext));
  }

  private isServerSideRendered(content: string): boolean {
    const ssrPatterns = [
      'getServerSideProps',
      'getInitialProps',
      'unstable_getServerProps',
      'getStaticProps'
    ];
    return ssrPatterns.some(pattern => content.includes(pattern));
  }

  private convertFilePathToRoute(filePath: string, framework: 'nextjs' | 'remix' | 'astro'): string {
    let routePath = filePath;

    switch (framework) {
      case 'nextjs':
        routePath = routePath
          .replace(/\.(tsx|jsx|js)$/, '')
          .replace(/\/index$/, '')
          .replace(/\[([^\]]+)\]/g, ':$1');
        break;
      case 'remix':
        routePath = routePath
          .replace(/\.(tsx|jsx)$/, '')
          .replace(/\$/g, ':')
          .replace(/^_/, '');
        break;
      case 'astro':
        routePath = routePath
          .replace(/\.astro$/, '')
          .replace(/\[([^\]]+)\]/g, ':$1');
        break;
    }

    return '/' + routePath;
  }

  private async getNextJSRoutes(projectId: string): Promise<RouteConfig[]> {
    const routes = await this.analyzeNextJSProject(projectId);
    
    return [
      {
        path: '/api/*',
        method: ['GET', 'POST', 'PUT', 'DELETE'],
        cache: {
          ttl: 60,
          invalidateOn: ['POST', 'PUT', 'DELETE']
        }
      },
      ...routes.map(route => ({
        path: route.path,
        method: ['GET'],
        cache: {
          ttl: route.isSsr ? 0 : 3600,
          invalidateOn: ['POST', 'PUT', 'DELETE']
        }
      })),
      {
        path: '/_next/static/*',
        method: ['GET'],
        cache: {
          ttl: 31536000
        }
      }
    ];
  }

  private async getRemixRoutes(projectId: string): Promise<RouteConfig[]> {
    const projectPath = path.join(process.cwd(), 'projects', projectId);
    const routesDir = path.join(projectPath, 'app/routes');
    const routes: RouteConfig[] = [];

    try {
      if (!(await fs.pathExists(routesDir))) {
        logger.warn(`Routes directory not found for project ${projectId}`);
        return routes;
      }

      const files = await this.getFilesRecursively(routesDir);

      for (const file of files) {
        if (file.path.endsWith('.tsx') || file.path.endsWith('.jsx')) {
          const routePath = this.convertFilePathToRoute(file.path, 'remix');
          routes.push({
            path: routePath,
            method: ['GET', 'POST'],
            cache: {
              ttl: 0 // Remix handles caching internally
            }
          });
        }
      }

      return routes;
    } catch (error) {
      logger.error('Failed to analyze Remix project:', error);
      return routes;
    }
  }

  private async getAstroRoutes(projectId: string): Promise<RouteConfig[]> {
    const projectPath = path.join(process.cwd(), 'projects', projectId);
    const pagesDir = path.join(projectPath, 'src/pages');
    const routes: RouteConfig[] = [];

    try {
      if (!(await fs.pathExists(pagesDir))) {
        logger.warn(`Pages directory not found for project ${projectId}`);
        return routes;
      }

      const files = await this.getFilesRecursively(pagesDir);

      for (const file of files) {
        if (file.path.endsWith('.astro')) {
          const routePath = this.convertFilePathToRoute(file.path, 'astro');
          routes.push({
            path: routePath,
            method: ['GET'],
            cache: {
              ttl: 3600 // Default cache for static pages
            }
          });
        }
      }

      return routes;
    } catch (error) {
      logger.error('Failed to analyze Astro project:', error);
      return routes;
    }
  }

  private createMiddlewareChain(project: any, routes: RouteConfig[]): RequestHandler {
    const handler = (async (req: ExtendedRequest, res: ExtendedResponse, next) => {
      try {
        const cachedResponse = await this.handleCache(req, routes);
        if (cachedResponse) {
          return res.send(cachedResponse);
        }

        this.setupErrorBoundaries(req, res);

        const proxy = this.createProxy(project);
        return proxy(req, res, next);

      } catch (error) {
        logger.error('Middleware chain failed:', error);
        if (next) next(error);
      }
    }) as RequestHandler;

    // Add required upgrade property for WebSocket support
    handler.upgrade = (req, socket, head) => {
      this.wsServer.handleUpgrade(req, socket, head, (ws) => {
        this.wsServer.emit('connection', ws, req);
      });
    };

    return handler;
  }

  private handleProxyResponse: ProxyResponseHandler = (proxyRes, req, res) => {
    const statusCode = proxyRes.statusCode || 500;
    
    if (statusCode >= 400) {
      logger.error('Proxy error:', {
        path: req.url,
        statusCode,
        headers: proxyRes.headers
      });
    }

    // Cache successful responses if configured
    if (statusCode === 200) {
      this.cacheResponse(req, proxyRes);
    }
  }

  private handleProxyError(err: Error, req: IncomingMessage, res: ServerResponse): void {
    logger.error('Proxy error:', err);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Bad Gateway' }));
  }

  private async handleWebSocketMessage(
    projectId: string, 
    clientId: string, 
    message: WebSocket.Data
  ): Promise<void> {
    try {
      const messageStr = message.toString();
      const data = JSON.parse(messageStr);

      // Store message in Redis for processing
      await this.redis.rpush(
        `ws:messages:${projectId}`, 
        JSON.stringify({
          clientId,
          message: data,
          timestamp: Date.now()
        })
      ).catch(error => {
        logger.error('Failed to store WebSocket message:', error);
        throw error;
      });

      // Emit metrics
      await this.trackWSMetrics(projectId, clientId, messageStr.length);
    } catch (error) {
      logger.error('WebSocket message processing failed:', {
        projectId,
        clientId,
        error
      });
    }
  }

  private async trackWSMetrics(
    projectId: string, 
    clientId: string, 
    messageSize: number
  ): Promise<void> {
    try {
      // First get the project to access its userId
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { userId: true }
      });

      if (!project) {
        throw new Error('Project not found');
      }

      await prisma.analytics.create({
        data: {
          projectId,
          type: 'WEBSOCKET',
          userId: project.userId, // Use the project's userId
          metrics: {
            clientId,
            messageSize,
            timestamp: new Date()
          }
        }
      });
    } catch (error) {
      logger.error('Failed to track WebSocket metrics:', {
        projectId,
        error
      });
    }
  }

  private async cacheResponse(req: IncomingMessage, proxyRes: IncomingMessage): Promise<void> {
    const route = this.findMatchingRoute(req.url || '', []);
    if (!route?.cache) return;

    let body = '';
    proxyRes.on('data', chunk => body += chunk);
    proxyRes.on('end', async () => {
      const cacheKey = this.generateCacheKey(req);
      await this.redis.setex(cacheKey, route.cache!.ttl, body);
    });
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

  private setupErrorBoundaries(req: ExtendedRequest, res: ExtendedResponse): void {
    const originalSend = res.send;
    const self = this;

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
        void self.trackAPIMetrics(req, res);

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
     // onProxyRes: this.handleProxyResponse.bind(this), // Ensure this is supported
      //onError: this.handleProxyError.bind(this)
    });
  }

  private async setupWebSocketHandling(projectId: string): Promise<void> {
    this.wsServer.on('connection', (ws, req) => {
      const rawClientId = req.headers['x-client-id'];
      const clientId = this.normalizeClientId(rawClientId);
      
      if (!clientId) {
        logger.error('WebSocket connection attempt without valid client ID');
        ws.close(1008, 'Client ID required');
        return;
      }

      // Store connection with validated clientId
      this.redis.hset(`ws:${projectId}`, clientId, Date.now().toString())
        .catch(error => {
          logger.error('Failed to store WebSocket connection:', error);
        });

      ws.on('message', async (message) => {
        try {
          await this.handleWebSocketMessage(projectId, clientId, message);
        } catch (error) {
          logger.error('WebSocket message handling failed:', error);
        }
      });

      ws.on('close', () => {
        this.redis.hdel(`ws:${projectId}`, clientId)
          .catch(error => {
            logger.error('Failed to remove WebSocket connection:', error);
          });
      });
    });
  }

  private normalizeClientId(clientId: string | string[] | undefined): string | null {
    if (!clientId) {
      return null;
    }

    if (Array.isArray(clientId)) {
      return clientId[0] || null;
    }

    return clientId;
  }

  private async trackAPIMetrics(req: ExtendedRequest, res: Response): Promise<void> {
    try {
      // First get the project to access its userId
      const project = await prisma.project.findUnique({
        where: { id: req.projectId },
        select: { userId: true }
      });

      if (!project) {
        throw new Error('Project not found');
      }

      await prisma.analytics.create({
        data: {
          projectId: req.projectId,
          type: 'API',
          userId: project.userId, // Use the project's userId
          metrics: {
            path: req.path,
            method: req.method,
            status: res.statusCode,
            duration: Date.now() - req.startTime,
            size: res.get('Content-Length')
          }
        }
      });
    } catch (error) {
      logger.error('Failed to track API metrics:', {
        projectId: req.projectId,
        error
      });
    }
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
