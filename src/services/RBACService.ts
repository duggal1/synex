import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { Redis } from 'ioredis';

interface Role {
  name: string;
  permissions: string[];
}

interface RBACConfig {
  projectId: string;
  roles: Role[];
}

export class RBACService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL!);
  }

  async setupRoles(config: RBACConfig): Promise<void> {
    try {
      // Store roles in database using transaction
      await prisma.$transaction(async (tx) => {
        for (const role of config.roles) {
          await tx.role.upsert({
            where: {
              projectId_name: {
                projectId: config.projectId,
                name: role.name
              }
            },
            create: {
              projectId: config.projectId,
              name: role.name,
              permissions: role.permissions
            },
            update: {
              permissions: role.permissions
            }
          });
        }
      });

      // Cache roles in Redis for fast access
      await this.cacheRoles(config.projectId, config.roles);

      logger.info(`RBAC roles configured for project ${config.projectId}`, {
        projectId: config.projectId,
        roles: config.roles.map(r => r.name)
      });
    } catch (error) {
      logger.error('Failed to setup RBAC roles:', error);
      throw new Error('Failed to configure RBAC roles');
    }
  }

  async assignRole(userId: string, projectId: string, roleName: string): Promise<void> {
    try {
      const role = await prisma.role.findUnique({
        where: {
          projectId_name: {
            projectId,
            name: roleName
          }
        }
      });

      if (!role) {
        throw new Error(`Role ${roleName} not found for project ${projectId}`);
      }

      await prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId,
            roleId: role.id
          }
        },
        create: {
          userId,
          roleId: role.id
        },
        update: {}
      });

      // Invalidate user permissions cache
      await this.redis.del(`rbac:${projectId}:user:${userId}`);

      logger.info(`Role ${roleName} assigned to user ${userId} for project ${projectId}`);
    } catch (error) {
      logger.error('Failed to assign role:', error);
      throw new Error('Failed to assign role');
    }
  }

  async checkPermission(userId: string, projectId: string, permission: string): Promise<boolean> {
    try {
      // Check cache first
      const cachedPermissions = await this.redis.get(`rbac:${projectId}:user:${userId}`);
      if (cachedPermissions) {
        const permissions = JSON.parse(cachedPermissions);
        return permissions.includes(permission);
      }

      // If not in cache, check database
      const userRoles = await prisma.userRole.findMany({
        where: { userId },
        include: { role: true }
      });

      const permissions = userRoles.flatMap(ur => ur.role.permissions);
      
      // Cache permissions
      await this.redis.set(
        `rbac:${projectId}:user:${userId}`,
        JSON.stringify(permissions),
        'EX',
        3600 // 1 hour cache
      );

      return permissions.includes(permission);
    } catch (error) {
      logger.error('Failed to check permission:', error);
      return false;
    }
  }

  private async cacheRoles(projectId: string, roles: Role[]): Promise<void> {
    const pipeline = this.redis.pipeline();
    
    // Cache each role's permissions
    roles.forEach(role => {
      pipeline.set(
        `rbac:${projectId}:role:${role.name}`,
        JSON.stringify(role.permissions),
        'EX',
        3600 // 1 hour cache
      );
    });

    await pipeline.exec();
  }
}
