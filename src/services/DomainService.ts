/* eslint-disable @typescript-eslint/no-unused-vars */
import { prisma } from '@/lib/prisma';
import { exec } from 'child_process';
import { promisify } from 'util';
import dns from 'dns';
import { CloudflareService } from '@/services/CloudflareService';

const execAsync = promisify(exec);
const dnsResolve = promisify(dns.resolve);

export class DomainService {
  private cloudflare: CloudflareService;
  
  constructor() {
    this.cloudflare = new CloudflareService();
  }

  async addDomain(projectId: string, domainName: string, userId: string) {
    try {
      // Validate domain format
      if (!this.isValidDomain(domainName)) {
        throw new Error('Invalid domain format');
      }

      // Check domain availability
      const isDomainAvailable = await this.checkDomainAvailability(domainName);
      if (!isDomainAvailable) {
        throw new Error('Domain already in use');
      }

      // Create domain record
      const domain = await prisma.domain.create({
        data: {
          domain: domainName,
          projectId,
          userId,
          type: domainName.includes('.localhost') ? 'SUBDOMAIN' : 'CUSTOM',
          verified: false,
        }
      });

      // Setup DNS for custom domains
      if (domain.type === 'CUSTOM') {
        await this.setupCustomDomain(domain.id, domainName);
      }

      return domain;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to add domain: ${error.message}`);
      }
      throw new Error('Failed to add domain: Unknown error');
    }
  }

  async setupCustomDomain(domainId: string, domainName: string) {
    // Generate SSL certificate
    await this.generateSSL(domainName);

    // Create DNS records
    await prisma.dnsRecord.createMany({
      data: [
        {
          domainId,
          type: 'A',
          name: '@',
          content: process.env.SERVER_IP!,
        },
        {
          domainId,
          type: 'CNAME',
          name: 'www',
          content: domainName,
        }
      ]
    });

    // Update Nginx configuration
    await this.updateNginxConfig(domainName);
  }

  private async generateSSL(domain: string) {
    try {
      await execAsync(
        `certbot certonly --nginx -d ${domain} -d www.${domain} --non-interactive --agree-tos --email ${process.env.ADMIN_EMAIL}`
      );
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`SSL generation failed: ${error.message}`);
      }
      throw new Error('SSL generation failed: Unknown error');
    }
  }

  private async updateNginxConfig(domain: string) {
    const config = this.generateNginxConfig(domain);
    await this.writeNginxConfig(domain, config);
    await this.reloadNginx();
  }

  private generateNginxConfig(domain: string): string {
    return `
      server {
        listen 80;
        listen [::]:80;
        server_name ${domain} www.${domain};
        
        location / {
          return 301 https://$server_name$request_uri;
        }
      }

      server {
        listen 443 ssl http2;
        listen [::]:443 ssl http2;
        server_name ${domain} www.${domain};

        ssl_certificate /etc/letsencrypt/live/${domain}/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/${domain}/privkey.pem;
        
        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        
        # Proxy settings
        location / {
          proxy_pass http://localhost:3000;
          proxy_http_version 1.1;
          proxy_set_header Upgrade $http_upgrade;
          proxy_set_header Connection 'upgrade';
          proxy_set_header Host $host;
          proxy_cache_bypass $http_upgrade;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_set_header X-Forwarded-Proto $scheme;
          
          # Timeouts
          proxy_connect_timeout 60s;
          proxy_send_timeout 60s;
          proxy_read_timeout 60s;
        }
      }
    `;
  }

  private async writeNginxConfig(domain: string, config: string) {
    const path = `/etc/nginx/sites-available/${domain}`;
    await execAsync(`echo '${config}' | sudo tee ${path}`);
    await execAsync(`sudo ln -sf ${path} /etc/nginx/sites-enabled/${domain}`);
  }

  private async reloadNginx() {
    await execAsync('sudo nginx -t && sudo systemctl reload nginx');
  }

  private isValidDomain(domain: string): boolean {
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
    return domainRegex.test(domain);
  }

  private async checkDomainAvailability(domain: string): Promise<boolean> {
    const existing = await prisma.domain.findFirst({
      where: { domain }
    });
    return !existing;
  }
} 