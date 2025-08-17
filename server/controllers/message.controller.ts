import { Request, Response } from 'express';
import { messageService } from '../services';
import { insertMessageSchema } from '@shared/schema';

export class MessageController {
  async sendMessage(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const userId = (req.user as any).claims?.sub;
      const user = (req.user as any);
      
      const messageData = insertMessageSchema.parse({
        projectId,
        senderName: user?.firstName || user?.email || 'Freelancer',
        senderType: 'freelancer',
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

  async getMessages(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const messages = await messageService.getMessagesByProject(projectId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  }

  async getRecentMessages(req: Request, res: Response) {
    try {
      const userId = (req.user as any).claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const messages = await messageService.getRecentMessagesForFreelancer(userId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching recent messages:", error);
      res.status(500).json({ message: "Failed to fetch recent messages" });
    }
  }

  async markAsRead(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const { senderType } = req.body;

      await messageService.markMessagesAsRead(projectId, senderType);
      res.json({ message: "Messages marked as read" });
    } catch (error) {
      console.error("Error marking messages as read:", error);
      res.status(500).json({ message: "Failed to mark messages as read" });
    }
  }

  async markSingleMessageAsRead(req: Request, res: Response) {
    try {
      const { messageId } = req.params;

      await messageService.markMessageAsRead(messageId);
      res.json({ message: "Message marked as read" });
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  }
}

export const messageController = new MessageController();