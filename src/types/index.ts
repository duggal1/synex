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
  status: 'BUILDING' | 'DEPLOYED' | 'FAILED';
  createdAt: Date;
}

export type Framework = 'NEXTJS' | 'REMIX' | 'ASTRO';

export interface BuildConfig {
  projectId: string;
  framework: Framework;
  buildCommand: string;
  nodeVersion: string;
  env?: Record<string, string>;
  buildOptions?: {
    cache?: boolean;
    minify?: boolean;
    sourceMaps?: boolean;
  };
}

export interface DeploymentConfig {
  id: string;
  projectId: string;
  buildId: string;
  status: DeploymentStatus;
  domain: string;
  framework: Framework;
  createdAt: Date;
  env: Record<string, string>;
}

export type DeploymentStatus = 
  | 'QUEUED'
  | 'BUILDING'
  | 'DEPLOYING'
  | 'DEPLOYED'
  | 'FAILED'
  | 'CANCELLED';

export interface BuildResult {
  buildId: string;
  success: boolean;
  duration: number;
  logs: string[];
  assets: {
    static: string[];
    server: string[];
  };
}

export interface DomainConfig {
  projectId: string;
  domain: string;
  type: 'CUSTOM' | 'SUBDOMAIN';
  ssl: boolean;
  proxied: boolean;
} 