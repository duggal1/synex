import { NextRequest, NextResponse } from 'next/server';
import { EdgeService } from '@/services/EdgeService';
import { DockerService } from '@/services/DockerService';

export async function POST(req: NextRequest) {
  const dockerService = new DockerService();
  const edgeService = new EdgeService();

  try {
    const { projectId, functions } = await req.json();

    // Create edge function containers
    const functionContainers = await Promise.all(
      functions.map(async (fn: any) => {
        const container = await dockerService.createContainer({
          image: 'edge-runtime:latest',
          name: `edge-${projectId}-${fn.name}`,
          config: {
            Memory: 128 * 1024 * 1024, // 128MB
            NanoCpus: 500000000, // 0.5 CPU
            NetworkMode: 'edge-network',
            Env: [
              `FUNCTION_CODE=${Buffer.from(fn.code).toString('base64')}`,
              `FUNCTION_ROUTE=${fn.route}`,
              'NODE_ENV=production'
            ],
            HealthCheck: {
              Test: ["CMD", "curl", "-f", "http://localhost/_health"],
              Interval: 5000000000,
              Timeout: 3000000000,
              Retries: 3
            }
          }
        });

        // Deploy to edge locations
        await edgeService.deployToEdge(container.id, fn.regions || ['all']);
        return container;
      })
    );

    return NextResponse.json({
      functions: functionContainers.map(c => ({
        id: c.id,
        name: c.name,
        status: 'deployed'
      }))
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 