/**
 * Storage Service
 * 
 * Production-ready storage system using Replit Object Storage exclusively.
 * Enforces scalable file handling and versioning.
 * 
 * Features:
 * - Exclusive Object Storage usage (enforced for production)
 * - File versioning (preserves history)
 * - Unified file upload/download interface
 * - Smart file path generation with versioning support
 * 
 * @module StorageService
 */

import { Client } from '@replit/object-storage';
import path from 'path';
import { Readable } from 'stream';

/**
 * Service class for object storage operations
 */
export class StorageService {
  private client: Client;

  constructor() {
    this.client = new Client();
  }

  /**
   * Upload a file to Replit Object Storage
   * @param filePath - The path/key where the file will be stored
   * @param buffer - The file buffer to upload
   * @param mimeType - The MIME type of the file
   * @returns The file path/key
   */
  async uploadFile(filePath: string, buffer: Buffer, mimeType?: string): Promise<string> {
    try {
      // Check if file exists to handle versioning
      const exists = await this.fileExists(filePath);
      let finalPath = filePath;

      if (exists) {
        // Versioning: Append timestamp to filename if it already exists
        const ext = path.extname(filePath);
        const name = path.basename(filePath, ext);
        const dir = path.dirname(filePath);
        finalPath = `${dir}/${name}_v${Date.now()}${ext}`;
        console.log(`[Storage] Versioning applied: ${filePath} -> ${finalPath}`);
      }

      console.log(`[Storage] Uploading to Object Storage: ${finalPath}`);
      await this.client.uploadFromBytes(finalPath, buffer);
      console.log(`[Storage] Upload success`);
      return finalPath;
    } catch (error) {
      console.error('[Storage] Error uploading file:', error);
      throw new Error('Failed to upload file to object storage');
    }
  }

  /**
   * Download a file from Replit Object Storage
   * @param filePath - The path/key of the file to download
   * @returns The file buffer
   * @deprecated Use downloadFileStream for memory efficiency
   */
  async downloadFile(filePath: string): Promise<Buffer> {
    try {
      const result = await this.client.downloadAsBytes(filePath);
      return result as unknown as Buffer;
    } catch (error) {
      console.error('[Storage] Error downloading file:', error);
      throw new Error('Failed to download file');
    }
  }

  /**
   * Stream a file from Replit Object Storage
   * @param filePath - The path/key of the file to download
   * @returns A readable stream of the file content
   */
  downloadFileStream(filePath: string): Readable {
    try {
      return this.client.downloadAsStream(filePath);
    } catch (error) {
      console.error('[Storage] Error creating download stream:', error);
      throw new Error('Failed to create download stream');
    }
  }

  /**
   * Delete a file from Replit Object Storage
   * @param filePath - The path/key of the file to delete
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      await this.client.delete(filePath);
    } catch (error) {
      console.error('[Storage] Error deleting file:', error);
      // Don't throw if delete fails, just log it
    }
  }

  /**
   * Check if a file exists in Replit Object Storage
   * @param filePath - The path/key of the file to check
   * @returns True if file exists, false otherwise
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      const { ok } = await this.client.exists(filePath);
      return ok;
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
    // Basic path structure: projects/<id>/<type>/<filename>
    // Versioning is handled in uploadFile if collision occurs
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `projects/${projectId}/${uploaderType}/${sanitizedName}`;
  }

  /**
   * Generate a unique file path for storing message attachments
   */
  generateMessageAttachmentPath(originalName: string, messageId: string, projectId: string): string {
    const sanitizedName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `projects/${projectId}/messages/${messageId}/${sanitizedName}`;
  }

  /**
   * Get the download URL for a file
   */
  getDownloadUrl(filePath: string): string {
    return `/api/files/download/${encodeURIComponent(filePath)}`;
  }
}

export const storageService = new StorageService();
