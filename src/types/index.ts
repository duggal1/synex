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
  version: string;
  buildLogs: string[];
  status: DeploymentStatus;
  createdAt: Date;
  environmentId: string;
}

// Define Framework as an enum
export enum Framework {
  NEXTJS = 'NEXTJS',
  REMIX = 'REMIX',
  ASTRO = 'ASTRO',
  STATIC = 'STATIC',
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  DEFAULT = 'NEXTJS' // Default value
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