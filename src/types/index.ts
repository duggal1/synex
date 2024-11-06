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