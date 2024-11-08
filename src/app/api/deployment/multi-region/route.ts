import { NextRequest, NextResponse } from 'next/server';
import { DockerService } from '@/services/DockerService';
import { MultiRegionService } from '@/services/MultiRegionService';

export async function POST(req: NextRequest) {
  const dockerService = new DockerService();
  const multiRegionService = new MultiRegionService();

  try {
    const { projectId, regions } = await req.json();

    // Create regional deployments
    const deployments = await Promise.all(
      regions.map(async (region: string) => {
        const container = await dockerService.createContainer({
          image: 'app:latest',
          name: `app-${projectId}-${region}`,
          config: {
            Memory: 2 * 1024 * 1024 * 1024,
            NanoCpus: 2 * 1000000000,
            NetworkMode: 'global',
            Labels: {
              region,
              projectId
            }
          }
        });

        return { region, containerId: container.id };
      })
    );

    // Setup global routing and failover
    await multiRegionService.setupGlobalRouting({
      projectId,
      deployments,
      strategy: {
        primary: 'latency-based',
        failover: {
          enabled: true,
          maxAttempts: 3,
          timeout: 5000
        },
        healthChecks: {
          path: '/_health',
          interval: 30,
          timeout: 5
        }
      }
    });

    return NextResponse.json({
      deployments,
      globalEndpoint: `https://${projectId}.global.yourdomain.com`
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 