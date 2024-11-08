/* eslint-disable @typescript-eslint/no-unused-vars */
export class LoggingService {
  async setupLogging(projectId: string) {
    return {
      elk: {
        enabled: true,
        retention: '30d'
      },
      metrics: ['latency', 'errors', 'requests'],
      alerts: {
        conditions: ['error_rate > 1%', 'p95_latency > 500ms'],
        channels: ['email', 'slack']
      }
    };
  }
} 