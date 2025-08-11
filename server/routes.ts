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
} from "./controllers";

import { storageService } from "./services";

import {
  withProjectAccess,
  errorHandler,
  notFoundHandler,
  validateBody,
  validateParams,
  validateQuery,
} from "./middlewares";

import { 
  rateLimiters, 
  validateFileUpload, 
  bruteForceProtection, 
  secureHeaders 
} from "./middlewares/security.middleware";

import { 
  generateJWTForClient, 
  verifyJWTToken, 
  refreshToken, 
  hybridClientAuth 
} from "./middlewares/jwt.middleware";

import {
  createProjectBodySchema,
  updateProjectBodySchema,
  createMessageBodySchema,
  createInvoiceBodySchema,
  submitFeedbackBodySchema,
  projectParamsSchema,
  shareTokenParamsSchema,
  deliverableParamsSchema,
  invoiceParamsSchema,
  createDeliverableBodySchema,
} from "./validation/schemas";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Enhanced secure file upload configuration
const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5, // Max 5 files per upload
    fieldSize: 1024 * 1024, // 1MB field size limit
  },
  fileFilter: (req, file, cb) => {
    // Basic MIME type check (middleware will do comprehensive validation)
    const allowedMimes = [
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'audio/mpeg', 'audio/wav',
      'application/zip', 'text/plain'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`MIME type ${file.mimetype} not allowed`));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  const server = createServer(app);
  
  // Apply global security middleware
  app.use(secureHeaders);
  app.use(rateLimiters.global);
  
  await setupAuth(app);

  // Authentication routes with brute force protection
  app.get("/api/auth/user", authController.getCurrentUser);
  app.post("/api/auth/logout", authController.logout);
  app.get("/api/auth/status", authController.checkAuthStatus);
  
  // JWT token routes for client access
  app.post("/api/auth/client-token/:shareToken", 
    withProjectAccess('client'), 
    generateJWTForClient
  );
  app.post("/api/auth/refresh-token", refreshToken);
  
  // Note: Login protection is handled in replitAuth middleware

  // Freelancer routes (authenticated)
  app.post("/api/projects", 
    isAuthenticated, 
    validateBody(createProjectBodySchema), 
    projectController.createProject
  );
  app.get("/api/projects", isAuthenticated, projectController.getProjects);
  app.get("/api/projects/:projectId", 
    isAuthenticated, 
    validateParams(projectParamsSchema),
    withProjectAccess('freelancer'), 
    projectController.getProject
  );
  app.put("/api/projects/:projectId", 
    isAuthenticated, 
    validateParams(projectParamsSchema),
    validateBody(updateProjectBodySchema),
    withProjectAccess('freelancer'), 
    projectController.updateProject
  );
  app.post("/api/projects/:projectId/regenerate-token", 
    isAuthenticated, 
    validateParams(projectParamsSchema),
    withProjectAccess('freelancer'), 
    projectController.regenerateShareToken
  );

  // Deliverable routes (freelancer) with file upload security
  app.post("/api/projects/:projectId/deliverables", 
    rateLimiters.fileUpload,
    isAuthenticated, 
    withProjectAccess('freelancer'), 
    upload.single('file'), 
    validateFileUpload,
    deliverableController.uploadDeliverable
  );
  app.get("/api/projects/:projectId/deliverables", isAuthenticated, withProjectAccess('freelancer'), deliverableController.getDeliverables);
  app.delete("/api/deliverables/:deliverableId", isAuthenticated, deliverableController.deleteDeliverable);

  // Message routes (freelancer) with rate limiting
  app.post("/api/projects/:projectId/messages", 
    rateLimiters.messaging,
    isAuthenticated, 
    validateParams(projectParamsSchema),
    validateBody(createMessageBodySchema),
    withProjectAccess('freelancer'), 
    messageController.sendMessage
  );
  app.get("/api/projects/:projectId/messages", 
    isAuthenticated, 
    validateParams(projectParamsSchema),
    withProjectAccess('freelancer'), 
    messageController.getMessages
  );
  app.get("/api/messages/recent", isAuthenticated, messageController.getRecentMessages);
  app.post("/api/projects/:projectId/messages/mark-read", 
    isAuthenticated, 
    validateParams(projectParamsSchema),
    withProjectAccess('freelancer'), 
    messageController.markAsRead
  );

  // Invoice routes (freelancer)
  app.post("/api/projects/:projectId/invoices", isAuthenticated, withProjectAccess('freelancer'), invoiceController.createInvoice);
  app.get("/api/projects/:projectId/invoices", isAuthenticated, withProjectAccess('freelancer'), invoiceController.getInvoices);
  app.get("/api/invoices/:invoiceId", isAuthenticated, invoiceController.getInvoice);
  app.put("/api/invoices/:invoiceId", isAuthenticated, invoiceController.updateInvoice);
  app.post("/api/invoices/:invoiceId/mark-paid", isAuthenticated, invoiceController.markAsPaid);

  // Feedback routes (freelancer)
  app.get("/api/projects/:projectId/feedback", isAuthenticated, withProjectAccess('freelancer'), feedbackController.getFeedback);
  app.get("/api/projects/:projectId/feedback/stats", isAuthenticated, withProjectAccess('freelancer'), feedbackController.getFeedbackStats);

  // Client portal routes (token-based access) with security
  app.get("/api/client/:shareToken", withProjectAccess('client'), clientController.getClientPortalData);
  app.post("/api/client/:shareToken/messages", 
    rateLimiters.messaging,
    withProjectAccess('client'), 
    clientController.sendMessage
  );
  app.post("/api/client/:shareToken/feedback", 
    withProjectAccess('client'), 
    clientController.submitFeedback
  );

  // Client deliverable routes with file upload security
  app.post("/api/client/:shareToken/deliverables", 
    rateLimiters.fileUpload,
    withProjectAccess('client'), 
    upload.single('file'), 
    validateFileUpload,
    deliverableController.uploadClientDeliverable
  );
  app.delete("/api/client/:shareToken/deliverables/:deliverableId", 
    withProjectAccess('client'), 
    deliverableController.deleteClientDeliverable
  );

  // File download route for object storage
  app.get("/api/files/download/:filePath(*)", async (req, res) => {
    try {
      const filePath = decodeURIComponent(req.params.filePath);
      
      const fileBuffer = await storageService.downloadFile(filePath);
      
      // Get original filename from path
      const fileName = filePath.split('/').pop() || 'download';
      
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Type', 'application/octet-stream');
      res.send(fileBuffer);
    } catch (error) {
      console.error("Error downloading file:", error);
      res.status(404).json({ message: "File not found" });
    }
  });

  // Legacy file download route (for existing local files)
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

  // Note: Error handling is done in main server file to not interfere with Vite
  return server;
}