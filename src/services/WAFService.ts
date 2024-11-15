/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import Docker from 'dockerode';
import { CloudflareService } from './CloudflareService';

interface WAFRuleConfig {
  projectId: string;
  rules: string[];
  rateLimit: {
    requests: number;
    period: string;
    burst: number;
  };
}

export class WAFService {
  private docker: Docker;
  private cloudflare: CloudflareService;

  constructor() {
    this.docker = new Docker();
    this.cloudflare = new CloudflareService();
  }

  async setupRules(config: WAFRuleConfig): Promise<void> {
    try {
      // Deploy ModSecurity container
      const container = await this.deployWAFContainer(config.projectId);

      // Configure WAF rules
      await this.configureWAFRules(container.id, config.rules);

      // Setup rate limiting
      await this.setupRateLimiting(config.projectId, config.rateLimit);

      // Store WAF config in database
      await prisma.wafConfig.upsert({
        where: { projectId: config.projectId },
        create: {
          projectId: config.projectId,
          rules: config.rules,
          rateLimit: config.rateLimit as any,
          enabled: true
        },
        update: {
          rules: config.rules,
          rateLimit: config.rateLimit as any,
          enabled: true
        }
      });

      logger.info(`WAF rules configured for project ${config.projectId}`);
    } catch (error) {
      logger.error('Failed to setup WAF rules:', error);
      throw new Error('Failed to configure WAF rules');
    }
  }

  private async deployWAFContainer(projectId: string) {
    return await this.docker.createContainer({
      Image: 'owasp/modsecurity-crs:latest',
      name: `waf-${projectId}`,
      Env: [
        'PARANOIA=4',
        'ANOMALY_INBOUND=10',
        'ANOMALY_OUTBOUND=5'
      ],
      HostConfig: {
        NetworkMode: 'security-network',
        RestartPolicy: {
          Name: 'always'
        }
      }
    });
  }

  private async configureWAFRules(containerId: string, rules: string[]): Promise<void> {
    const container = this.docker.getContainer(containerId);
    
    // Apply each security rule
    for (const rule of rules) {
      await container.exec({
        Cmd: ['sh', '-c', `echo "SecRule ${rule}" >> /etc/modsecurity/rules.conf`]
      });
    }
  }

  private async setupRateLimiting(projectId: string, rateLimit: WAFRuleConfig['rateLimit']): Promise<void> {
    await this.cloudflare.setupRateLimiting({
      zoneId: process.env.CLOUDFLARE_ZONE_ID!,
      config: {
        threshold: rateLimit.requests,
        period: rateLimit.period,
        action: 'challenge'
      }
    });
  }
}
