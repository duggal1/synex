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
  type: 'A' | 'CNAME' | 'TXT' | 'MX' | 'NS';
  name: string;
  content: string;
  ttl?: number;
  proxied?: boolean;
}

interface SSLConfig {
  mode: 'off' | 'flexible' | 'full' | 'strict';
  status: 'active' | 'pending' | 'error';
}

export class CloudflareService {
  private apiToken: string;
  private baseUrl: string = 'https://api.cloudflare.com/client/v4';
  private zoneId: string;

  constructor() {
    this.apiToken = process.env.CLOUDFLARE_API_TOKEN || '';
    this.zoneId = process.env.CLOUDFLARE_ZONE_ID || '';

    if (!this.apiToken || !this.zoneId) {
      throw new Error('Cloudflare credentials not configured');
    }
  }

  async addDomain(domain: string): Promise<boolean> {
    try {
      // Add domain to Cloudflare
      await this.makeRequest('/zones', {
        method: 'POST',
        body: JSON.stringify({
          name: domain,
          account: { id: process.env.CLOUDFLARE_ACCOUNT_ID },
          jump_start: true
        })
      });

      // Configure initial settings
      await this.configureInitialSettings(domain);

      return true;
    } catch (error) {
      logger.error('Failed to add domain to Cloudflare:', error as Error);
      throw error;
    }
  }

  async addDNSRecord(record: DNSRecord): Promise<boolean> {
    try {
      await this.makeRequest(`/zones/${this.zoneId}/dns_records`, {
        method: 'POST',
        body: JSON.stringify({
          type: record.type,
          name: record.name,
          content: record.content,
          ttl: record.ttl || 1, // Auto TTL
          proxied: record.proxied !== false
        })
      });

      return true;
    } catch (error) {
      logger.error('Failed to add DNS record:', error as Error);
      throw error;
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
} 