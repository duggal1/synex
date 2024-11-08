import { NextRequest, NextResponse } from 'next/server';
import { DockerService } from '@/services/DockerService';
import { ResourceOptimizationService } from '@/services/ResourceOptimizationService';

export async function POST(req: NextRequest) {
  const dockerService = new DockerService();
  const resourceService = new ResourceOptimizationService();

  try {
    const { projectId } = await req.json();

    // Create resource optimizer container
    const optimizerContainer = await dockerService.createContainer({
      image: 'resource-optimizer:latest',
      name: `optimizer-${projectId}`,
      config: {
        Memory: 512 * 1024 * 1024,
        NanoCpus: 1000000000,
        NetworkMode: 'optimizer-network',
        Volumes: {
          '/metrics': {}
        },
        Env: [
          'OPTIMIZATION_MODE=aggressive',
          'ANALYSIS_INTERVAL=300'
        ]
      }
    });

    // Setup resource optimization
    const optimization = await resourceService.optimizeResources({
      projectId,
      strategies: {
        cpu: {
          limit: 'dynamic',
          burstable: true,
          autoScale: true
        },
        memory: {
          limit: 'dynamic',
          swapStrategy: 'conservative',
          gcOptimization: true
        },
        storage: {
          compression: true,
          deduplication: true,
          tieringEnabled: true
        }
      },
      autotuning: {
        enabled: true,
        learningRate: 0.1,
        adaptationInterval: '1h'
      }
    });

    return NextResponse.json({
      optimizerId: optimizerContainer.id,
      recommendations: optimization.recommendations,
      savings: optimization.projectedSavings
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 