import { NextRequest, NextResponse } from 'next/server';
import { MonitoringService } from '@/services/MonitoringService';
import { LoggingService } from '@/services/LoggingService';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const monitoringService = new MonitoringService();
  const loggingService = new LoggingService();

  try {
    // Get performance metrics
    const metrics = await monitoringService.getMetrics(params.id);

    // Get recent logs
    const logs = await loggingService.getRecentLogs(params.id);

    // Get scaling recommendations
    const scalingAdvice = await monitoringService.getScalingRecommendations(params.id);

    return NextResponse.json({
      metrics,
      logs,
      recommendations: scalingAdvice
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 