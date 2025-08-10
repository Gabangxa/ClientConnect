import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Import controllers
import {
  authController,
  projectController,
  clientController,
  deliverableController,
  messageController,
  invoiceController,
  feedbackController,
} from '../controllers';

// Import middlewares
import {
  isAuthenticated,
  withProjectAccess,
  validateBody,
  errorHandler,
  notFoundHandler,
  requestLogger,
} from '../middlewares';

const router = express.Router();

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

// Apply request logging to all routes
router.use(requestLogger);

// Authentication routes
router.get('/api/auth/user', authController.getCurrentUser);
router.post('/api/auth/logout', authController.logout);

// Freelancer routes (authenticated)
router.post('/api/projects', isAuthenticated, projectController.createProject);
router.get('/api/projects', isAuthenticated, projectController.getProjects);
router.get('/api/projects/:projectId', isAuthenticated, withProjectAccess('freelancer'), projectController.getProject);
router.put('/api/projects/:projectId', isAuthenticated, withProjectAccess('freelancer'), projectController.updateProject);
router.post('/api/projects/:projectId/regenerate-token', isAuthenticated, withProjectAccess('freelancer'), projectController.regenerateShareToken);

// Deliverable routes (freelancer)
router.post('/api/projects/:projectId/deliverables', isAuthenticated, withProjectAccess('freelancer'), upload.single('file'), deliverableController.uploadDeliverable);
router.get('/api/projects/:projectId/deliverables', isAuthenticated, withProjectAccess('freelancer'), deliverableController.getDeliverables);
router.delete('/api/deliverables/:deliverableId', isAuthenticated, deliverableController.deleteDeliverable);

// Message routes (freelancer)
router.post('/api/projects/:projectId/messages', isAuthenticated, withProjectAccess('freelancer'), messageController.sendMessage);
router.get('/api/projects/:projectId/messages', isAuthenticated, withProjectAccess('freelancer'), messageController.getMessages);
router.get('/api/messages/recent', isAuthenticated, messageController.getRecentMessages);
router.post('/api/projects/:projectId/messages/mark-read', isAuthenticated, withProjectAccess('freelancer'), messageController.markAsRead);

// Invoice routes (freelancer)
router.post('/api/projects/:projectId/invoices', isAuthenticated, withProjectAccess('freelancer'), invoiceController.createInvoice);
router.get('/api/projects/:projectId/invoices', isAuthenticated, withProjectAccess('freelancer'), invoiceController.getInvoices);
router.get('/api/invoices/:invoiceId', isAuthenticated, invoiceController.getInvoice);
router.put('/api/invoices/:invoiceId', isAuthenticated, invoiceController.updateInvoice);
router.post('/api/invoices/:invoiceId/mark-paid', isAuthenticated, invoiceController.markAsPaid);

// Feedback routes (freelancer)
router.get('/api/projects/:projectId/feedback', isAuthenticated, withProjectAccess('freelancer'), feedbackController.getFeedback);
router.get('/api/projects/:projectId/feedback/stats', isAuthenticated, withProjectAccess('freelancer'), feedbackController.getFeedbackStats);

// Client portal routes (token-based access)
router.get('/api/client/:shareToken', withProjectAccess('client'), clientController.getClientPortalData);
router.post('/api/client/:shareToken/messages', withProjectAccess('client'), clientController.sendMessage);
router.post('/api/client/:shareToken/feedback', withProjectAccess('client'), clientController.submitFeedback);

// Client deliverable routes
router.post('/api/client/:shareToken/deliverables', withProjectAccess('client'), upload.single('file'), deliverableController.uploadClientDeliverable);
router.delete('/api/client/:shareToken/deliverables/:deliverableId', withProjectAccess('client'), deliverableController.deleteClientDeliverable);

// File download route
router.get('/api/files/:filename', (req, res) => {
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

// Error handling
router.use(notFoundHandler);
router.use(errorHandler);

export default router;