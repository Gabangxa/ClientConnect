import { Request, Response } from "express";
import { templateService, type TemplateWithDeliverables } from "../services/template.service";
import type { InsertProjectTemplate, InsertTemplateDeliverable } from "@shared/schema";

interface CreateTemplateRequest {
  name: string;
  description?: string;
  defaultStatus?: string;
  category?: string;
  deliverables?: Array<{
    title: string;
    description?: string;
    type?: string;
    sortOrder?: number;
    dueDaysOffset?: number;
  }>;
}

interface ApplyTemplateRequest {
  clientName: string;
  clientEmail?: string;
  projectName?: string;
}

export const templateController = {
  async getTemplates(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const templates = await templateService.getTemplatesByFreelancer(userId);
      res.json(templates);
    } catch (error) {
      console.error("Error getting templates:", error);
      res.status(500).json({ message: "Failed to get templates" });
    }
  },

  async getTemplate(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { templateId } = req.params;
      const template = await templateService.getTemplateById(templateId);

      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      if (template.freelancerId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(template);
    } catch (error) {
      console.error("Error getting template:", error);
      res.status(500).json({ message: "Failed to get template" });
    }
  },

  async createTemplate(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const body = req.body as CreateTemplateRequest;
      
      if (!body.name) {
        return res.status(400).json({ message: "Template name is required" });
      }

      const templateData: InsertProjectTemplate = {
        freelancerId: userId,
        name: body.name,
        description: body.description,
        defaultStatus: body.defaultStatus || "active",
        category: body.category,
      };

      const template = await templateService.createTemplate(templateData);

      if (body.deliverables && body.deliverables.length > 0) {
        const deliverables = body.deliverables.map((d, index) => ({
          templateId: template.id,
          title: d.title,
          description: d.description,
          type: d.type || "deliverable",
          sortOrder: d.sortOrder ?? index,
          dueDaysOffset: d.dueDaysOffset,
        }));
        await templateService.setTemplateDeliverables(template.id, deliverables);
      }

      const fullTemplate = await templateService.getTemplateById(template.id);
      res.status(201).json(fullTemplate);
    } catch (error) {
      console.error("Error creating template:", error);
      res.status(500).json({ message: "Failed to create template" });
    }
  },

  async updateTemplate(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { templateId } = req.params;
      const isOwner = await templateService.verifyTemplateOwnership(templateId, userId);

      if (!isOwner) {
        return res.status(403).json({ message: "Access denied" });
      }

      const body = req.body as CreateTemplateRequest;
      const updates: Partial<InsertProjectTemplate> = {};

      if (body.name) updates.name = body.name;
      if (body.description !== undefined) updates.description = body.description;
      if (body.defaultStatus) updates.defaultStatus = body.defaultStatus;
      if (body.category !== undefined) updates.category = body.category;

      await templateService.updateTemplate(templateId, updates);

      if (body.deliverables) {
        const deliverables = body.deliverables.map((d, index) => ({
          templateId,
          title: d.title,
          description: d.description,
          type: d.type || "deliverable",
          sortOrder: d.sortOrder ?? index,
          dueDaysOffset: d.dueDaysOffset,
        }));
        await templateService.setTemplateDeliverables(templateId, deliverables);
      }

      const fullTemplate = await templateService.getTemplateById(templateId);
      res.json(fullTemplate);
    } catch (error) {
      console.error("Error updating template:", error);
      res.status(500).json({ message: "Failed to update template" });
    }
  },

  async deleteTemplate(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { templateId } = req.params;
      const isOwner = await templateService.verifyTemplateOwnership(templateId, userId);

      if (!isOwner) {
        return res.status(403).json({ message: "Access denied" });
      }

      await templateService.deleteTemplate(templateId);
      res.json({ message: "Template deleted successfully" });
    } catch (error) {
      console.error("Error deleting template:", error);
      res.status(500).json({ message: "Failed to delete template" });
    }
  },

  async applyTemplate(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { templateId } = req.params;
      const body = req.body as ApplyTemplateRequest;

      if (!body.clientName) {
        return res.status(400).json({ message: "Client name is required" });
      }

      const project = await templateService.applyTemplate(
        templateId,
        userId,
        body.clientName,
        body.clientEmail,
        body.projectName
      );

      res.status(201).json(project);
    } catch (error: any) {
      console.error("Error applying template:", error);
      if (error.message === "Template not found") {
        return res.status(404).json({ message: error.message });
      }
      if (error.message === "You don't have permission to use this template") {
        return res.status(403).json({ message: error.message });
      }
      res.status(500).json({ message: "Failed to apply template" });
    }
  },
};
