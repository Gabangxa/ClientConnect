import { Client } from '@replit/object-storage';
import fs from 'fs';
import path from 'path';

export class StorageService {
  private client: Client | null = null;
  private useObjectStorage: boolean = false;
  private localStorageDir: string;
  private initialized: boolean = false;

  constructor() {
    this.localStorageDir = path.join(process.cwd(), "uploads");
    this.ensureLocalDirectory();
    // Don't initialize object storage in constructor to avoid blocking startup
  }

  private async ensureInitialized() {
    if (this.initialized) return;
    
    try {
      // Try to initialize object storage
      this.client = new Client();
      // Test the client with a simple operation
      await this.client.list();
      this.useObjectStorage = true;
      console.log("✅ Object storage initialized successfully");
    } catch (error) {
      console.log("⚠️ Object storage not available, using local storage fallback");
      this.useObjectStorage = false;
    }
    
    this.initialized = true;
  }

  private ensureLocalDirectory() {
    if (!fs.existsSync(this.localStorageDir)) {
      fs.mkdirSync(this.localStorageDir, { recursive: true });
    }
  }

  /**
   * Upload a file to Replit Object Storage
   * @param filePath - The path/key where the file will be stored
   * @param buffer - The file buffer to upload
   * @param mimeType - The MIME type of the file
   * @returns The file path/key
   */
  async uploadFile(filePath: string, buffer: Buffer, mimeType?: string): Promise<string> {
    await this.ensureInitialized();
    
    try {
      if (this.useObjectStorage && this.client) {
        await this.client.uploadFromBytes(filePath, buffer);
        return filePath;
      } else {
        // Local storage fallback
        const localPath = path.join(this.localStorageDir, path.basename(filePath));
        await fs.promises.writeFile(localPath, buffer);
        return path.basename(filePath); // Return just filename for local storage
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error('Failed to upload file');
    }
  }

  /**
   * Download a file from Replit Object Storage
   * @param filePath - The path/key of the file to download
   * @returns The file buffer
   */
  async downloadFile(filePath: string): Promise<Buffer> {
    await this.ensureInitialized();
    
    try {
      if (this.useObjectStorage && this.client) {
        const result = await this.client.downloadAsBytes(filePath);
        return Buffer.from(result);
      } else {
        // Local storage fallback
        const localPath = path.join(this.localStorageDir, path.basename(filePath));
        return await fs.promises.readFile(localPath);
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      throw new Error('Failed to download file');
    }
  }

  /**
   * Delete a file from Replit Object Storage
   * @param filePath - The path/key of the file to delete
   */
  async deleteFile(filePath: string): Promise<void> {
    await this.ensureInitialized();
    
    try {
      if (this.useObjectStorage && this.client) {
        await this.client.delete(filePath);
      } else {
        // Local storage fallback
        const localPath = path.join(this.localStorageDir, path.basename(filePath));
        if (fs.existsSync(localPath)) {
          await fs.promises.unlink(localPath);
        }
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      throw new Error('Failed to delete file');
    }
  }

  /**
   * Check if a file exists in Replit Object Storage
   * @param filePath - The path/key of the file to check
   * @returns True if file exists, false otherwise
   */
  async fileExists(filePath: string): Promise<boolean> {
    await this.ensureInitialized();
    
    try {
      if (this.useObjectStorage && this.client) {
        await this.client.downloadAsBytes(filePath);
        return true;
      } else {
        // Local storage fallback
        const localPath = path.join(this.localStorageDir, path.basename(filePath));
        return fs.existsSync(localPath);
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate a unique file path for storing files
   * @param originalName - The original filename
   * @param projectId - The project ID
   * @param uploaderType - The type of uploader (freelancer/client)
   * @returns A unique file path
   */
  generateFilePath(originalName: string, projectId: string, uploaderType: string): string {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split('.').pop();
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    return `projects/${projectId}/${uploaderType}/${timestamp}_${randomSuffix}_${sanitizedName}`;
  }

  /**
   * Get the download URL for a file (in this case, it's just the file path)
   * @param filePath - The path/key of the file
   * @returns The download URL/path
   */
  getDownloadUrl(filePath: string): string {
    if (this.useObjectStorage) {
      return `/api/files/download/${encodeURIComponent(filePath)}`;
    } else {
      // Local storage uses legacy route
      return `/api/files/${path.basename(filePath)}`;
    }
  }

  isUsingObjectStorage(): boolean {
    return this.useObjectStorage;
  }
}

export const storageService = new StorageService();