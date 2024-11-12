/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Project {
  id: string;
  name: string;
  userId: string;
  domain: string;
  customDomain?: string;
  deployments: Deployment[];
  createdAt: Date;
  updatedAt: Date;
  status: 'BUILDING' | 'DEPLOYED' | 'FAILED';
}

export interface Deployment {
  id: string;
  projectId: string;
  userId: string;
  buildCommand: string;
  nodeVersion: string;
  version: string;
  commitHash: string | null;
  branch: string;
  environmentId: string;
  buildLogs: any;
  status: DeploymentStatus;
  framework: Framework;
  containerId?: string;
  containerPort?: number;
  healthCheckResults: any | null;
  lastHealthCheck: Date | null;
  memory: number;
  cpu: number;
  createdAt: Date;
  updatedAt: Date;
  url: string | null;
  env: Record<string, string>;
  buildPath: string;
}

// Define Framework as an enum
export enum Framework {
  NEXTJS = 'NEXTJS',
  REMIX = 'REMIX',
  ASTRO = 'ASTRO',
  STATIC = 'STATIC'
}

// You can also use it as a type
export type FrameworkType = keyof typeof Framework;

export interface BuildConfig {
  projectId: string;
  userId: string;     
  framework: Framework;
  buildCommand: string;
  nodeVersion: string;
  env?: Record<string, string>;
  optimization?: {
    minify?: boolean;
    compress?: boolean;
    sourceMaps?: boolean;
  };
}

export interface ProjectConfig {
  projectId: string;
  userId: string;   
  version: string;
  environment: string;
  framework: Framework;
  buildCommand: string;   
  nodeVersion: string;   
}

export type DeploymentStatus = 
  | 'QUEUED'
  | 'BUILDING'
  | 'DEPLOYING'
  | 'DEPLOYED'
  | 'FAILED'
  | 'CANCELLED';

// Base interface for build results
export interface BaseBuildResult {
    buildId: string;
    buildTime: number;
    duration: number;
    logs: string[];
    assets: {
        static: string[];
        server: string[];
    };
    env: Record<string, string>;
    cacheKey: string;
}

// Interface for cached build results
export interface CachedBuildResult extends BaseBuildResult {
    cached: true;
    outputPath: string;
}

// Interface for fresh build results
export interface FreshBuildResult extends BaseBuildResult {
    cached: false;
    outputPath: string;
    optimizationStats?: Record<string, any>;
}

// Union type for all possible build results
export type BuildResult = CachedBuildResult | FreshBuildResult;

export interface OptimizationConfig {
  minify: boolean;
  compress: boolean;
  sourceMaps: boolean;
  imageOptimization: boolean;
  bundleAnalysis: boolean;
}

export interface BundleAnalysis {
  total: number;
  pages: Record<string, number>;
  images: number;
  compressed: number;
  cacheable: number;
  compressedSize: number;
  originalSize: number;
  compressionRatio: number;
  hydrationSize?: number;
  staticSize?: number;
  imageStats?: Record<string, any>;
}

export interface DomainConfig {
  projectId: string;
  domain: string;
  type: 'CUSTOM' | 'SUBDOMAIN';
  ssl: boolean;
  proxied: boolean;
}

// Define the health check related types
export interface HealthCheckResult {
  success: boolean;
  responseTime: number;
  statusCode: number;
  error?: string;
}

export interface HealthCheckMetrics {
  cpu: number;
  memory: number;
  networkIn?: number;
  networkOut?: number;
}

export interface HealthCheckResults {
  success: boolean;
  timestamp: Date;
  results: HealthCheckResult[];
  dockerHealth: boolean;
  metricsHealth: boolean;
  metrics?: HealthCheckMetrics;
}

// Cache-related types
export interface BrowserCacheConfig {
  static: string;
  dynamic: string;
}

export interface EdgeCacheConfig {
  ttl: number;
  staleWhileRevalidate: number;
}

export interface ServerCacheConfig {
  memory: boolean;
  redis: boolean;
}

export interface CacheConfig {
  browser: BrowserCacheConfig;
  edge: EdgeCacheConfig;
  server: ServerCacheConfig;
}

// Framework-specific cache configurations
export type FrameworkCacheConfig = Record<Framework, CacheConfig>;

export const DEFAULT_FRAMEWORK_CACHE_CONFIGS: FrameworkCacheConfig = {
  [Framework.NEXTJS]: {
    browser: {
      static: '1y',
      dynamic: '1h'
    },
    edge: {
      ttl: 3600,
      staleWhileRevalidate: 86400
    },
    server: {
      memory: true,
      redis: true
    }
  },
  [Framework.REMIX]: {
    browser: {
      static: '1y',
      dynamic: '5m'
    },
    edge: {
      ttl: 300,
      staleWhileRevalidate: 3600
    },
    server: {
      memory: true,
      redis: true
    }
  },
  [Framework.ASTRO]: {
    browser: {
      static: '1y',
      dynamic: '1d'
    },
    edge: {
      ttl: 86400,
      staleWhileRevalidate: 172800
    },
    server: {
      memory: true,
      redis: true
    }
  },
  [Framework.STATIC]: {
    browser: {
      static: '1y',
      dynamic: '1d'
    },
    edge: {
      ttl: 86400,
      staleWhileRevalidate: 172800
    },
    server: {
      memory: true,
      redis: false
    }
  }
};

// Cache-related interfaces
export interface CacheItem {
  data: any;
  timestamp: number;
  tags: string[];
}

export interface CacheOptions {
  level: 'edge' | 'server' | 'browser';
  tags?: string[];
  ttl?: number;
}

// Update the CacheService to use these types
export interface CacheRule {
  pattern: string;
  ttl: number;
}

export interface CacheHeaders {
  [pattern: string]: {
    'Cache-Control': string;
    [key: string]: string;
  };
}