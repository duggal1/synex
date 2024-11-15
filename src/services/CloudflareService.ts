/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { logger } from '@/lib/logger';

interface CloudflareResponse {
  success: boolean;
  errors: any[];
  messages: any[];
  result: any;
}

interface DNSRecord {
  name: string;
  type: 'A' | 'CNAME' | 'TXT' | 'MX';
  content: string;
  proxied: boolean;
  ttl?: number;
}

interface SSLConfig {
  mode: 'off' | 'flexible' | 'full' | 'strict';
  status: 'active' | 'pending' | 'error';
}

interface RateLimitConfig {
  threshold: number;
  period: string;
  action: 'challenge' | 'block' | 'simulate';
}

interface DDoSRule {
  threshold: number;
  mitigation: ('challenge' | 'block')[];
}

export class CloudflareService {
  private readonly apiToken: string;
  private readonly zoneId: string;
  private readonly baseUrl: string = 'https://api.cloudflare.com/client/v4';

  constructor() {
    this.apiToken = process.env.CLOUDFLARE_API_TOKEN!;
    this.zoneId = process.env.CLOUDFLARE_ZONE_ID!;

    if (!this.apiToken || !this.zoneId) {
      throw new Error('Cloudflare API token and Zone ID are required');
    }
  }

  async createDNSRecord(record: DNSRecord) {
    try {
      const response = await fetch(
        `${this.baseUrl}/zones/${this.zoneId}/dns_records`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: record.type,
            name: record.name,
            content: record.content,
            proxied: record.proxied,
            ttl: record.ttl || 1, // 1 = automatic
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.errors?.[0]?.message || 'Failed to create DNS record');
      }

      logger.info('DNS record created successfully', {
        domain: record.name,
        type: record.type,
        content: record.content,
      });

      return data.result;
    } catch (error) {
      logger.error('Failed to create DNS record', {
        error,
        record,
      });
      throw new Error(`Failed to create DNS record: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteDNSRecord(recordId: string) {
    try {
      const response = await fetch(
        `${this.baseUrl}/zones/${this.zoneId}/dns_records/${recordId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.errors?.[0]?.message || 'Failed to delete DNS record');
      }

      logger.info('DNS record deleted successfully', { recordId });
    } catch (error) {
      logger.error('Failed to delete DNS record', {
        error,
        recordId,
      });
      throw new Error(`Failed to delete DNS record: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getDNSRecords(domain: string) {
    try {
      const response = await fetch(
        `${this.baseUrl}/zones/${this.zoneId}/dns_records?name=${domain}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.errors?.[0]?.message || 'Failed to fetch DNS records');
      }

