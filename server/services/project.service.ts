/**
 * Project Service
 * 
 * Core business logic service for managing projects, share tokens, and access control.
 * Handles project lifecycle management, security validation, and access logging
 * for the client portal system.
 * 
 * Features:
 * - Project CRUD operations with validation
 * - Share token generation and validation (90-day expiry)
 * - Access logging with IP tracking
 * - Project ownership verification
 * - Status and progress management
 * 
 * @module ProjectService
 */

import {
  projects,
  accessLogs,
  messages,
  deliverables,
  invoices,
  feedback,
  messageAttachments,
  type Project,
  type InsertProject,
  type AccessLog,
  type InsertAccessLog,
} from "@shared/schema";
import { db } from "../db";
import { eq, desc, and, sql, inArray } from "drizzle-orm";
import { randomUUID } from "crypto";
import { storageService } from "./storage.service";

/**
 * Service class for project-related business logic
 * Manages all database operations and business rules for projects
 */
export class ProjectService {
  async createProject(project: InsertProject): Promise<Project> {
    const tokenExpiry = new Date();
    tokenExpiry.setDate(tokenExpiry.getDate() + 90); // 90 days from now
    
    const [newProject] = await db
      .insert(projects)
      .values({
        ...project,
        shareToken: randomUUID(),
        tokenExpiry: tokenExpiry,
        status: 'active',
        progress: 0,
      })
      .returning();
    return newProject;
  }

  async getProjectsByFreelancer(freelancerId: string): Promise<Project[]> {
    return await db
      .select()
      .from(projects)
      .where(eq(projects.freelancerId, freelancerId))
      .orderBy(desc(projects.createdAt));
  }

  async getProjectByShareToken(shareToken: string): Promise<Project | undefined> {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.shareToken, shareToken));
    return project;
  }

  async getProjectById(id: string): Promise<Project | undefined> {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id));
    return project;
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    const [updatedProject] = await db
      .update(projects)
      .set(updates)
      .where(eq(projects.id, id))
      .returning();
    return updatedProject;
  }

  async validateShareToken(shareToken: string): Promise<{ valid: boolean; project?: Project }> {
    const project = await this.getProjectByShareToken(shareToken);
    
    if (!project) {
      return { valid: false };
    }

    // Ensure tokenExpiry exists and is valid
    if (!project.tokenExpiry) {
      return { valid: false };
    }

    // Check if token has expired using the actual tokenExpiry field
    const now = new Date();
    const tokenExpiry = new Date(project.tokenExpiry);
    
    // Ensure tokenExpiry is a valid date
    if (isNaN(tokenExpiry.getTime())) {
      return { valid: false };
    }
    
    if (now > tokenExpiry) {
      return { valid: false };
    }

    return { valid: true, project };
  }

  async regenerateShareToken(projectId: string, freelancerId: string): Promise<Project> {
    const newToken = randomUUID();
    const newExpiry = new Date();
    newExpiry.setDate(newExpiry.getDate() + 90); // 90 days from now
    
    return await this.updateProject(projectId, { 
      shareToken: newToken,
      tokenExpiry: newExpiry
    });
  }

  async logAccess(accessLog: InsertAccessLog): Promise<AccessLog> {
    const [newLog] = await db
      .insert(accessLogs)
      .values(accessLog)
      .returning();
    return newLog;
  }

  async updateProjectAccess(projectId: string): Promise<void> {
    // Increment access count directly without expensive COUNT query
    await db
      .update(projects)
      .set({
        lastAccessed: new Date(),
        accessCount: sql`COALESCE(access_count, 0) + 1`,
      })
      .where(eq(projects.id, projectId));
  }

  async deleteProject(projectId: string, freelancerId: string): Promise<void> {
    const project = await this.getProjectById(projectId);
    
    if (!project) {
      throw new Error("Project not found");
    }

    if (project.freelancerId !== freelancerId) {
      throw new Error("Unauthorized: You can only delete your own projects");
    }

    // Get all deliverable file paths to delete from storage
    const projectDeliverables = await db
      .select({ filePath: deliverables.filePath })
      .from(deliverables)
      .where(eq(deliverables.projectId, projectId));

    // Get all message IDs to find their attachments
    const projectMessages = await db
      .select({ id: messages.id })
      .from(messages)
      .where(eq(messages.projectId, projectId));

    const messageIds = projectMessages.map(m => m.id);

    // Get all message attachment file paths
    let attachmentFilePaths: string[] = [];
    if (messageIds.length > 0) {
      const attachments = await db
        .select({ filePath: messageAttachments.filePath })
        .from(messageAttachments)
        .where(inArray(messageAttachments.messageId, messageIds));
      attachmentFilePaths = attachments.map(a => a.filePath).filter(Boolean);
    }

    // Delete files from storage
    const allFilePaths = [
      ...projectDeliverables.map(d => d.filePath).filter(Boolean),
      ...attachmentFilePaths,
    ] as string[];

    for (const filePath of allFilePaths) {
      try {
        await storageService.deleteFile(filePath);
      } catch (error) {
        console.error(`Failed to delete file ${filePath}:`, error);
      }
    }

    // Delete message attachments first (foreign key constraint)
    if (messageIds.length > 0) {
      await db
        .delete(messageAttachments)
        .where(inArray(messageAttachments.messageId, messageIds));
    }

    // Delete all related data in order (respecting foreign key constraints)
    await db.delete(messages).where(eq(messages.projectId, projectId));
    await db.delete(deliverables).where(eq(deliverables.projectId, projectId));
    await db.delete(invoices).where(eq(invoices.projectId, projectId));
    await db.delete(feedback).where(eq(feedback.projectId, projectId));
    await db.delete(accessLogs).where(eq(accessLogs.projectId, projectId));

    // Finally delete the project
    await db.delete(projects).where(eq(projects.id, projectId));
  }
}

export const projectService = new ProjectService();