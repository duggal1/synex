/* eslint-disable @typescript-eslint/no-unused-vars */
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import path from 'path';
import fs from 'fs-extra';
import { createHash } from 'crypto';

interface StorageConfig {
  maxFileSize: number;      // in bytes
  retentionDays: number;    // how long to keep files
  compressionLevel: number; // 1-9
}

interface StorageMetrics {
  totalSize: number;
  fileCount: number;
  lastUpload: Date;
}

export class StorageService {
  private supabase: SupabaseClient;
  private readonly BUCKET_NAME = 'project-builds';
  private readonly config: StorageConfig = {
    maxFileSize: 500 * 1024 * 1024, // 500MB
    retentionDays: 30,
    compressionLevel: 9
  };

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.initStorage();
  }

  private async initStorage(): Promise<void> {
    try {
      // Initialize bucket with retry logic
      for (let i = 0; i < 3; i++) {
        try {
          const { data: bucket, error } = await this.supabase
            .storage
            .getBucket(this.BUCKET_NAME);

          if (error) throw error;

          if (!bucket) {
            const { error: createError } = await this.supabase.storage.createBucket(
              this.BUCKET_NAME,
              {
                public: false,
                allowedMimeTypes: [
                  'application/zip',
                  'application/x-zip-compressed',
                  'application/x-compressed',
                  'application/x-gzip'
                ],
                fileSizeLimit: this.config.maxFileSize
              }
            );

            if (createError) throw createError;
          }

          // Setup bucket lifecycle policy
          await this.setupBucketPolicy();
          break;
        } catch (error) {
          if (i === 2) throw error; // Throw on final retry
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))); // Exponential backoff
        }
      }
    } catch (error) {
      logger.error('Failed to initialize storage:', error as Error);
      throw new Error('Storage initialization failed');
    }
  }

  async uploadProject(
    projectId: string,
    files: Buffer,
    metadata?: Record<string, string>
  ): Promise<string> {
    try {
      // Validate file size
      if (files.length > this.config.maxFileSize) {
        throw new Error(`File size exceeds limit of ${this.config.maxFileSize / 1024 / 1024}MB`);
      }

      // Generate file hash for integrity check
      const fileHash = this.generateFileHash(files);
      
      // Generate unique filename
      const fileName = this.generateFileName(projectId, fileHash);

      // Upload with retry logic
      for (let i = 0; i < 3; i++) {
        try {
          const { error } = await this.supabase
            .storage
            .from(this.BUCKET_NAME)
            .upload(fileName, files, {
              contentType: 'application/zip',
              cacheControl: '3600',
              upsert: false,
              metadata: {
                ...metadata,
                projectId,
                fileHash,
                timestamp: new Date().toISOString()
              }
            });

          if (error) throw error;
          break;
        } catch (error) {
          if (i === 2) throw error;
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
      }

      // Store upload record in database
      await this.recordUpload(projectId, fileName, fileHash, files.length);

      return fileName;
    } catch (error) {
      logger.error('Project upload failed:', error as Error);
      throw new Error(`Failed to upload project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async downloadProject(fileName: string, projectId: string): Promise<Buffer> {
    try {
      // Validate access permission
      await this.validateAccess(fileName, projectId);

      // Download with retry logic
      for (let i = 0; i < 3; i++) {
        try {
          const { data, error } = await this.supabase
            .storage
            .from(this.BUCKET_NAME)
            .download(fileName);

          if (error) throw error;

          const buffer = Buffer.from(await data.arrayBuffer());

          // Verify file integrity
          const downloadedHash = this.generateFileHash(buffer);
          const originalHash = await this.getOriginalHash(fileName);

          if (downloadedHash !== originalHash) {
            throw new Error('File integrity check failed');
          }

          return buffer;
        } catch (error) {
          if (i === 2) throw error;
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
      }

      throw new Error('Download failed after retries');
    } catch (error) {
      logger.error('Project download failed:', error as Error);
      throw new Error(`Failed to download project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteProject(fileName: string, projectId: string): Promise<void> {
    try {
      // Validate access permission
      await this.validateAccess(fileName, projectId);

      const { error } = await this.supabase
        .storage
        .from(this.BUCKET_NAME)
        .remove([fileName]);

      if (error) throw error;

      // Remove database record
      await prisma.projectStorage.delete({
        where: {
          fileName
        }
      });
    } catch (error) {
      logger.error('Project deletion failed:', error as Error);
      throw new Error(`Failed to delete project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getStorageMetrics(projectId: string): Promise<StorageMetrics> {
    try {
      const metrics = await prisma.projectStorage.aggregate({
        where: {
          projectId
        },
        _sum: {
          size: true
        },
        _count: {
          fileName: true
        },
        _max: {
          createdAt: true
        }
      });

      return {
        totalSize: metrics._sum.size || 0,
        fileCount: metrics._count.fileName || 0,
        lastUpload: metrics._max.createdAt || new Date(0)
      };
    } catch (error) {
      logger.error('Failed to get storage metrics:', error as Error);
      throw new Error('Could not retrieve storage metrics');
    }
  }

  private generateFileHash(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }

  private generateFileName(projectId: string, hash: string): string {
    return `${projectId}/${hash}-${Date.now()}.zip`;
  }

  private async setupBucketPolicy(): Promise<void> {
    // Implementation would depend on Supabase's API for bucket policies
    // Currently not directly supported through the JS client
  }

  private async validateAccess(fileName: string, projectId: string): Promise<void> {
    const storage = await prisma.projectStorage.findFirst({
      where: {
        fileName,
        projectId
      }
    });

    if (!storage) {
      throw new Error('Access denied or file not found');
    }
  }

  private async recordUpload(
    projectId: string,
    fileName: string,
    hash: string,
    size: number
  ): Promise<void> {
    await prisma.projectStorage.create({
      data: {
        projectId,
        fileName,
        hash,
        size,
        createdAt: new Date()
      }
    });
  }

  private async getOriginalHash(fileName: string): Promise<string> {
    const storage = await prisma.projectStorage.findUnique({
      where: {
        fileName
      }
    });

    if (!storage) {
      throw new Error('File record not found');
    }

    return storage.hash;
  }
} 