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

  // Client portal route (no auth required)
  app.get('/api/client/:shareToken', async (req, res) => {
    try {
      const { shareToken } = req.params;
      const project = await storage.getProjectByShareToken(shareToken);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

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

  // Deliverable routes
  app.post('/api/projects/:projectId/deliverables', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      const { projectId } = req.params;
      const file = req.file;
      
      const deliverableData = insertDeliverableSchema.parse({
        projectId,
        title: req.body.title,
        description: req.body.description,
        type: req.body.type || 'deliverable',
        filePath: file?.path,
        fileName: file?.originalname,
        fileSize: file?.size,
        mimeType: file?.mimetype,
      });

      const deliverable = await storage.createDeliverable(deliverableData);
      res.json(deliverable);
    } catch (error) {
      console.error("Error creating deliverable:", error);
      res.status(500).json({ message: "Failed to create deliverable" });
    }
  });

  app.get('/api/projects/:projectId/deliverables', async (req, res) => {
    try {
      const { projectId } = req.params;
      const deliverables = await storage.getDeliverablesByProject(projectId);
      res.json(deliverables);
    } catch (error) {
      console.error("Error fetching deliverables:", error);
      res.status(500).json({ message: "Failed to fetch deliverables" });
    }
  });

  // Message routes
  app.post('/api/projects/:projectId/messages', async (req, res) => {
    try {
      const { projectId } = req.params;
      const messageData = insertMessageSchema.parse({
        projectId,
        ...req.body,
      });

      const message = await storage.createMessage(messageData);
      res.json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  app.get('/api/projects/:projectId/messages', async (req, res) => {
    try {
      const { projectId } = req.params;
      const messages = await storage.getMessagesByProject(projectId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Invoice routes
  app.post('/api/projects/:projectId/invoices', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      const { projectId } = req.params;
      const file = req.file;
      
      const invoiceData = insertInvoiceSchema.parse({
        projectId,
        invoiceNumber: req.body.invoiceNumber,
        amount: parseInt(req.body.amount),
        description: req.body.description,
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

  app.get('/api/projects/:projectId/invoices', async (req, res) => {
    try {
      const { projectId } = req.params;
      const invoices = await storage.getInvoicesByProject(projectId);
      res.json(invoices);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  // Feedback routes
  app.post('/api/projects/:projectId/feedback', async (req, res) => {
    try {
      const { projectId } = req.params;
      const feedbackData = insertFeedbackSchema.parse({
        projectId,
        ...req.body,
      });

      const feedbackItem = await storage.createFeedback(feedbackData);
      res.json(feedbackItem);
    } catch (error) {
      console.error("Error creating feedback:", error);
      res.status(500).json({ message: "Failed to create feedback" });
    }
  });

  app.get('/api/projects/:projectId/feedback', async (req, res) => {
    try {
      const { projectId } = req.params;
      const feedbackList = await storage.getFeedbackByProject(projectId);
      res.json(feedbackList);
    } catch (error) {
      console.error("Error fetching feedback:", error);
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
