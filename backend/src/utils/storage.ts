import fs from 'fs/promises';
import path from 'path';

// Define the shape of our storage provider so we can easily swap to S3 later
export interface StorageProvider {
  /**
   * Uploads a buffer to storage and returns the storage key / relative path
   */
  upload(fileBuffer: Buffer, fileName: string): Promise<string>;
  
  /**
   * Removes a file from storage using its key
   */
  remove(storageKey: string): Promise<boolean>;
}

// Local Disk Implementation
export class LocalStorageProvider implements StorageProvider {
  private baseDir: string;

  constructor() {
    // We assume backend/uploads as the physical storage location
    this.baseDir = path.join(process.cwd(), 'uploads');
  }

  /**
   * Ensures the upload directory exists
   */
  private async ensureDirectory() {
    try {
      await fs.access(this.baseDir);
    } catch {
      await fs.mkdir(this.baseDir, { recursive: true });
    }
  }

  async upload(fileBuffer: Buffer, fileName: string): Promise<string> {
    await this.ensureDirectory();
    
    // Create a predictable physical save path
    const targetPath = path.join(this.baseDir, fileName);
    
    // Save to disk
    await fs.writeFile(targetPath, fileBuffer);
    
    // The storage_key will be the filename itself (or relative 'uploads/filename')
    return fileName;
  }

  async remove(storageKey: string): Promise<boolean> {
    try {
      const targetPath = path.join(this.baseDir, storageKey);
      await fs.unlink(targetPath);
      return true;
    } catch (error) {
      console.error(`Failed to delete file from local storage: ${storageKey}`, error);
      return false; // Return false if file doesn't exist or can't be deleted
    }
  }
}

// Export a singleton instance we can use globally
export const storageService = new LocalStorageProvider();
