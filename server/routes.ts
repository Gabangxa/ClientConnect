import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, isAuthenticated } from "./replitAuth";
import multer from "multer";
import path from "path";
import fs from "fs";

// Import new layered architecture
import {
  authController,
  projectController,
  clientController,
  deliverableController,
  messageController,
  invoiceController,
  feedbackController,
  uploadController,
  jobsController,
} from "./controllers";

import {
  withProjectAccess,
  errorHandler,
  notFoundHandler,
  rateLimiter,
  authRateLimiter,
} from "./middlewares";

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
  const server = createServer(app);
  await setupAuth(app);

  // Apply rate limiting globally
  app.use(rateLimiter);

  // Authentication routes with stricter rate limiting
  app.get("/api/auth/user", authRateLimiter, authController.getCurrentUser);
  app.post("/api/auth/logout", authRateLimiter, authController.logout);

  // Freelancer routes (authenticated)
  app.post("/api/projects", isAuthenticated, projectController.createProject);
  app.get("/api/projects", isAuthenticated, projectController.getProjects);
  app.get("/api/projects/:projectId", isAuthenticated, withProjectAccess('freelancer'), projectController.getProject);
  app.put("/api/projects/:projectId", isAuthenticated, withProjectAccess('freelancer'), projectController.updateProject);
  app.post("/api/projects/:projectId/regenerate-token", isAuthenticated, withProjectAccess('freelancer'), projectController.regenerateShareToken);

  // Deliverable routes (freelancer)
  app.post("/api/projects/:projectId/deliverables", isAuthenticated, withProjectAccess('freelancer'), upload.single('file'), deliverableController.uploadDeliverable);
  app.get("/api/projects/:projectId/deliverables", isAuthenticated, withProjectAccess('freelancer'), deliverableController.getDeliverables);
  app.delete("/api/deliverables/:deliverableId", isAuthenticated, deliverableController.deleteDeliverable);

  // Message routes (freelancer)
  app.post("/api/projects/:projectId/messages", isAuthenticated, withProjectAccess('freelancer'), messageController.sendMessage);
  app.get("/api/projects/:projectId/messages", isAuthenticated, withProjectAccess('freelancer'), messageController.getMessages);
  app.get("/api/messages/recent", isAuthenticated, messageController.getRecentMessages);
  app.post("/api/projects/:projectId/messages/mark-read", isAuthenticated, withProjectAccess('freelancer'), messageController.markAsRead);

  // Invoice routes (freelancer)
  app.post("/api/projects/:projectId/invoices", isAuthenticated, withProjectAccess('freelancer'), invoiceController.createInvoice);
  app.get("/api/projects/:projectId/invoices", isAuthenticated, withProjectAccess('freelancer'), invoiceController.getInvoices);
  app.get("/api/invoices/:invoiceId", isAuthenticated, invoiceController.getInvoice);
  app.put("/api/invoices/:invoiceId", isAuthenticated, invoiceController.updateInvoice);
  app.post("/api/invoices/:invoiceId/mark-paid", isAuthenticated, invoiceController.markAsPaid);

  // Feedback routes (freelancer)
  app.get("/api/projects/:projectId/feedback", isAuthenticated, withProjectAccess('freelancer'), feedbackController.getFeedback);
  app.get("/api/projects/:projectId/feedback/stats", isAuthenticated, withProjectAccess('freelancer'), feedbackController.getFeedbackStats);

  // Modern S3 upload routes (freelancer)
  app.post("/api/upload/signed-url", isAuthenticated, uploadController.generateUploadUrl);
  app.post("/api/upload/confirm", isAuthenticated, uploadController.confirmUpload);
  app.get("/api/download/:key", isAuthenticated, uploadController.generateDownloadUrl);

  // Background job management routes (freelancer only)
  app.get("/api/jobs/stats", isAuthenticated, jobsController.getQueueStats);
  app.post("/api/jobs/thumbnail", isAuthenticated, jobsController.createThumbnailJob);
  app.post("/api/jobs/email", isAuthenticated, jobsController.createEmailJob);
  app.post("/api/jobs/cleanup", isAuthenticated, jobsController.createCleanupJob);

  // Client portal routes (token-based access)
  app.get("/api/client/:shareToken", withProjectAccess('client'), clientController.getClientPortalData);
  app.post("/api/client/:shareToken/messages", withProjectAccess('client'), clientController.sendMessage);
  app.post("/api/client/:shareToken/feedback", withProjectAccess('client'), clientController.submitFeedback);

  // Client deliverable routes
  app.post("/api/client/:shareToken/deliverables", withProjectAccess('client'), upload.single('file'), deliverableController.uploadClientDeliverable);
  app.delete("/api/client/:shareToken/deliverables/:deliverableId", withProjectAccess('client'), deliverableController.deleteClientDeliverable);

  // File download route
  app.get("/api/files/:filename", (req, res) => {
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

  // Error handling only for API routes - don't interfere with frontend serving
  app.use('/api', notFoundHandler);
  app.use(errorHandler);

  return server;
}