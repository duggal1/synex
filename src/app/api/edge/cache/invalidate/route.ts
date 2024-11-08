import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const { projectId, paths } = await req.json();

    // Validate project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Perform cache invalidation logic
    await Promise.all(
      paths.map(async (path: string) => {
        await prisma.projectConfig.update({
          where: { projectId },
          data: {
            edgeConfig: {
              cacheInvalidations: {
                push: {
                  path,
                  timestamp: new Date()
                }
              }
            }
          }
        });
      })
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Cache invalidation failed:', error);
    return NextResponse.json(
      { error: 'Cache invalidation failed' },
      { status: 500 }
    );
  }
} 