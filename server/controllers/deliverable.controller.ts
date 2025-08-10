import { Request, Response } from 'express';
import { deliverableService, userService } from '../services';
import { insertDeliverableSchema } from '@shared/schema';

export class DeliverableController {
  async uploadDeliverable(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const file = (req as any).file;
      const userId = (req.user as any).claims.sub;
      const user = await userService.getUser(userId);
      
      const deliverableData = insertDeliverableSchema.parse({
        projectId,
        title: req.body.title,
        description: req.body.description,
        type: req.body.type || 'deliverable',
        filePath: file?.path,
        fileName: file?.originalname,
        fileSize: file?.size,
        mimeType: file?.mimetype,
        uploaderId: userId,
        uploaderType: 'freelancer',
        uploaderName: user?.firstName || user?.email || 'Freelancer',
      });

      const deliverable = await deliverableService.createDeliverable(deliverableData);
      res.status(201).json(deliverable);
    } catch (error) {
      console.error("Error creating deliverable:", error);
      res.status(500).json({ message: "Failed to create deliverable" });
    }
  }

  async uploadClientDeliverable(req: Request, res: Response) {
    try {
      const { shareToken } = req.params;
      const project = (req as any).project; // Set by middleware
      const file = (req as any).file;
      const clientName = req.body.clientName || project.clientName;
      
      const deliverableData = insertDeliverableSchema.parse({
        projectId: project.id,
        title: req.body.title,
        description: req.body.description,
        type: req.body.type || 'deliverable',
        filePath: file?.path,
        fileName: file?.originalname,
        fileSize: file?.size,
        mimeType: file?.mimetype,
        uploaderId: shareToken, // Use share token as client identifier
        uploaderType: 'client',
        uploaderName: clientName,
      });

      const deliverable = await deliverableService.createDeliverable(deliverableData);
      res.status(201).json(deliverable);
    } catch (error) {
      console.error("Error creating client deliverable:", error);
      res.status(500).json({ message: "Failed to create deliverable" });
    }
  }

  async getDeliverables(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const deliverables = await deliverableService.getDeliverablesByProject(projectId);
      res.json(deliverables);
    } catch (error) {
      console.error("Error fetching deliverables:", error);
      res.status(500).json({ message: "Failed to fetch deliverables" });
    }
  }

  async deleteDeliverable(req: Request, res: Response) {
    try {
      const { deliverableId } = req.params;
      const userId = (req.user as any)?.claims?.sub;
      
      const canDelete = await deliverableService.canDeleteDeliverable(deliverableId, userId);
      
      if (!canDelete) {
        return res.status(403).json({ 
          message: "Only the original uploader can delete this file" 
        });
      }

      await deliverableService.deleteDeliverable(deliverableId);
      res.json({ message: "Deliverable deleted successfully" });
    } catch (error) {
      console.error("Error deleting deliverable:", error);
      res.status(500).json({ message: "Failed to delete deliverable" });
    }
  }

  async deleteClientDeliverable(req: Request, res: Response) {
    try {
      const { deliverableId, shareToken } = req.params;
      
      const canDelete = await deliverableService.canDeleteDeliverable(deliverableId, shareToken, 'client');
      
      if (!canDelete) {
        return res.status(403).json({ 
          message: "Only the original uploader can delete this file" 
        });
      }

      await deliverableService.deleteDeliverable(deliverableId);
      res.json({ message: "Deliverable deleted successfully" });
    } catch (error) {
      console.error("Error deleting deliverable:", error);
      res.status(500).json({ message: "Failed to delete deliverable" });
    }
  }
}

export const deliverableController = new DeliverableController();