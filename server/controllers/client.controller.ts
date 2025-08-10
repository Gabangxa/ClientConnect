import { Request, Response } from 'express';
import { projectService, deliverableService, messageService, invoiceService, feedbackService } from '../services';
import { insertMessageSchema, insertFeedbackSchema } from '@shared/schema';

export class ClientController {
  async getClientPortalData(req: Request, res: Response) {
    try {
      const { shareToken } = req.params;
      const project = (req as any).project; // Set by middleware

      // Get related data
      const [deliverables, messages, invoices, feedback] = await Promise.all([
        deliverableService.getDeliverablesByProject(project.id),
        messageService.getMessagesByProject(project.id),
        invoiceService.getInvoicesByProject(project.id),
        feedbackService.getFeedbackByProject(project.id),
      ]);

      // Log access
      await projectService.logAccess({
        projectId: project.id,
        accessType: 'view',
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        shareToken: shareToken,
      });

      // Update project access timestamp
      await projectService.updateProjectAccess(project.id);

      res.json({
        project,
        deliverables,
        messages,
        invoices,
        feedback,
      });
    } catch (error) {
      console.error("Error fetching client portal data:", error);
      res.status(500).json({ message: "Failed to fetch project data" });
    }
  }

  async sendMessage(req: Request, res: Response) {
    try {
      const { shareToken } = req.params;
      const project = (req as any).project; // Set by middleware
      const clientName = req.body.clientName || project.clientName;

      const messageData = insertMessageSchema.parse({
        projectId: project.id,
        senderName: clientName,
        senderType: 'client',
        content: req.body.content,
        parentMessageId: req.body.parentMessageId,
        threadId: req.body.threadId,
        messageType: req.body.messageType || 'text',
        priority: req.body.priority || 'normal',
        status: 'sent'
      });

      const message = await messageService.createMessage(messageData);
      res.status(201).json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  }

  async submitFeedback(req: Request, res: Response) {
    try {
      const { shareToken } = req.params;
      const project = (req as any).project; // Set by middleware

      const feedbackData = insertFeedbackSchema.parse({
        projectId: project.id,
        clientName: req.body.clientName || project.clientName,
        rating: req.body.rating,
        comment: req.body.comment,
      });

      const newFeedback = await feedbackService.createFeedback(feedbackData);
      res.status(201).json(newFeedback);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      res.status(500).json({ message: "Failed to submit feedback" });
    }
  }
}

export const clientController = new ClientController();