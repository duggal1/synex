import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { DockerService } from '@/services/DockerService';
import { NginxService } from '@/services/NginxService';
import { DeploymentService } from '@/services/DeploymentService';

export async function GET(req: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Use req to log the request method and URL
    console.log(`Received ${req.method} request for ${req.url}`);

    const projects = await prisma.project.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(projects);

  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const { userId } = auth();
  const dockerService = new DockerService();
  const nginxService = new NginxService();
  
  try {
    const { files, framework, env } = await req.json();
    
    // Create deployment record
    const deployment = await prisma.deployment.create({
      data: {
        userId,
        status: 'PENDING',
        framework,
        env: env || {}
      }
    });

    // Setup Docker container
    const container = await dockerService.createContainer({
      deploymentId: deployment.id,
      framework,
      env
    });

    // Configure Nginx
    await nginxService.setupProxy({
      deploymentId: deployment.id,
      port: container.port,
      domain: `${deployment.id}.${process.env.BASE_DOMAIN}`
    });

    return NextResponse.json({ deploymentId: deployment.id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 