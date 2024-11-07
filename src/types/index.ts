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

export type Framework = 'NEXTJS' | 'REMIX' | 'ASTRO';

export interface BuildConfig {
  projectId: string;
  userId: string;     
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

export interface BuildResult {
  buildId: string;
  success: boolean;
  duration: number;
  logs: string[];
  buildTime: number;
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