import { Request, Response } from 'express';
import { feedbackService } from '../services';
import { insertFeedbackSchema } from '@shared/schema';

export class FeedbackController {
  async submitFeedback(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      
      const feedbackData = insertFeedbackSchema.parse({
        ...req.body,
        projectId,
      });

      const feedback = await feedbackService.createFeedback(feedbackData);
      res.status(201).json(feedback);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      res.status(500).json({ message: "Failed to submit feedback" });
    }
  }

  async getFeedback(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const feedback = await feedbackService.getFeedbackByProject(projectId);
      res.json(feedback);
    } catch (error) {
      console.error("Error fetching feedback:", error);
      res.status(500).json({ message: "Failed to fetch feedback" });
    }
  }

  async getFeedbackStats(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const stats = await feedbackService.getFeedbackStats(projectId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching feedback stats:", error);
      res.status(500).json({ message: "Failed to fetch feedback stats" });
    }
  }
}

export const feedbackController = new FeedbackController();