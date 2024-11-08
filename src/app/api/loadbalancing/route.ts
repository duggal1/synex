import { NextRequest, NextResponse } from 'next/server';
import { DockerService } from '@/services/DockerService';
import { LoadBalancerService } from '@/services/LoadBalancerService';

export async function POST(req: NextRequest) {
  const dockerService = new DockerService();
  const loadBalancerService = new LoadBalancerService();

  try {
    const { projectId, config } = await req.json();

    // Create HAProxy container for load balancing
    const haproxyContainer = dockerService.createContainer({
        image: 'haproxy:latest',
        name: `lb-${projectId}`,
        config: {
            Memory: 512 * 1024 * 1024,
            NanoCpus: 1000000000,
            NetworkMode: 'loadbalancer-network',
            Ports: {
                '80/tcp': [{ HostPort: '80' }],
                '443/tcp': [{ HostPort: '443' }]
            },
            Volumes: {
                '/usr/local/etc/haproxy': {}
            },
            HealthCheck: {
                Test: ["CMD", "haproxy", "-c", "-f", "/usr/local/etc/haproxy/haproxy.cfg"],
                Interval: 10000000000,
                Timeout: 5000000000,
                Retries: 3
            }
        }
    });

    // Setup global load balancing
    loadBalancerService.setupGlobalRouting({
          projectId,
          container: haproxyContainer.id,
          algorithm: config.algorithm || 'least_conn',
          healthCheck: {
              path: '/_health',
              interval: 5,
              timeout: 3,
              unhealthyThreshold: 2
          },
          ssl: {
              enabled: true,
              provider: 'letsencrypt'
          }
      });

    return NextResponse.json({
      loadBalancerId: haproxyContainer.id,
      endpoints: {
        http: `http://${config.domain}`,
        https: `https://${config.domain}`
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}