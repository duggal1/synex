import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/services/DatabaseService';
import { DockerService } from '@/services/DockerService';

export async function POST(req: NextRequest) {
  const dockerService = new DockerService();
  const databaseService = new DatabaseService();

  try {
    const { projectId, dbType } = await req.json();

    // Create database container
    const dbContainer = await dockerService.createContainer({
      image: `${dbType}:latest`,
      name: `db-${projectId}`,
      config: {
        Memory: 2 * 1024 * 1024 * 1024, // 2GB
        NanoCpus: 2 * 1000000000, // 2 CPU
        NetworkMode: 'database-network',
        Volumes: {
          '/data': {},
          '/backup': {}
        },
        HealthCheck: {
          Test: ["CMD", "pg_isready", "-U", "postgres"],
          Interval: 10000000000, // 10s
          Timeout: 5000000000,   // 5s
          Retries: 5
        }
      }
    });

    // Setup replication
    const replicaContainers = await Promise.all(
      ['eu-west', 'ap-east'].map(region =>
        dockerService.createContainer({
          image: `${dbType}:latest`,
          name: `db-${projectId}-replica-${region}`,
          config: {
            Memory: 2 * 1024 * 1024 * 1024,
            NanoCpus: 1 * 1000000000,
            NetworkMode: 'database-network',
            Env: [
              `REPLICATION_SOURCE=${dbContainer.id}`,
              `REGION=${region}`
            ]
          }
        })
      )
    );

    return NextResponse.json({
      mainDb: dbContainer.id,
      replicas: replicaContainers.map(c => c.id)
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 