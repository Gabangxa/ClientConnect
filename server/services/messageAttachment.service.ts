/**
 * Message Attachment Service
 * 
 * Business logic service for managing message file attachments.
 * Handles file storage operations, attachment validation, and secure
 * file management with hybrid storage integration.
 * 
 * Features:
 * - Message attachment CRUD operations
 * - File upload to hybrid storage system
 * - Authorization-based access control
 * - Download URL generation
 * - File validation and security
 * 
 * @module MessageAttachmentService
 */

import {
  messageAttachments,
  type MessageAttachment,
  type InsertMessageAttachment,
} from "@shared/schema";
import { db } from "../db";
import { eq, desc } from "drizzle-orm";
import { storageService } from "./storage.service";
import fs from 'fs';

/**
 * Service class for message attachment operations
 * Manages file uploads and attachment lifecycle
 */
export class MessageAttachmentService {
  async createAttachment(attachment: InsertMessageAttachment): Promise<MessageAttachment> {
    const [newAttachment] = await db
      .insert(messageAttachments)
      .values(attachment)
      .returning();
    return newAttachment;
  }

  async getAttachmentsByMessage(messageId: string): Promise<MessageAttachment[]> {
    return await db
      .select()
      .from(messageAttachments)
      .where(eq(messageAttachments.messageId, messageId))
      .orderBy(desc(messageAttachments.uploadedAt));
  }

  async getAttachmentById(id: string): Promise<MessageAttachment | undefined> {
    const [attachment] = await db
      .select()
      .from(messageAttachments)
      .where(eq(messageAttachments.id, id));
    return attachment;
  }

  async deleteAttachment(attachmentId: string): Promise<void> {
    // First get the file path to delete the actual file
    const attachment = await this.getAttachmentById(attachmentId);
    
    if (attachment?.filePath) {
      try {
        await storageService.deleteFile(attachment.filePath);
        console.log("Attachment file deleted from storage:", attachment.filePath);
      } catch (error) {
        console.error("Error deleting attachment file from storage:", error);
        // Continue with database deletion even if file deletion fails
      }
    }

    // Delete from database
    await db
      .delete(messageAttachments)
      .where(eq(messageAttachments.id, attachmentId));
  }

  async uploadFileToStorage(
    file: Express.Multer.File, 
    messageId: string, 
    projectId: string
  ): Promise<{ filePath: string; downloadUrl: string }> {
    try {
      // Use secure filename if available, otherwise generate one
      const secureFilename = (file as any).secureFilename || file.originalname;
      const filePath = storageService.generateMessageAttachmentPath(secureFilename, messageId, projectId);
      
      // Handle different multer storage configurations
      let buffer: Buffer;
      if (file.buffer) {
        // Memory storage - file is already in buffer
        buffer = file.buffer;
      } else if (file.path) {
        // Disk storage - read file from path
        buffer = await fs.promises.readFile(file.path);
      } else {
        throw new Error("No file data available - file must have either buffer or path");
      }
      
      console.log(`Uploading message attachment: ${secureFilename}, size: ${buffer.length} bytes`);
      await storageService.uploadFile(filePath, buffer, file.mimetype);
      const downloadUrl = storageService.getDownloadUrl(filePath);
      
      return { filePath, downloadUrl };
    } catch (error) {
      console.error("Error uploading message attachment to storage:", error);
      console.error("File details:", {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        hasBuffer: !!file.buffer,
        hasPath: !!file.path
      });
      throw new Error("Failed to upload message attachment");
    }
  }

  async deleteAttachmentsByMessage(messageId: string): Promise<void> {
    // Get all attachments for the message
    const attachments = await this.getAttachmentsByMessage(messageId);
    
    // Delete each attachment (including files)
    for (const attachment of attachments) {
      await this.deleteAttachment(attachment.id);
    }
  }
}

export const messageAttachmentService = new MessageAttachmentService();