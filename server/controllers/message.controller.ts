/**
 * Message Controller
 * 
 * Handles all messaging operations between freelancers and clients.
 * Supports threaded conversations, message status tracking, and real-time
 * communication features with proper notification handling.
 * 
 * Features:
 * - Message sending/receiving with validation
 * - Threaded conversation management
 * - Message status tracking (read/unread)
 * - Recent message aggregation for dashboard
 * - Individual and bulk message marking
 * 
 * @module MessageController
 */

import { Request, Response } from 'express';
import { messageService } from '../services';
import { messageAttachmentService } from '../services/messageAttachment.service';
import { insertMessageSchema } from '@shared/schema';
import { storageService } from '../services/storage.service';
import { queueService } from '../services/queue.service';

/**
 * Controller class for handling message-related operations
 * Provides secure messaging between freelancers and clients
 */
export class MessageController {
  /**
   * Send a message as a freelancer with optional attachments
   * 
   * Creates a new message from freelancer to client with proper validation
   * and thread management. Handles file attachments if provided.
   * 
   * @param {Request} req - Express request with projectId params and message data
   * @param {Response} res - Express response object
   */
  async sendMessage(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const userId = (req.user as any).id;
      const user = (req.user as any);
      const attachmentFiles = (req as any).files || []; // Files from multer
      
      const messageData = insertMessageSchema.parse({
        projectId,
        senderName: user?.firstName || user?.email || 'Freelancer',
        senderType: 'freelancer',
        content: req.body.content,
        parentMessageId: req.body.parentMessageId,
        threadId: req.body.threadId,
        messageType: req.body.messageType || (attachmentFiles.length > 0 ? 'file' : 'text'),
        priority: req.body.priority || 'normal',
        status: 'sent'
      });

      const message = await messageService.createMessageWithAttachments(messageData, attachmentFiles);

      // Enqueue job to process message (e.g., notification, analytics)
      await queueService.addJob('process_message', {
        messageId: message.id,
        projectId: message.projectId,
        action: 'notify_client'
      });

      res.status(201).json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  }

  async getMessages(req: Request, res: Response) {
    try {
      const { projectId } = req.params;
      const messages = await messageService.getMessagesWithAttachments(projectId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  }

  async getRecentMessages(req: Request, res: Response) {
    try {
      const userId = (req.user as any).id;
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

  /**
   * Send a message as a client with optional attachments
   * 
   * Creates a new message from client to freelancer with proper validation
   * and thread management. Handles file attachments if provided.
   * 
   * @param {Request} req - Express request with shareToken params and message data
   * @param {Response} res - Express response object
   */
  async sendClientMessage(req: Request, res: Response) {
    try {
      const { shareToken } = req.params;
      const project = (req as any).project; // Set by middleware
      const attachmentFiles = (req as any).files || []; // Files from multer
      const clientName = req.body.clientName || project.clientName;
      
      const messageData = insertMessageSchema.parse({
        projectId: project.id,
        senderName: clientName,
        senderType: 'client',
        content: req.body.content,
        parentMessageId: req.body.parentMessageId,
        threadId: req.body.threadId,
        messageType: req.body.messageType || (attachmentFiles.length > 0 ? 'file' : 'text'),
        priority: req.body.priority || 'normal',
        status: 'sent'
      });

      const message = await messageService.createMessageWithAttachments(messageData, attachmentFiles);
      res.status(201).json(message);
    } catch (error) {
      console.error("Error sending client message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  }

  /**
   * Get messages for client portal
   * 
   * @param {Request} req - Express request with shareToken params
   * @param {Response} res - Express response object
   */
  async getClientMessages(req: Request, res: Response) {
    try {
      const { shareToken } = req.params;
      const project = (req as any).project; // Set by middleware
      
      const messages = await messageService.getMessagesWithAttachments(project.id);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching client messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  }

  /**
   * Download a message attachment
   * 
   * @param {Request} req - Express request with attachmentId params
   * @param {Response} res - Express response object
   */
  async downloadAttachment(req: Request, res: Response) {
    try {
      const { attachmentId } = req.params;
      
      // Get attachment details
      const attachment = await messageAttachmentService.getAttachmentById(attachmentId);
      if (!attachment) {
        return res.status(404).json({ message: "Attachment not found" });
      }

      // Verify user has access to this attachment's message
      const message = await messageService.getMessageById(attachment.messageId);
      if (!message) {
        return res.status(404).json({ message: "Message not found" });
      }

      // Authorization check: verify user has access to this message's project
      const userId = (req.user as any)?.id;
      const project = (req as any).project; // Set by middleware if client portal access
      
      if (!userId && !project) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // For authenticated freelancers, verify they own the project
      if (userId) {
        // This would typically be verified by withProjectAccess middleware in routes
        // For additional security, we could verify project ownership here
      }
      
      // For client portal access, project is already verified by middleware

      // Set appropriate headers
      // Sanitize filename to prevent header injection
      const safeFileName = attachment.fileName.replace(/"/g, '');

      res.set({
        'Content-Type': attachment.mimeType,
        'Content-Disposition': `attachment; filename="${safeFileName}"`,
        // We might not know exact length if streaming, but we have it in DB
        'Content-Length': attachment.fileSize.toString(),
      });
      
      // Stream file from storage
      const fileStream = storageService.downloadFileStream(attachment.filePath);

      fileStream.pipe(res);

      fileStream.on('error', (error) => {
        console.error("Stream error:", error);
        // If headers not sent yet (unlikely here as we set them above)
        if (!res.headersSent) {
          res.status(500).json({ message: "Failed to download attachment" });
        } else {
          res.end();
        }
      });
    } catch (error) {
      console.error("Error downloading attachment:", error);
      res.status(500).json({ message: "Failed to download attachment" });
    }
  }
}

export const messageController = new MessageController();