import { Request, Response } from 'express';
import { projectService, deliverableService, messageService, invoiceService, feedbackService } from '../services';
import { insertProjectSchema } from '@shared/schema';

export class ProjectController {
  async createProject(req: Request, res: Response) {
    try {
      const userId = (req.user as any).claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const projectData = insertProjectSchema.parse({
        ...req.body,
        freelancerId: userId,
      });

      const project = await projectService.createProject(projectData);
      res.status(201).json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(500).json({ message: "Failed to create project" });
    }
  }

  async getProjects(req: Request, res: Response) {
    try {
      const userId = (req.user as any).claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const projects = await projectService.getProjectsByFreelancer(userId);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  }

  async getProject(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const project = await projectService.getProjectById(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Get related data
      const [deliverables, messages, invoices, feedback] = await Promise.all([
        deliverableService.getDeliverablesByProject(projectId),
        messageService.getMessagesByProject(projectId),
        invoiceService.getInvoicesByProject(projectId),
        feedbackService.getFeedbackByProject(projectId),
      ]);

      res.json({
        project,
        deliverables,
        messages,
        invoices,
        feedback,
      });
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  }

  async updateProject(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const updates = req.body;

      const project = await projectService.updateProject(projectId, updates);
      res.json(project);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({ message: "Failed to update project" });
    }
  }

  async regenerateShareToken(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const userId = (req.user as any).claims?.sub;

      const project = await projectService.regenerateShareToken(projectId, userId);
      res.json(project);
    } catch (error) {
      console.error("Error regenerating share token:", error);
      res.status(500).json({ message: "Failed to regenerate share token" });
    }
  }
}

export const projectController = new ProjectController();