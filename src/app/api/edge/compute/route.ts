import { NextRequest, NextResponse } from 'next/server';
import { EdgeFunctionService } from '@/services/EdgeFunctionService';
import { EdgeNetworkService } from '@/services/EdgeNetworkService';

export async function POST(req: NextRequest) {
  const edgeFunctionService = new EdgeFunctionService();
  const edgeNetworkService = new EdgeNetworkService();

  try {
    const { projectId, functions } = await req.json();

    // Reference existing edge function configuration
    const functionConfig = {
      startLine: 143,
      endLine: 155
    };

    // Deploy edge functions globally
    const deployments = await Promise.all(
      functions.map(async (fn: any) => {
        const config = edgeFunctionService.createFunctionConfig(fn.code, {
          name: fn.name,
          route: fn.route,
          runtime: fn.runtime || 'nodejs',
          memory: fn.memory || 128
        });

        await edgeFunctionService.deployToEdge(projectId, config);
        return config;
      })
    );

    // Setup edge network configuration
    const edgeConfig = await edgeNetworkService.createEdgeConfig({
      startLine: 119,
      endLine: 126
    });

    return NextResponse.json({ 
      deployments,
      edgeConfig 
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 