      return data.result;
    } catch (error) {
      logger.error('Failed to fetch DNS records', {
        error,
        domain,
      });
      throw new Error(`Failed to fetch DNS records: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateDNSRecord(recordId: string, record: Partial<DNSRecord>) {
    try {
      const response = await fetch(
        `${this.baseUrl}/zones/${this.zoneId}/dns_records/${recordId}`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(record),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.errors?.[0]?.message || 'Failed to update DNS record');
      }

      logger.info('DNS record updated successfully', {
        recordId,
        updates: record,
      });

      return data.result;
    } catch (error) {
      logger.error('Failed to update DNS record', {
        error,
        recordId,
        record,
      });
      throw new Error(`Failed to update DNS record: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async configureSSL(domain: string, mode: SSLConfig['mode'] = 'full'): Promise<boolean> {
    try {
      await this.makeRequest(`/zones/${this.zoneId}/ssl/package`, {
        method: 'PATCH',
        body: JSON.stringify({ value: mode })
      });

      return true;
    } catch (error) {
      logger.error('Failed to configure SSL:', error as Error);
      throw error;
    }
  }

  async purgeCache(domain: string): Promise<boolean> {
    try {
      await this.makeRequest(`/zones/${this.zoneId}/purge_cache`, {
        method: 'POST',
        body: JSON.stringify({
          purge_everything: true
        })
      });

      return true;
    } catch (error) {
      logger.error('Failed to purge cache:', error as Error);
      throw error;
    }
  }

  async configureCDN(domain: string, enabled: boolean): Promise<boolean> {
    try {
      await this.makeRequest(`/zones/${this.zoneId}/settings/always_use_https`, {
        method: 'PATCH',
        body: JSON.stringify({ value: 'on' })
      });

      await this.makeRequest(`/zones/${this.zoneId}/settings/ssl`, {
        method: 'PATCH',
        body: JSON.stringify({ value: 'full' })
      });

      await this.makeRequest(`/zones/${this.zoneId}/settings/min_tls_version`, {
        method: 'PATCH',
        body: JSON.stringify({ value: '1.2' })
      });

      return true;
    } catch (error) {
      logger.error('Failed to configure CDN:', error as Error);
      throw error;
    }
  }

  private async configureInitialSettings(domain: string): Promise<void> {
    try {
      // Enable HTTPS
      await this.makeRequest(`/zones/${this.zoneId}/settings/always_use_https`, {
        method: 'PATCH',
        body: JSON.stringify({ value: 'on' })
      });

      // Enable TLS 1.3
      await this.makeRequest(`/zones/${this.zoneId}/settings/min_tls_version`, {
        method: 'PATCH',
        body: JSON.stringify({ value: '1.3' })
      });

      // Enable HSTS
      await this.makeRequest(`/zones/${this.zoneId}/settings/security_header`, {
        method: 'PATCH',
        body: JSON.stringify({
          value: {
            enabled: true,
            max_age: 31536000,
            include_subdomains: true,
            preload: true
          }
        })
      });

      // Enable Browser Integrity Check
      await this.makeRequest(`/zones/${this.zoneId}/settings/browser_check`, {
        method: 'PATCH',
        body: JSON.stringify({ value: 'on' })
      });
    } catch (error) {
      logger.error('Failed to configure initial settings:', error as Error);
      throw error;
    }
  }

  private async makeRequest(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<CloudflareResponse> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.apiToken}`,
      'Content-Type': 'application/json'
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers
        }
      });

      const data: CloudflareResponse = await response.json();

      if (!data.success) {
        throw new Error(
          `Cloudflare API error: ${JSON.stringify(data.errors)}`
        );
      }

      return data;
    } catch (error) {
      logger.error('Cloudflare API request failed:', error as Error);
      throw error;
    }
  }

  async setupRateLimiting(config: { zoneId: string; config: RateLimitConfig }): Promise<void> {
    try {
      await this.makeRequest(`/zones/${config.zoneId}/rate_limits`, {
        method: 'POST',
        body: JSON.stringify({
          disabled: false,
          description: `Rate limiting - ${config.config.threshold} requests per ${config.config.period}`,
          match: {
            request: {
              methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD'],
              schemes: ['HTTP', 'HTTPS'],
              url: '*'
            }
          },
          threshold: config.config.threshold,
          period: config.config.period,
          action: {
            mode: config.config.action,
            timeout: 60,
            response: {
              content_type: 'text/plain',
              body: 'Rate limit exceeded'
            }
          },
          correlate: {
            by: 'ip'
          },
          bypass: [
            {
              name: 'allowlisted_ips',
              value: process.env.ALLOWED_IPS || ''
            }
          ]
        })
      });

      logger.info('Rate limiting configured successfully', {
        zoneId: config.zoneId,
        threshold: config.config.threshold,
        period: config.config.period
      });
    } catch (error) {
      logger.error('Failed to setup rate limiting:', error);
      throw new Error(`Failed to setup rate limiting: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async setupDDoSRules(config: { zoneId: string; config: DDoSRule }): Promise<void> {
    try {
      // Configure DDoS protection settings
      await this.makeRequest(`/zones/${config.zoneId}/security/ddos`, {
        method: 'PUT',
        body: JSON.stringify({
          // Enable advanced DDoS protection
          advanced_ddos: true,
          // Configure threshold-based rules
          threshold_rules: [{
            threshold: config.config.threshold,
            mitigation_timeout: 3600, // 1 hour
            mitigation_actions: config.config.mitigation
          }]
        })
      });

      // Setup additional security rules
      await this.makeRequest(`/zones/${config.zoneId}/firewall/rules`, {
        method: 'POST',
        body: JSON.stringify([
          {
            description: 'DDoS Protection - Anomaly Detection',
            action: 'challenge',
            expression: `(http.request.rate gt ${config.config.threshold} and ip.src.threat_score gt 20)`,
            enabled: true
          },
          {
            description: 'DDoS Protection - Burst Rate Control',
            action: 'block',
            expression: `(http.request.rate.burst gt ${config.config.threshold * 2})`,
            enabled: true
          },
          {
            description: 'DDoS Protection - Bad Bots',
            action: 'block',
            expression: '(cf.client.bot and not cf.client.bot_category in {"good", "verified"})',
            enabled: true
          }
        ])
      });

      // Configure adaptive protection
      await this.makeRequest(`/zones/${config.zoneId}/security/adaptive`, {
        method: 'PUT',
        body: JSON.stringify({
          enabled: true,
          sensitivity: 'high',
          response_actions: config.config.mitigation
        })
      });

      logger.info('DDoS protection rules configured successfully', {
        zoneId: config.zoneId,
        threshold: config.config.threshold,
        mitigations: config.config.mitigation
      });
    } catch (error) {
      logger.error('Failed to setup DDoS rules:', error);
      throw new Error(`Failed to setup DDoS rules: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async setupSecurityHeaders(domain: string): Promise<void> {
    try {
      await this.makeRequest(`/zones/${this.zoneId}/settings/security_header`, {
        method: 'PATCH',
        body: JSON.stringify({
          value: {
            enabled: true,
            strict_transport_security: {
              enabled: true,
              max_age: 31536000,
              include_subdomains: true,
              preload: true,
              nosniff: true
            },
            content_security_policy: {
              enabled: true,
              policy: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
            },
            x_content_type_options: true,
            x_frame_options: 'DENY',
            x_xss_protection: '1; mode=block',
            referrer_policy: 'strict-origin-when-cross-origin'
          }
        })
      });

      logger.info('Security headers configured successfully', { domain });
    } catch (error) {
      logger.error('Failed to setup security headers:', error);
      throw new Error(`Failed to setup security headers: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
} 