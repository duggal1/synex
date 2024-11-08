import { NextRequest, NextResponse } from 'next/server';
import { MonitoringService } from '@/services/MonitoringService';
import { DockerService } from '@/services/DockerService';

export async function POST(req: NextRequest) {
  const dockerService = new DockerService();
  const monitoringService = new MonitoringService();

  try {
    const { projectId } = await req.json();

    // Create monitoring stack containers
    const prometheusContainer = await dockerService.createContainer({
      image: 'prometheus:latest',
      name: `prometheus-${projectId}`,
      config: {
        Memory: 1024 * 1024 * 1024,
        NanoCpus: 1000000000,
        NetworkMode: 'monitoring-network',
        Volumes: {
          '/prometheus': {}
        }
      }
    });

    const grafanaContainer = await dockerService.createContainer({
      image: 'grafana:latest',
      name: `grafana-${projectId}`,
      config: {
        Memory: 512 * 1024 * 1024,
        NanoCpus: 500000000,
        NetworkMode: 'monitoring-network',
        Env: [
          `GF_SECURITY_ADMIN_PASSWORD=${process.env.GRAFANA_PASSWORD}`,
          'GF_INSTALL_PLUGINS=grafana-piechart-panel'
        ]
      }
    });

    // Setup alerting
    const alertmanagerContainer = await dockerService.createContainer({
      image: 'alertmanager:latest',
      name: `alertmanager-${projectId}`,
      config: {
        Memory: 256 * 1024 * 1024,
        NanoCpus: 250000000,
        NetworkMode: 'monitoring-network',
        Env: [
          `SLACK_WEBHOOK=${process.env.SLACK_WEBHOOK}`,
          `PAGERDUTY_TOKEN=${process.env.PAGERDUTY_TOKEN}`
        ]
      }
    });

    return NextResponse.json({
      monitoring: {
        prometheus: prometheusContainer.id,
        grafana: grafanaContainer.id,
        alertmanager: alertmanagerContainer.id,
        dashboardUrl: `https://grafana.${process.env.BASE_DOMAIN}/d/${projectId}`
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 