import {
  messages,
  projects,
  type Message,
  type InsertMessage,
} from "@shared/schema";
import { db } from "../db";
import { eq, desc, and, sql } from "drizzle-orm";

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

  async getMessagesByProject(projectId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.projectId, projectId))
      .orderBy(desc(messages.createdAt));
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
      .where(eq(projects.freelancerId, freelancerId))
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
}

export const messageService = new MessageService();