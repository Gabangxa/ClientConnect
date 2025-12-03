// Export all controllers for easy importing
import * as authFunctions from './auth.controller';
import { ProjectController } from './project.controller';
import { ClientController } from './client.controller';  
import { DeliverableController } from './deliverable.controller';
import { MessageController } from './message.controller';
import { InvoiceController } from './invoice.controller';
import { FeedbackController } from './feedback.controller';
import { templateController } from './template.controller';
import { analyticsController } from './analytics.controller';

// Re-export classes
export { ProjectController, ClientController, DeliverableController, MessageController, InvoiceController, FeedbackController };

// Create auth controller object from functions
export const authController = {
  getCurrentUser: authFunctions.getCurrentUser,
  logout: authFunctions.logout,
  checkAuthStatus: authFunctions.checkAuthStatus,
};

// Create controller instances for convenience
export const projectController = new ProjectController();
export const clientController = new ClientController();
export const deliverableController = new DeliverableController();
export const messageController = new MessageController();
export const invoiceController = new InvoiceController();
export const feedbackController = new FeedbackController();
export { templateController };
export { analyticsController };