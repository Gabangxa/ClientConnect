import {
  users,
  projects,
  deliverables,
  messages,
  invoices,
  feedback,
  accessLogs,
  type User,
  type UpsertUser,
  type Project,
  type InsertProject,
  type Deliverable,
  type InsertDeliverable,
  type Message,
  type InsertMessage,
  type Invoice,
  type InsertInvoice,
  type Feedback,
  type InsertFeedback,
  type AccessLog,
  type InsertAccessLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

// Interface for storage operations
export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Project operations
  createProject(project: InsertProject): Promise<Project>;
  getProjectsByFreelancer(freelancerId: string): Promise<Project[]>;
  getProjectByShareToken(shareToken: string): Promise<Project | undefined>;
  updateProject(id: string, updates: Partial<Project>): Promise<Project>;
  
  // Security operations
  validateShareToken(shareToken: string): Promise<{ valid: boolean; project?: Project }>;
  regenerateShareToken(projectId: string, freelancerId: string): Promise<Project>;
  logAccess(accessLog: InsertAccessLog): Promise<AccessLog>;
  updateProjectAccess(projectId: string): Promise<void>;
  
  // Deliverable operations
  createDeliverable(deliverable: InsertDeliverable): Promise<Deliverable>;
  getDeliverablesByProject(projectId: string): Promise<Deliverable[]>;
  canDeleteDeliverable(deliverableId: string, userId: string, userType?: 'freelancer' | 'client'): Promise<boolean>;
  deleteDeliverable(deliverableId: string): Promise<void>;
  
  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByProject(projectId: string): Promise<Message[]>;
  getRecentMessagesForFreelancer(freelancerId: string): Promise<any[]>;
  markMessagesAsRead(projectId: string, senderType: string): Promise<void>;
  
  // Invoice operations
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  getInvoicesByProject(projectId: string): Promise<Invoice[]>;
  getInvoiceById(id: string): Promise<Invoice | undefined>;
  updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice>;
  
  // Feedback operations
  createFeedback(feedbackData: InsertFeedback): Promise<Feedback>;
  getFeedbackByProject(projectId: string): Promise<Feedback[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Project operations
  async createProject(project: InsertProject): Promise<Project> {
    const shareToken = randomUUID();
    const [newProject] = await db
      .insert(projects)
      .values({
        ...project,
        shareToken,
      })
      .returning();
    return newProject;
  }

  async getProjectsByFreelancer(freelancerId: string): Promise<Project[]> {
    return await db
      .select()
      .from(projects)
      .where(eq(projects.freelancerId, freelancerId))
      .orderBy(desc(projects.updatedAt));
  }

  async getProjectByShareToken(shareToken: string): Promise<Project | undefined> {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.shareToken, shareToken));
    return project;
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    const [project] = await db
      .update(projects)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, id))
      .returning();
    return project;
  }

  // Security operations
  async validateShareToken(shareToken: string): Promise<{ valid: boolean; project?: Project }> {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.shareToken, shareToken));
    
    if (!project) {
      return { valid: false };
    }

    // Check if token has expired
    const now = new Date();
    const expiry = new Date(project.tokenExpiry);
    
    if (now > expiry) {
      return { valid: false, project };
    }

    return { valid: true, project };
  }

  async regenerateShareToken(projectId: string, freelancerId: string): Promise<Project> {
    const newShareToken = randomUUID();
    const newExpiry = new Date();
    newExpiry.setDate(newExpiry.getDate() + 90); // 90 days from now

    const [project] = await db
      .update(projects)
      .set({
        shareToken: newShareToken,
        tokenExpiry: newExpiry,
        updatedAt: new Date(),
      })
      .where(and(eq(projects.id, projectId), eq(projects.freelancerId, freelancerId)))
      .returning();
    return project;
  }

  async logAccess(accessLog: InsertAccessLog): Promise<AccessLog> {
    const [newAccessLog] = await db
      .insert(accessLogs)
      .values(accessLog)
      .returning();
    return newAccessLog;
  }

  async updateProjectAccess(projectId: string): Promise<void> {
    await db
      .update(projects)
      .set({
        accessCount: sql`${projects.accessCount} + 1`,
        lastAccessed: new Date(),
      })
      .where(eq(projects.id, projectId));
  }

  // Deliverable operations
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

  async canDeleteDeliverable(deliverableId: string, userId: string, userType: 'freelancer' | 'client' = 'freelancer'): Promise<boolean> {
    const [deliverable] = await db
      .select()
      .from(deliverables)
      .where(eq(deliverables.id, deliverableId));
    
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
    const [deliverable] = await db
      .select()
      .from(deliverables)
      .where(eq(deliverables.id, deliverableId));
    
    if (deliverable?.filePath) {
      try {
        const fs = require('fs');
        const path = require('path');
        const fullPath = path.resolve(deliverable.filePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
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

  // Message operations
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
      .orderBy(messages.createdAt); // Changed to ascending for chronological order
  }

  async getMessageThreads(projectId: string): Promise<any[]> {
    // Get all messages grouped by thread with reply counts
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
        replyCount: sql<number>`COUNT(CASE WHEN ${messages.parentMessageId} IS NOT NULL THEN 1 END)`,
        totalMessages: sql<number>`COUNT(*)`,
      })
      .from(messages)
      .where(eq(messages.projectId, projectId))
      .groupBy(messages.threadId)
      .orderBy(desc(sql`MAX(${messages.createdAt})`));
    
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
      .innerJoin(projects, eq(messages.projectId, projects.id))
      .where(
        and(
          eq(projects.freelancerId, freelancerId),
          eq(messages.senderType, 'client')
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
        status: 'read'
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
        status: 'read'
      })
      .where(eq(messages.id, messageId));
  }

  async getUnreadMessageCount(projectId: string, forSenderType: string): Promise<number> {
    const result = await db
      .select({ count: sql<number>`COUNT(*)` })
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

  // Invoice operations
  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const [newInvoice] = await db
      .insert(invoices)
      .values(invoice)
      .returning();
    return newInvoice;
  }

  async getInvoicesByProject(projectId: string): Promise<Invoice[]> {
    return await db
      .select()
      .from(invoices)
      .where(eq(invoices.projectId, projectId))
      .orderBy(desc(invoices.createdAt));
  }

  async getInvoiceById(id: string): Promise<Invoice | undefined> {
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, id));
    return invoice;
  }

  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice> {
    const [invoice] = await db
      .update(invoices)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, id))
      .returning();
    return invoice;
  }

  // Feedback operations
  async createFeedback(feedbackData: InsertFeedback): Promise<Feedback> {
    const [newFeedback] = await db
      .insert(feedback)
      .values(feedbackData)
      .returning();
    return newFeedback;
  }

  async getFeedbackByProject(projectId: string): Promise<Feedback[]> {
    return await db
      .select()
      .from(feedback)
      .where(eq(feedback.projectId, projectId))
      .orderBy(desc(feedback.createdAt));
  }
}

export const storage = new DatabaseStorage();
