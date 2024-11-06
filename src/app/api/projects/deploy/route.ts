import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { StorageService } from '@/services/StorageService';
import { BuildService } from '@/services/BuildService';
import { DomainService } from '@/services/DomainService';
import { db } from '@/lib/prisma';

const storageService = new StorageService();
const buildService = new BuildService();
const domainService = new DomainService();

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get form data
    const formData = await req.formData();
    const projectName = formData.get('name') as string;
    const projectFile = formData.get('project') as File;

    if (!projectName || !projectFile) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Create project
    const project = await db.project.create({
      data: {
        name: projectName,
        userId: user.id,
        status: 'CREATING',
      }
    });

    // Convert File to Buffer
    const buffer = Buffer.from(await projectFile.arrayBuffer());

    // Upload to storage
    const storagePath = await storageService.uploadProject(
      project.id,
      buffer
    );

    // Build project
    const buildResult = await buildService.build(project.id, {
      projectId: project.id,
      framework: 'NEXTJS',
      buildCommand: 'npm run build',
      nodeVersion: '18.x'
    });

    // Setup domain
    const domain = await domainService.addDomain(
      project.id,
      `${project.id}.yourdomain.com`,
      user.id
    );

    // Update project status
    await db.project.update({
      where: { id: project.id },
      data: {
        status: 'ACTIVE',
        domain: domain.domain,
      }
    });

    return NextResponse.json({
      project,
      domain: domain.domain,
      buildId: buildResult.buildId
    });

  } catch (error) {
    console.error('Deployment failed:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
} 