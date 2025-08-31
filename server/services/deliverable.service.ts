/**
 * Deliverable Service
 * 
 * Business logic service for managing file deliverables and uploads.
 * Handles file storage operations, ownership validation, and secure
 * file management with hybrid storage integration.
 * 
 * Features:
 * - Deliverable CRUD operations
 * - File upload to hybrid storage system
 * - Ownership-based deletion permissions
 * - Download URL generation
 * - File validation and security
 * 
 * @module DeliverableService
 */

import {
  deliverables,
  type Deliverable,
  type InsertDeliverable,
} from "@shared/schema";
import { db } from "../db";
import { eq, desc } from "drizzle-orm";
import { storageService } from "./storage.service";

/**
 * Service class for deliverable operations
 * Manages file uploads and deliverable lifecycle
 */
export class DeliverableService {
  async createDeliverable(deliverable: InsertDeliverable): Promise<Deliverable> {
    const [newDeliverable] = await db
      .insert(deliverables)
      .values(deliverable)
      .returning();
    return newDeliverable;
  }

  async getDeliverablesByProject(projectId: string): Promise<Deliverable[]> {
    return await db
      .select()
      .from(deliverables)
      .where(eq(deliverables.projectId, projectId))
      .orderBy(desc(deliverables.createdAt));
  }

  async getDeliverableById(id: string): Promise<Deliverable | undefined> {
    const [deliverable] = await db
      .select()
      .from(deliverables)
      .where(eq(deliverables.id, id));
    return deliverable;
  }

  async canDeleteDeliverable(deliverableId: string, userId: string, userType: 'freelancer' | 'client' = 'freelancer'): Promise<boolean> {
    const deliverable = await this.getDeliverableById(deliverableId);
    
    if (!deliverable) {
      return false;
    }

    // Check if user is the original uploader
    if (userType === 'freelancer') {
      return deliverable.uploaderId === userId && deliverable.uploaderType === 'freelancer';
    } else {
      return deliverable.uploaderId === userId && deliverable.uploaderType === 'client';
    }
  }

  async deleteDeliverable(deliverableId: string): Promise<void> {
    // First get the file path to delete the actual file
    const deliverable = await this.getDeliverableById(deliverableId);
    
    if (deliverable?.filePath) {
      try {
        await storageService.deleteFile(deliverable.filePath);
        console.log("File deleted from object storage:", deliverable.filePath);
      } catch (error) {
        console.error("Error deleting file from object storage:", error);
        // Continue with database deletion even if file deletion fails
      }
    }

    // Delete from database
    await db
      .delete(deliverables)
      .where(eq(deliverables.id, deliverableId));
  }

  async uploadFileToStorage(
    file: Express.Multer.File, 
    projectId: string, 
    uploaderType: 'freelancer' | 'client'
  ): Promise<{ filePath: string; downloadUrl: string }> {
    try {
      // Use secure filename if available, otherwise generate one
      const secureFilename = (file as any).secureFilename || file.originalname;
      const filePath = storageService.generateFilePath(secureFilename, projectId, uploaderType);
      
      // Handle different multer storage configurations
      let buffer: Buffer;
      if (file.buffer) {
        // Memory storage - file is already in buffer
        buffer = file.buffer;
      } else if (file.path) {
        // Disk storage - read file from path
        const fs = await import('fs');
        buffer = await fs.promises.readFile(file.path);
      } else {
        throw new Error("No file data available - file must have either buffer or path");
      }
      
      console.log(`Uploading file: ${secureFilename}, size: ${buffer.length} bytes`);
      await storageService.uploadFile(filePath, buffer, file.mimetype);
      const downloadUrl = storageService.getDownloadUrl(filePath);
      
      return { filePath, downloadUrl };
    } catch (error) {
      console.error("Error uploading file to storage:", error);
      console.error("File details:", {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        hasBuffer: !!file.buffer,
        hasPath: !!file.path
      });
      throw new Error("Failed to upload file");
    }
  }
}

export const deliverableService = new DeliverableService();