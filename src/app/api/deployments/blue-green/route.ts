import { NextRequest, NextResponse } from 'next/server';
import { BlueGreenService } from '@/services/BlueGreenService';
import { DockerService } from '@/services/DockerService';
import { LoadBalancerService } from '@/services/LoadBalancerService';

export async function POST(req: NextRequest) {
  const blueGreenService = new BlueGreenService();
  const dockerService = new DockerService();
  const loadBalancer = new LoadBalancerService();

  try {
    const { projectId, version } = await req.json();

    // Create new environment
    const greenEnv = await dockerService.createEnvironment({
      projectId,
      version,
      type: 'green'
    });

    // Warm up and health check
    await blueGreenService.warmupEnvironment(greenEnv.id);
    const isHealthy = await blueGreenService.performHealthCheck(greenEnv.id);

    if (!isHealthy) {
      throw new Error('Health check failed for new deployment');
    }

    // Gradual traffic shift
    await loadBalancer.gradualTrafficShift({
      oldEnv: 'blue',
      newEnv: 'green',
      projectId,
      steps: [25, 50, 75, 100],
      intervalSeconds: 300
    });

    return NextResponse.json({ success: true, environmentId: greenEnv.id });
  } catch (error) {
    return NextResponse.json(
      { error: error.message, rollback: true },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  // Rollback endpoint
  const blueGreenService = new BlueGreenService();
  
  try {
    const { projectId, deploymentId } = await req.json();
    await blueGreenService.rollback(projectId, deploymentId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 