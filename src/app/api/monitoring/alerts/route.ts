import { NextRequest, NextResponse } from 'next/server';
import { MonitoringService } from '@/services/MonitoringService';
import { AlertService } from '@/services/AlertService';
import { MetricsService } from '@/services/MetricsService';

export async function POST(req: NextRequest) {
  const monitoringService = new MonitoringService();
  const alertService = new AlertService();
  const metricsService = new MetricsService();

  try {
    const { projectId, alertConfig } = await req.json();

    // Setup metrics collection
    await metricsService.setupCollection({
      projectId,
      metrics: [
        'cpu',
        'memory',
        'latency',
        'error_rate',
        'requests_per_second'
      ],
      interval: '10s'
    });

    // Configure alerts
    await alertService.setupAlerts({
      projectId,
      rules: [
        {
          metric: 'error_rate',
          threshold: 1,
          period: '5m',
          action: 'notify'
        },
        {
          metric: 'cpu',
          threshold: 80,
          period: '5m',
          action: 'scale'
        },
        {
          metric: 'memory',
          threshold: 85,
          period: '5m',
          action: 'notify'
        }
      ],
      notifications: {
        channels: ['email', 'slack', 'pagerduty'],
        escalation: {
          levels: ['team', 'manager', 'oncall'],
          intervals: [15, 30, 60]
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 