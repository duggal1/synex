import { NextRequest, NextResponse } from 'next/server';
import { SecurityService } from '@/services/SecurityService';
import { RBACService } from '@/services/RBACService';
import { WAFService } from '@/services/WAFService';

export async function POST(req: NextRequest) {
  const securityService = new SecurityService();
  const rbacService = new RBACService();
  const wafService = new WAFService();

  try {
    const { projectId, securityConfig } = await req.json();

    // Setup WAF rules
    await wafService.setupRules({
      projectId,
      rules: [
        'rate-limiting',
        'sql-injection',
        'xss',
        'file-upload'
      ],
      rateLimit: {
        requests: 1000,
        period: '1m',
        burst: 50
      }
    });

    // Configure RBAC
    await rbacService.setupRoles({
      projectId,
      roles: [
        {
          name: 'admin',
          permissions: ['*']
        },
        {
          name: 'developer',
          permissions: ['deploy', 'logs:read', 'metrics:read']
        },
        {
          name: 'viewer',
          permissions: ['logs:read', 'metrics:read']
        }
      ]
    });

    // Setup DDoS protection
    await securityService.setupDDoSProtection({
      projectId,
      threshold: 10000,
      mitigation: ['challenge', 'block']
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 