import {
  projectTemplates,
  templateDeliverables,
  projects,
  deliverables,
  type ProjectTemplate,
  type InsertProjectTemplate,
  type TemplateDeliverable,
  type InsertTemplateDeliverable,
  type Project,
} from "@shared/schema";
import { db } from "../db";
import { eq, desc, and } from "drizzle-orm";
import { randomUUID } from "crypto";

export type TemplateWithDeliverables = ProjectTemplate & {
  deliverables: TemplateDeliverable[];
};

export class TemplateService {
  async createTemplate(template: InsertProjectTemplate): Promise<ProjectTemplate> {
    const [newTemplate] = await db
      .insert(projectTemplates)
      .values(template)
      .returning();
    return newTemplate;
  }

  async getTemplatesByFreelancer(freelancerId: string): Promise<TemplateWithDeliverables[]> {
    const templates = await db
      .select()
      .from(projectTemplates)
      .where(eq(projectTemplates.freelancerId, freelancerId))
      .orderBy(desc(projectTemplates.createdAt));

    const templatesWithDeliverables = await Promise.all(
      templates.map(async (template) => {
        const templateDeliverablesList = await db
          .select()
          .from(templateDeliverables)
          .where(eq(templateDeliverables.templateId, template.id))
          .orderBy(templateDeliverables.sortOrder);
        return { ...template, deliverables: templateDeliverablesList };
      })
    );

    return templatesWithDeliverables;
  }

  async getTemplateById(id: string): Promise<TemplateWithDeliverables | undefined> {
    const [template] = await db
      .select()
      .from(projectTemplates)
      .where(eq(projectTemplates.id, id));

    if (!template) return undefined;

    const templateDeliverablesList = await db
      .select()
      .from(templateDeliverables)
      .where(eq(templateDeliverables.templateId, id))
      .orderBy(templateDeliverables.sortOrder);

    return { ...template, deliverables: templateDeliverablesList };
  }

  async updateTemplate(
    id: string,
    updates: Partial<InsertProjectTemplate>
  ): Promise<ProjectTemplate> {
    const [updatedTemplate] = await db
      .update(projectTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(projectTemplates.id, id))
      .returning();
    return updatedTemplate;
  }

  async deleteTemplate(id: string): Promise<void> {
    await db.delete(projectTemplates).where(eq(projectTemplates.id, id));
  }

  async addDeliverableToTemplate(
    deliverable: InsertTemplateDeliverable
  ): Promise<TemplateDeliverable> {
    const [newDeliverable] = await db
      .insert(templateDeliverables)
      .values(deliverable)
      .returning();
    return newDeliverable;
  }

  async updateTemplateDeliverable(
    id: string,
    updates: Partial<InsertTemplateDeliverable>
  ): Promise<TemplateDeliverable> {
    const [updated] = await db
      .update(templateDeliverables)
      .set(updates)
      .where(eq(templateDeliverables.id, id))
      .returning();
    return updated;
  }

  async deleteTemplateDeliverable(id: string): Promise<void> {
    await db.delete(templateDeliverables).where(eq(templateDeliverables.id, id));
  }

  async setTemplateDeliverables(
    templateId: string,
    deliverablesList: InsertTemplateDeliverable[]
  ): Promise<TemplateDeliverable[]> {
    await db.delete(templateDeliverables).where(eq(templateDeliverables.templateId, templateId));
    
    if (deliverablesList.length === 0) return [];

    const newDeliverables = await db
      .insert(templateDeliverables)
      .values(
        deliverablesList.map((d, index) => ({
          ...d,
          templateId,
          sortOrder: d.sortOrder ?? index,
        }))
      )
      .returning();
    return newDeliverables;
  }

  async applyTemplate(
    templateId: string,
    freelancerId: string,
    clientName: string,
    clientEmail?: string,
    projectName?: string
  ): Promise<Project> {
    const template = await this.getTemplateById(templateId);
    if (!template) {
      throw new Error("Template not found");
    }

    if (template.freelancerId !== freelancerId) {
      throw new Error("You don't have permission to use this template");
    }

    const tokenExpiry = new Date();
    tokenExpiry.setDate(tokenExpiry.getDate() + 90);

    const [newProject] = await db
      .insert(projects)
      .values({
        name: projectName || `${template.name} - ${clientName}`,
        description: template.description,
        freelancerId,
        clientName,
        clientEmail: clientEmail || null,
        shareToken: randomUUID(),
        tokenExpiry,
        status: template.defaultStatus || "active",
        progress: 0,
      })
      .returning();

    if (template.deliverables.length > 0) {
      await db.insert(deliverables).values(
        template.deliverables.map((td) => ({
          projectId: newProject.id,
          title: td.title,
          description: td.description,
          type: td.type || "deliverable",
          status: "draft",
          uploaderType: "freelancer" as const,
        }))
      );
    }

    return newProject;
  }

  async verifyTemplateOwnership(templateId: string, freelancerId: string): Promise<boolean> {
    const template = await this.getTemplateById(templateId);
    return template?.freelancerId === freelancerId;
  }
}

export const templateService = new TemplateService();
