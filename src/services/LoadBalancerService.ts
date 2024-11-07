import { prisma } from '@/lib/prisma';
import { Redis } from 'ioredis';

export class LoadBalancerService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL!);
  }

  async getContainerForDomain(domain: string) {
    try {
      // Get project from domain
      const domainRecord = await prisma.domain.findUnique({
        where: { domain },
        include: {
          project: {
            include: {
              deployments: {
                where: { status: 'DEPLOYED' },
                orderBy: { createdAt: 'desc' },
                take: 1
              }
            }
          }
        }
      });

      if (!domainRecord?.project?.deployments?.[0]) {
        throw new Error('No active deployment found');
      }

      // Get container details from Redis
      const containerId = await this.redis.get(
        `container:${domainRecord.project.deployments[0].id}`
      );

      return containerId;
    } catch (error) {
      throw new Error('Failed to route request');
    }
  }
}