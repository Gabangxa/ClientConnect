import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertProjectSchema, insertDeliverableSchema, insertMessageSchema, insertInvoiceSchema, insertFeedbackSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Permission middleware to determine user role and capabilities
const withProjectAccess = (requiredRole?: 'freelancer' | 'client') => {
  return async (req: any, res: any, next: any) => {
    try {
      const { projectId, shareToken } = req.params;
      let userRole = 'guest';
      let project = null;

      // Check if user is authenticated (freelancer)
      if (req.isAuthenticated?.() && req.user?.claims?.sub) {
        const userId = req.user.claims.sub;
        
        if (projectId) {
          // Get project and check if user is the freelancer
          const projects = await storage.getProjectsByFreelancer(userId);
          project = projects.find(p => p.id === projectId);
          if (project) {
            userRole = 'freelancer';
          }
        }
      }

      // Check if accessing via share token (client)
      if (shareToken && userRole === 'guest') {
        const validation = await storage.validateShareToken(shareToken);
        if (validation.valid) {
          project = validation.project;
          userRole = 'client';
        }
      }

      // Validate required role
      if (requiredRole && userRole !== requiredRole) {
        return res.status(403).json({ 
          message: `Access denied. Required role: ${requiredRole}, current: ${userRole}` 
        });
      }

      // Attach context to request
      req.userRole = userRole;
      req.project = project;
      req.userId = req.user?.claims?.sub;

      next();
    } catch (error) {
      console.error("Error in permission middleware:", error);
      res.status(500).json({ message: "Permission check failed" });
    }
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Update user profile
  app.patch('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const updates = req.body;
      const user = await storage.upsertUser({ id: userId, ...updates });
      res.json(user);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Project routes
  app.post('/api/projects', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projectData = insertProjectSchema.parse({
        ...req.body,
        freelancerId: userId,
      });
      const project = await storage.createProject(projectData);
      res.json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.get('/api/projects', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projects = await storage.getProjectsByFreelancer(userId);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  // Get single project for authenticated freelancer
  app.get('/api/projects/:projectId', isAuthenticated, withProjectAccess('freelancer'), async (req: any, res) => {
    try {
      res.json(req.project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  // Get recent messages for freelancer
  app.get('/api/messages/recent', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const messages = await storage.getRecentMessagesForFreelancer(userId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching recent messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.patch('/api/projects/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const project = await storage.updateProject(id, updates);
      res.json(project);
    } catch (error) {
      console.error("Error updating project:", error);
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  // Regenerate share token for project
  app.post('/api/projects/:id/regenerate-token', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.claims.sub;
      const project = await storage.regenerateShareToken(id, userId);
      res.json(project);
    } catch (error) {
      console.error("Error regenerating share token:", error);
      res.status(500).json({ message: "Failed to regenerate share token" });
    }
  });

  // Client portal route with security validation
  app.get('/api/client/:shareToken', async (req, res) => {
    try {
      const { shareToken } = req.params;
      
      // Validate share token and check expiration
      const validation = await storage.validateShareToken(shareToken);
      
      if (!validation.valid) {
        return res.status(401).json({ 
          message: validation.project ? "Share link has expired" : "Invalid share link" 
        });
      }

      const project = validation.project!;

      // Log client access
      await storage.logAccess({
        projectId: project.id,
        shareToken,
        clientIp: req.ip || req.connection.remoteAddress || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
      });

      // Update project access tracking
      await storage.updateProjectAccess(project.id);

      const [deliverables, messages, invoices, feedbackList] = await Promise.all([
        storage.getDeliverablesByProject(project.id),
        storage.getMessagesByProject(project.id),
        storage.getInvoicesByProject(project.id),
        storage.getFeedbackByProject(project.id),
      ]);

      res.json({
        project,
        deliverables,
        messages,
        invoices,
        feedback: feedbackList,
      });
    } catch (error) {
      console.error("Error fetching client portal data:", error);
      res.status(500).json({ message: "Failed to fetch project data" });
    }
  });

  // Freelancer deliverable upload (authenticated)
  app.post('/api/projects/:projectId/deliverables', isAuthenticated, withProjectAccess('freelancer'), upload.single('file'), async (req: any, res) => {
    try {
      const { projectId } = req.params;
      const file = req.file;
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
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

      const deliverable = await storage.createDeliverable(deliverableData);
      res.json(deliverable);
    } catch (error) {
      console.error("Error creating deliverable:", error);
      res.status(500).json({ message: "Failed to create deliverable" });
    }
  });

  // Client deliverable upload (via share token)
  app.post('/api/client/:shareToken/deliverables', withProjectAccess('client'), upload.single('file'), async (req: any, res) => {
    try {
      const project = req.project;
      const file = req.file;
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
        uploaderId: req.params.shareToken, // Use share token as client identifier
        uploaderType: 'client',
        uploaderName: clientName,
      });

      const deliverable = await storage.createDeliverable(deliverableData);
      res.json(deliverable);
    } catch (error) {
      console.error("Error creating client deliverable:", error);
      res.status(500).json({ message: "Failed to create deliverable" });
    }
  });

  // Get deliverables for a project
  app.get('/api/projects/:projectId/deliverables', isAuthenticated, withProjectAccess('freelancer'), async (req, res) => {
    try {
      const { projectId } = req.params;
      const deliverables = await storage.getDeliverablesByProject(projectId);
      res.json(deliverables);
    } catch (error) {
      console.error("Error fetching deliverables:", error);
      res.status(500).json({ message: "Failed to fetch deliverables" });
    }
  });

  // Delete deliverable (only by original uploader)
  app.delete('/api/deliverables/:deliverableId', async (req: any, res) => {
    try {
      const { deliverableId } = req.params;
      const canDelete = await storage.canDeleteDeliverable(deliverableId, req.user?.claims?.sub);
      
      if (!canDelete) {
        return res.status(403).json({ 
          message: "Only the original uploader can delete this file" 
        });
      }

      await storage.deleteDeliverable(deliverableId);
      res.json({ message: "Deliverable deleted successfully" });
    } catch (error) {
      console.error("Error deleting deliverable:", error);
      res.status(500).json({ message: "Failed to delete deliverable" });
    }
  });

  // Client delete deliverable (via share token)
  app.delete('/api/client/:shareToken/deliverables/:deliverableId', withProjectAccess('client'), async (req: any, res) => {
    try {
      const { deliverableId, shareToken } = req.params;
      const canDelete = await storage.canDeleteDeliverable(deliverableId, shareToken, 'client');
      
      if (!canDelete) {
        return res.status(403).json({ 
          message: "Only the original uploader can delete this file" 
        });
      }

      await storage.deleteDeliverable(deliverableId);
      res.json({ message: "Deliverable deleted successfully" });
    } catch (error) {
      console.error("Error deleting deliverable:", error);
      res.status(500).json({ message: "Failed to delete deliverable" });
    }
  });

  // Freelancer message routes (authenticated)
  app.post('/api/projects/:projectId/messages', isAuthenticated, withProjectAccess('freelancer'), async (req: any, res) => {
    try {
      const { projectId } = req.params;
      const user = await storage.getUser(req.user.claims.sub);
      
      const messageData = insertMessageSchema.parse({
        projectId,
        senderName: user?.firstName || user?.email || 'Freelancer',
        senderType: 'freelancer',
        content: req.body.content,
        isRead: false,
      });

      const message = await storage.createMessage(messageData);
      res.json(message);
    } catch (error) {
      console.error("Error creating freelancer message:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  // Get messages for a project
  app.get('/api/projects/:projectId/messages', isAuthenticated, withProjectAccess('freelancer'), async (req, res) => {
    try {
      const { projectId } = req.params;
      const messages = await storage.getMessagesByProject(projectId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Client message routes (via share token)
  app.post('/api/client/:shareToken/messages', withProjectAccess('client'), async (req: any, res) => {
    try {
      const project = req.project;
      
      const messageData = insertMessageSchema.parse({
        projectId: project.id,
        senderName: req.body.senderName || project.clientName,
        senderType: 'client',
        content: req.body.content,
        isRead: false,
      });

      const message = await storage.createMessage(messageData);
      res.json(message);
    } catch (error) {
      console.error("Error creating client message:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  app.get('/api/client/:shareToken/messages', withProjectAccess('client'), async (req: any, res) => {
    try {
      const project = req.project;
      const messages = await storage.getMessagesByProject(project.id);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching client messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Invoice routes (freelancer only for create/edit)
  app.post('/api/projects/:projectId/invoices', isAuthenticated, withProjectAccess('freelancer'), upload.single('file'), async (req: any, res) => {
    try {
      const { projectId } = req.params;
      const file = req.file;
      
      const invoiceData = insertInvoiceSchema.parse({
        projectId,
        invoiceNumber: req.body.invoiceNumber,
        amount: parseInt(req.body.amount),
        description: req.body.description,
        status: req.body.status || 'pending',
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
        filePath: file?.path,
      });

      const invoice = await storage.createInvoice(invoiceData);
      res.json(invoice);
    } catch (error) {
      console.error("Error creating invoice:", error);
      res.status(500).json({ message: "Failed to create invoice" });
    }
  });

  // Get invoices for a project
  app.get('/api/projects/:projectId/invoices', isAuthenticated, withProjectAccess('freelancer'), async (req, res) => {
    try {
      const { projectId } = req.params;
      const invoices = await storage.getInvoicesByProject(projectId);
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  // Client invoice viewing (read-only via share token)
  app.get('/api/client/:shareToken/invoices', withProjectAccess('client'), async (req: any, res) => {
    try {
      const project = req.project;
      const invoices = await storage.getInvoicesByProject(project.id);
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching client invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.patch('/api/invoices/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      
      // Verify freelancer owns the project containing this invoice
      const invoice = await storage.getInvoiceById(id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      const projects = await storage.getProjectsByFreelancer(req.user.claims.sub);
      const ownsProject = projects.some(p => p.id === invoice.projectId);
      
      if (!ownsProject) {
        return res.status(403).json({ message: "Access denied: Not your project" });
      }

      const updates = req.body;
      const updatedInvoice = await storage.updateInvoice(id, updates);
      res.json(updatedInvoice);
    } catch (error) {
      console.error("Error updating invoice:", error);
      res.status(500).json({ message: "Failed to update invoice" });
    }
  });

  // Feedback routes (clients can create, both can view)
  app.post('/api/client/:shareToken/feedback', withProjectAccess('client'), async (req: any, res) => {
    try {
      const project = req.project;
      const feedbackData = insertFeedbackSchema.parse({
        projectId: project.id,
        clientName: req.body.clientName || project.clientName,
        rating: req.body.rating,
        comment: req.body.comment,
        isPublic: req.body.isPublic || false,
      });

      const feedbackItem = await storage.createFeedback(feedbackData);
      res.json(feedbackItem);
    } catch (error) {
      console.error("Error creating client feedback:", error);
      res.status(500).json({ message: "Failed to create feedback" });
    }
  });

  // Get feedback for a project
  app.get('/api/projects/:projectId/feedback', isAuthenticated, withProjectAccess('freelancer'), async (req, res) => {
    try {
      const { projectId } = req.params;
      const feedbackList = await storage.getFeedbackByProject(projectId);
      res.json(feedbackList);
    } catch (error) {
      console.error("Error fetching feedback:", error);
      res.status(500).json({ message: "Failed to fetch feedback" });
    }
  });

  app.get('/api/client/:shareToken/feedback', withProjectAccess('client'), async (req: any, res) => {
    try {
      const project = req.project;
      const feedbackList = await storage.getFeedbackByProject(project.id);
      res.json(feedbackList);
    } catch (error) {
      console.error("Error fetching client feedback:", error);
      res.status(500).json({ message: "Failed to fetch feedback" });
    }
  });

  // File download route
  app.get('/api/files/:filename', (req, res) => {
    try {
      const { filename } = req.params;
      const filePath = path.join(uploadDir, filename);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "File not found" });
      }

      res.download(filePath);
    } catch (error) {
      console.error("Error downloading file:", error);
      res.status(500).json({ message: "Failed to download file" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
