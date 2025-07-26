import {
  users,
  projects,
  deliverables,
  messages,
  invoices,
  feedback,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";
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
  
  // Deliverable operations
  createDeliverable(deliverable: InsertDeliverable): Promise<Deliverable>;
  getDeliverablesByProject(projectId: string): Promise<Deliverable[]>;
  
  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByProject(projectId: string): Promise<Message[]>;
  markMessagesAsRead(projectId: string, senderType: string): Promise<void>;
  
  // Invoice operations
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  getInvoicesByProject(projectId: string): Promise<Invoice[]>;
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

  // Message operations
  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values(message)
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

  async markMessagesAsRead(projectId: string, senderType: string): Promise<void> {
    await db
      .update(messages)
      .set({ isRead: true })
      .where(
        and(
          eq(messages.projectId, projectId),
          eq(messages.senderType, senderType)
        )
      );
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
