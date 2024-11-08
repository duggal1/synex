import { NextRequest, NextResponse } from 'next/server';
import { DockerService } from '@/services/DockerService';
import { SecurityService } from '@/services/SecurityService';

export async function POST(req: NextRequest) {
  const dockerService = new DockerService();
  const securityService = new SecurityService();

  try {
    const { projectId, securityConfig } = await req.json();

    // Create ModSecurity container
    const wafContainer = await dockerService.createContainer({
      image: 'modsecurity:latest',
      name: `waf-${projectId}`,
      config: {
        Memory: 1024 * 1024 * 1024,
        NanoCpus: 1000000000,
        NetworkMode: 'security-network',
        Env: [
          'MODSEC_AUDIT_LOG=1',
          'MODSEC_AUDIT_LOG_FORMAT=JSON',
          `MODSEC_RULE_ENGINE=${securityConfig.ruleEngine || 'DetectionOnly'}`
        ],
        HealthCheck: {
          Test: ["CMD", "nginx", "-t"],
          Interval: 30000000000,
          Timeout: 10000000000,
          Retries: 3
        }
      }
    });

    // Setup security rules and policies
    await securityService.setupSecurityPolicies({
      projectId,
      wafId: wafContainer.id,
      rules: [
        'sql-injection',
        'xss',
        'rce',
        'lfi',
        'csrf'
      ],
      rateLimit: {
        requests: 1000,
        period: '1m',
        burst: 50
      },
      ddosProtection: {
        enabled: true,
        threshold: 10000,
        action: 'block'
      }
    });

    return NextResponse.json({
      wafId: wafContainer.id,
      status: 'active',
      policies: securityConfig
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 