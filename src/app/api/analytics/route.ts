import { NextRequest, NextResponse } from 'next/server';
import { DockerService } from '@/services/DockerService';
import { AnalyticsService } from '@/services/AnalyticsService';

export async function POST(req: NextRequest) {
  const dockerService = new DockerService();
  const analyticsService = new AnalyticsService();

  try {
    const { projectId } = await req.json();

    // Create analytics stack containers
    const clickhouseContainer = await dockerService.createContainer({
      image: 'clickhouse:latest',
      name: `analytics-db-${projectId}`,
      config: {
        Memory: 4 * 1024 * 1024 * 1024,
        NanoCpus: 2 * 1000000000,
        NetworkMode: 'analytics-network',
        Volumes: {
          '/var/lib/clickhouse': {}
        }
      }
    });

    const kafkaContainer = await dockerService.createContainer({
      image: 'kafka:latest',
      name: `analytics-stream-${projectId}`,
      config: {
        Memory: 2 * 1024 * 1024 * 1024,
        NanoCpus: 1000000000,
        NetworkMode: 'analytics-network'
      }
    });

    // Setup analytics pipeline
    await analyticsService.setupAnalyticsPipeline({
      projectId,
      metrics: {
        performance: ['TTFB', 'FCP', 'LCP', 'CLS', 'FID'],
        business: ['conversion', 'engagement', 'retention'],
        infrastructure: ['cpu', 'memory', 'latency', 'errors']
      },
      realtime: {
        enabled: true,
        windowSize: '1m',
        aggregations: ['sum', 'avg', 'p95', 'p99']
      },
      ml: {
        anomalyDetection: true,
        forecasting: true,
        clustering: true
      }
    });

    return NextResponse.json({
      analyticsId: clickhouseContainer.id,
      streamId: kafkaContainer.id,
      dashboards: [
        'performance',
        'infrastructure',
        'business',
        'cost'
      ]
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 