import { NextRequest, NextResponse } from 'next/server';
import { ScalingService } from '@/services/ScalingService';
import { PerformanceService } from '@/services/PerformanceService';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const scalingService = new ScalingService();
  const performanceService = new PerformanceService();

  try {
    const { autoScale, min, max } = await req.json();

    // Reference existing scaling configuration
    const scalingRules = {
      startLine: 78,
      endLine: 107
    };

    // Setup auto-scaling
    await scalingService.configureScaling(params.id, {
      enabled: autoScale,
      min,
      max,
      rules: scalingRules
    });

    // Optimize performance
    await performanceService.optimizePerformance(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 