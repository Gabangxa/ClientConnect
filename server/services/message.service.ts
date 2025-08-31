/**
 * Message Service
 * 
 * Business logic service for managing messaging operations between freelancers
 * and clients. Handles message creation, threading, status management, and
 * notification filtering to ensure proper communication flow.
 * 
 * Features:
 * - Automatic thread ID generation and inheritance
 * - Message status tracking (sent, delivered, read)
 * - Filtered message retrieval by user type
 * - Bulk and individual message read marking
 * - Recent message aggregation for dashboards
 * 
 * @module MessageService
 */

import {
  messages,
  projects,
  messageAttachments,
  type Message,
  type InsertMessage,
  type MessageAttachment,
} from "@shared/schema";
import { db } from "../db";
import { eq, desc, and, sql } from "drizzle-orm";
import { messageAttachmentService } from "./messageAttachment.service";

/**
 * Service class for message-related business logic
 * Handles all database operations and business rules for messaging
 */
export class MessageService {
  async createMessage(message: InsertMessage): Promise<Message> {
    // Auto-generate threadId if not provided and no parent
    if (!message.threadId && !message.parentMessageId) {
      message.threadId = message.projectId + '-' + Date.now();
    }
    
    // If replying to a message, inherit the threadId
    if (message.parentMessageId && !message.threadId) {
      const [parentMessage] = await db
        .select({ threadId: messages.threadId })
        .from(messages)
        .where(eq(messages.id, message.parentMessageId));
      
      if (parentMessage?.threadId) {
        message.threadId = parentMessage.threadId;
      }
    }
    
    const [newMessage] = await db
      .insert(messages)
      .values({
        ...message,
        deliveredAt: new Date(), // Mark as delivered immediately for now
      })
      .returning();
    return newMessage;
  }

  async createMessageWithAttachments(
    message: InsertMessage, 
    attachmentFiles?: Express.Multer.File[]
  ): Promise<Message & { attachments: MessageAttachment[] }> {
    // Create the message first
    const newMessage = await this.createMessage(message);
    
    // Handle file uploads if provided
    const attachments: MessageAttachment[] = [];
    if (attachmentFiles && attachmentFiles.length > 0) {
      for (const file of attachmentFiles) {
        try {
          // Upload file to storage
          const { filePath, downloadUrl } = await messageAttachmentService.uploadFileToStorage(
            file, 
            newMessage.id, 
            newMessage.projectId
          );
          
          // Create attachment record
          const attachment = await messageAttachmentService.createAttachment({
            messageId: newMessage.id,
            filePath,
            fileName: file.originalname,
            fileSize: file.size,
            mimeType: file.mimetype,
          });
          
          attachments.push(attachment);
        } catch (error) {
          console.error(`Failed to upload attachment ${file.originalname}:`, error);
          // Continue with other attachments even if one fails
        }
      }
    }
    
    return { ...newMessage, attachments };
  }

  async getMessagesByProject(projectId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.projectId, projectId))
      .orderBy(desc(messages.createdAt));
  }

  async getMessagesWithAttachments(projectId: string): Promise<(Message & { attachments: MessageAttachment[] })[]> {
    // Get all messages for the project
    const projectMessages = await this.getMessagesByProject(projectId);
    
    // Get attachments for each message
    const messagesWithAttachments = await Promise.all(
      projectMessages.map(async (message) => {
        const attachments = await messageAttachmentService.getAttachmentsByMessage(message.id);
        return { ...message, attachments };
      })
    );
    
    return messagesWithAttachments;
  }

  async getMessageThreads(projectId: string): Promise<any[]> {
    const result = await db
      .select({
        threadId: messages.threadId,
        latestMessage: {
          id: messages.id,
          content: messages.content,
          senderName: messages.senderName,
          senderType: messages.senderType,
          createdAt: messages.createdAt,
          status: messages.status,
          priority: messages.priority,
        },
        replyCount: sql<number>`count(*)`.as('reply_count'),
        totalMessages: sql<number>`count(*)`.as('total_messages'),
      })
      .from(messages)
      .where(eq(messages.projectId, projectId))
      .groupBy(messages.threadId)
      .orderBy(desc(messages.createdAt));

    return result;
  }

  async getRecentMessagesForFreelancer(freelancerId: string): Promise<any[]> {
    return await db
      .select({
        id: messages.id,
        content: messages.content,
        senderName: messages.senderName,
        senderType: messages.senderType,
        isRead: messages.isRead,
        createdAt: messages.createdAt,
        projectId: messages.projectId,
        projectName: projects.name,
        clientName: projects.clientName,
      })
      .from(messages)
      .leftJoin(projects, eq(messages.projectId, projects.id))
      .where(
        and(
          eq(projects.freelancerId, freelancerId),
          eq(messages.senderType, 'client') // Only show messages FROM clients TO freelancer
        )
      )
      .orderBy(desc(messages.createdAt))
      .limit(10);
  }

  async markMessagesAsRead(projectId: string, senderType: string, userId?: string): Promise<void> {
    const readTimestamp = new Date();
    await db
      .update(messages)
      .set({
        isRead: true,
        readAt: readTimestamp,
      })
      .where(
        and(
          eq(messages.projectId, projectId),
          eq(messages.senderType, senderType)
        )
      );
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    const readTimestamp = new Date();
    await db
      .update(messages)
      .set({
        isRead: true,
        readAt: readTimestamp,
      })
      .where(eq(messages.id, messageId));
  }

  async getUnreadMessageCount(projectId: string, forSenderType: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(
        and(
          eq(messages.projectId, projectId),
          eq(messages.senderType, forSenderType),
          eq(messages.isRead, false)
        )
      );
    
    return result[0]?.count || 0;
  }

  async getMessageThread(threadId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.threadId, threadId))
      .orderBy(messages.createdAt);
  }

  async deleteMessage(messageId: string): Promise<void> {
    // First delete all attachments for this message (includes file cleanup)
    await messageAttachmentService.deleteAttachmentsByMessage(messageId);
    
    // Then delete the message itself
    await db
      .delete(messages)
      .where(eq(messages.id, messageId));
  }

  async getMessageById(messageId: string): Promise<Message | undefined> {
    const [message] = await db
      .select()
      .from(messages)
      .where(eq(messages.id, messageId));
    return message;
  }

  async getMessageWithAttachments(messageId: string): Promise<(Message & { attachments: MessageAttachment[] }) | undefined> {
    const message = await this.getMessageById(messageId);
    if (!message) return undefined;
    
    const attachments = await messageAttachmentService.getAttachmentsByMessage(messageId);
    return { ...message, attachments };
  }
}

export const messageService = new MessageService();