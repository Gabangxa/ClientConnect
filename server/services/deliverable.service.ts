import {
  deliverables,
  type Deliverable,
  type InsertDeliverable,
} from "@shared/schema";
import { db } from "../db";
import { eq, desc } from "drizzle-orm";
import { storageService } from "./storage.service";

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
      const filePath = storageService.generateFilePath(file.originalname, projectId, uploaderType);
      const buffer = Buffer.from(file.buffer || await require('fs').promises.readFile(file.path));
      
      await storageService.uploadFile(filePath, buffer, file.mimetype);
      const downloadUrl = storageService.getDownloadUrl(filePath);
      
      return { filePath, downloadUrl };
    } catch (error) {
      console.error("Error uploading file to storage:", error);
      throw new Error("Failed to upload file");
    }
  }
}

export const deliverableService = new DeliverableService();