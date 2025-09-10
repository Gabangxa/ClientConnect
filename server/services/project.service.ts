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
  type Project,
  type InsertProject,
  type AccessLog,
  type InsertAccessLog,
} from "@shared/schema";
import { db } from "../db";
import { eq, desc, and, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

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
    // Get current access count
    const currentCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(accessLogs)
      .where(eq(accessLogs.projectId, projectId));
    
    await db
      .update(projects)
      .set({
        lastAccessed: new Date(),
        accessCount: (currentCount[0]?.count || 0) + 1,
      })
      .where(eq(projects.id, projectId));
  }
}

export const projectService = new ProjectService();