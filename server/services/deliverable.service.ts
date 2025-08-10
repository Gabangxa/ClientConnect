import {
  deliverables,
  type Deliverable,
  type InsertDeliverable,
} from "@shared/schema";
import { db } from "../db";
import { eq, desc } from "drizzle-orm";
import { JobService } from '../workers';

export class DeliverableService {
  async createDeliverable(deliverable: InsertDeliverable): Promise<Deliverable> {
    const [newDeliverable] = await db
      .insert(deliverables)
      .values(deliverable)
      .returning();
    
    // Queue background jobs for new deliverable
    try {
      // Generate thumbnail if it's an image/video/PDF
      const supportedMimeTypes = ['image/', 'video/', 'application/pdf'];
      if (newDeliverable.fileType && supportedMimeTypes.some(type => newDeliverable.fileType!.startsWith(type))) {
        await JobService.addThumbnailJob({
          fileKey: newDeliverable.filePath,
          originalFilename: newDeliverable.filename,
          projectId: newDeliverable.projectId,
          mimeType: newDeliverable.fileType
        });
      }
      
      // Send email notification to client (would need client email from project)
      // await JobService.addEmailJob({
      //   type: 'deliverable-uploaded',
      //   recipientEmail: 'client@example.com', // TODO: Get from project
      //   projectId: newDeliverable.projectId,
      //   data: { filename: newDeliverable.filename }
      // });
    } catch (error) {
      // Don't fail deliverable creation if background jobs fail
      console.warn('Failed to queue background jobs for deliverable:', error);
    }
    
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
        // TODO: Implement file deletion when moving to object storage
        console.log("File deletion skipped:", deliverable.filePath);
      } catch (error) {
        console.error("Error deleting file:", error);
        // Continue with database deletion even if file deletion fails
      }
    }

    // Delete from database
    await db
      .delete(deliverables)
      .where(eq(deliverables.id, deliverableId));
  }
}

export const deliverableService = new DeliverableService();