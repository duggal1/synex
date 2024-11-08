import { NextRequest, NextResponse } from 'next/server';
import { DockerService } from '@/services/DockerService';
import { BackupService } from '@/services/BackupService';

export async function POST(req: NextRequest) {
  const dockerService = new DockerService();
  const backupService = new BackupService();

  try {
    const { projectId, backupConfig } = await req.json();

    // Create backup service container
    const backupContainer = await dockerService.createContainer({
      image: 'backup-service:latest',
      name: `backup-${projectId}`,
      config: {
        Memory: 512 * 1024 * 1024,
        NanoCpus: 500000000,
        NetworkMode: 'backup-network',
        Volumes: {
          '/backup': {},
          '/data': {}
        },
        Env: [
          `AWS_ACCESS_KEY=${process.env.AWS_ACCESS_KEY}`,
          `AWS_SECRET_KEY=${process.env.AWS_SECRET_KEY}`,
          `BACKUP_BUCKET=${process.env.BACKUP_BUCKET}`
        ]
      }
    });

    // Setup backup schedule and retention
    await backupService.setupBackupPolicy({
      projectId,
      schedule: backupConfig.schedule || '0 0 * * *', // Daily
      retention: backupConfig.retention || '30d',
      type: backupConfig.type || 'full',
      encryption: true,
      compression: true,
      locations: ['s3', 'gcs']
    });

    return NextResponse.json({
      backupId: backupContainer.id,
      policy: backupConfig,
      nextBackup: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 