import { createClient } from '@supabase/supabase-js';
import { db } from '@/lib/prisma';
import path from 'path';
import fs from 'fs-extra';

export class StorageService {
  private supabase;
  private readonly BUCKET_NAME = 'project-builds';

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );
    this.initBucket();
  }

  private async initBucket() {
    const { data: bucket } = await this.supabase
      .storage
      .getBucket(this.BUCKET_NAME);

    if (!bucket) {
      await this.supabase.storage.createBucket(this.BUCKET_NAME, {
        public: false,
        allowedMimeTypes: ['application/zip', 'application/x-zip-compressed']
      });
    }
  }

  async uploadProject(projectId: string, files: Buffer): Promise<string> {
    try {
      const fileName = `${projectId}/${Date.now()}.zip`;
      
      const { error } = await this.supabase
        .storage
        .from(this.BUCKET_NAME)
        .upload(fileName, files, {
          contentType: 'application/zip',
          cacheControl: '3600'
        });

      if (error) throw error;

      return fileName;
    } catch (error) {
      throw new Error(`Failed to upload project: ${error.message}`);
    }
  }

  async downloadProject(fileName: string): Promise<Buffer> {
    try {
      const { data, error } = await this.supabase
        .storage
        .from(this.BUCKET_NAME)
        .download(fileName);

      if (error) throw error;

      return Buffer.from(await data.arrayBuffer());
    } catch (error) {
      throw new Error(`Failed to download project: ${error.message}`);
    }
  }
} 