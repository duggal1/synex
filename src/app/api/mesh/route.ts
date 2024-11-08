import { NextRequest, NextResponse } from 'next/server';
import { DockerService } from '@/services/DockerService';
import { ServiceMeshService } from '@/services/ServiceMeshService';

export async function POST(req: NextRequest) {
  const dockerService = new DockerService();
  const meshService = new ServiceMeshService();

  try {
    const { projectId } = await req.json();

    // Create Istio control plane container
    const istioContainer = await dockerService.createContainer({
      image: 'istio:latest',
      name: `mesh-${projectId}`,
      config: {
        Memory: 2 * 1024 * 1024 * 1024,
        NanoCpus: 2 * 1000000000,
        NetworkMode: 'mesh-network',
        Volumes: {
          '/etc/istio': {}
        }
      }
    });

    // Setup service mesh
    await meshService.setupMesh({
      projectId,
      features: {
        tracing: {
          enabled: true,
          samplingRate: 0.1
        },
        circuitBreaker: {
          enabled: true,
          threshold: 50,
          timeout: 1000
        },
        retry: {
          attempts: 3,
          timeout: 2000
        },
        security: {
          mtls: true,
          authorization: true
        }
      }
    });

    return NextResponse.json({
      meshId: istioContainer.id,
      status: 'configured',
      dashboard: `https://mesh.${projectId}.yourdomain.com`
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 