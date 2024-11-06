/* eslint-disable @typescript-eslint/no-explicit-any */
import { logger } from './logger';

interface CacheRule {
  pattern: string;
  ttl: number;
}

interface CloudflareResponse {
  success: boolean;
  errors: any[];
  messages: any[];
  result: any;
}

export class CloudflareClient {
  private apiToken: string;
  private baseUrl: string = 'https://api.cloudflare.com/client/v4';
  private zoneId: string;

  constructor(apiToken: string) {
    if (!apiToken) {
      throw new Error('Cloudflare API token is required');
    }
    this.apiToken = apiToken;
    this.zoneId = process.env.CLOUDFLARE_ZONE_ID || '';
  }

  async getCache(key: string): Promise<any> {
    try {
      const response = await this.makeRequest(`/zones/${this.zoneId}/cache/keys/${key}`, {
        method: 'GET'
      });
      return response.result;
    } catch (error) {
      logger.error('Cloudflare getCache failed:', error as Error);
      return null;
    }
  }

  async setCache(key: string, value: any, ttl: number): Promise<boolean> {
    try {
      await this.makeRequest(`/zones/${this.zoneId}/cache/keys`, {
        method: 'POST',
        body: JSON.stringify({
          key,
          value,
          ttl
        })
      });
      return true;
    } catch (error) {
      logger.error('Cloudflare setCache failed:', error as Error);
      return false;
    }
  }

  async purgeCache(tags: string[]): Promise<boolean> {
    try {
      await this.makeRequest(`/zones/${this.zoneId}/purge_cache`, {
        method: 'POST',
        body: JSON.stringify({
          tags
        })
      });
      return true;
    } catch (error) {
      logger.error('Cloudflare purgeCache failed:', error as Error);
      return false;
    }
  }

  async setCacheRules(projectId: string, rules: CacheRule[]): Promise<boolean> {
    try {
      const transformedRules = rules.map(rule => ({
        target: 'url',
        pattern: rule.pattern,
        actions: [
          {
            name: 'cache_level',
            value: 'cache_everything'
          },
          {
            name: 'edge_cache_ttl',
            value: rule.ttl
          }
        ],
        priority: 1,
        status: 'active'
      }));

      await this.makeRequest(`/zones/${this.zoneId}/rulesets`, {
        method: 'PUT',
        body: JSON.stringify({
          name: `Cache Rules - ${projectId}`,
          description: 'Automatically generated cache rules',
          kind: 'zone',
          phase: 'http_request_cache_settings',
          rules: transformedRules
        })
      });

      return true;
    } catch (error) {
      logger.error('Cloudflare setCacheRules failed:', error as Error);
      return false;
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

  // DNS Management
  async addDNSRecord(
    domain: string,
    type: 'A' | 'CNAME' | 'TXT',
    content: string
  ): Promise<boolean> {
    try {
      await this.makeRequest(`/zones/${this.zoneId}/dns_records`, {
        method: 'POST',
        body: JSON.stringify({
          type,
          name: domain,
          content,
          proxied: true
        })
      });
      return true;
    } catch (error) {
      logger.error('Cloudflare addDNSRecord failed:', error as Error);
      return false;
    }
  }

  // SSL/TLS Configuration
  async configureSSL(mode: 'flexible' | 'full' | 'strict'): Promise<boolean> {
    try {
      await this.makeRequest(`/zones/${this.zoneId}/settings/ssl`, {
        method: 'PATCH',
        body: JSON.stringify({
          value: mode
        })
      });
      return true;
    } catch (error) {
      logger.error('Cloudflare configureSSL failed:', error as Error);
      return false;
    }
  }

  // Page Rules
  async createPageRule(
    url: string,
    settings: Record<string, any>
  ): Promise<boolean> {
    try {
      await this.makeRequest(`/zones/${this.zoneId}/pagerules`, {
        method: 'POST',
        body: JSON.stringify({
          targets: [
            {
              target: 'url',
              constraint: {
                operator: 'matches',
                value: url
              }
            }
          ],
          actions: Object.entries(settings).map(([key, value]) => ({
            id: key,
            value
          })),
          status: 'active',
          priority: 1
        })
      });
      return true;
    } catch (error) {
      logger.error('Cloudflare createPageRule failed:', error as Error);
      return false;
    }
  }
} 