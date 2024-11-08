import { NextRequest, NextResponse } from 'next/server';
import { DomainService } from '@/services/DomainService';
import { NginxService } from '@/services/NginxService';

export async function POST(req: NextRequest) {
  const domainService = new DomainService();
  const nginxService = new NginxService();

  try {
    const { projectId, domain } = await req.json();

    // Validate and setup domain
    const domainConfig = await domainService.setupDomain(projectId, domain);

    // Configure Nginx for the domain
    await nginxService.configureDomain({
      domain,
      ssl: true,
      http2: true,
      compression: true
    });

    // Setup SSL
    await domainService.provisionSSL(domain);

    return NextResponse.json({ success: true, domain: domainConfig });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 