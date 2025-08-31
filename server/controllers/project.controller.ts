/**
 * Project Controller
 * 
 * Manages all project-related operations in the client portal system.
 * Handles project creation, retrieval, updates, and management of project-specific
 * data including deliverables, messages, invoices, and feedback.
 * 
 * Features:
 * - Project CRUD operations
 * - Share token management
 * - Project access control
 * - Related data aggregation (deliverables, messages, etc.)
 * 
 * @module ProjectController
 */

import { Request, Response, NextFunction } from 'express';
import { projectService, deliverableService, messageService, invoiceService, feedbackService } from '../services';

/**
 * Controller class for handling project-related operations
 * All methods use centralized error handling via next(error)
 */
export class ProjectController {
  /**
   * Create a new project for a freelancer
   * 
   * Creates a new project with client information, generates share token,
   * and sets up initial project state. Validates user authentication and
   * input data before creation.
   * 
   * @param {Request} req - Express request with validated project data
   * @param {Response} res - Express response object
   * @param {NextFunction} next - Error handling middleware
   */
  async createProject(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any).claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Validation is now handled by middleware, so req.body is already validated
      const projectData = {
        ...req.body,
        freelancerId: userId,
      };

      const project = await projectService.createProject(projectData);
      res.status(201).json(project);
    } catch (error) {
      next(error); // Pass error to centralized error handler
    }
  }

  async getProjects(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req.user as any).claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const projects = await projectService.getProjectsByFreelancer(userId);
      res.json(projects);
    } catch (error) {
      next(error);
    }
  }

  async getProject(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params; // Already validated by middleware
      const project = await projectService.getProjectById(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Get related data
      const [deliverables, messages, invoices, feedback] = await Promise.all([
        deliverableService.getDeliverablesByProject(projectId),
        messageService.getMessagesWithAttachments(projectId),
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
      next(error);
    }
  }

  async updateProject(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params; // Already validated by middleware
      const updates = req.body; // Already validated by middleware

      const project = await projectService.updateProject(projectId, updates);
      res.json(project);
    } catch (error) {
      next(error);
    }
  }

  async regenerateShareToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { projectId } = req.params; // Already validated by middleware
      const userId = (req.user as any).claims?.sub;

      const project = await projectService.regenerateShareToken(projectId, userId);
      res.json(project);
    } catch (error) {
      next(error);
    }
  }
}

export const projectController = new ProjectController();