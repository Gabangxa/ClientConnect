import { Router } from 'express';
import { projectController, deliverableController, invoiceController, feedbackController } from '../../controllers';
import { isAuthenticated, withProjectAccess } from '../../middlewares';
import { validateBody, validateParams } from '../../middlewares';
import { createProjectBodySchema, updateProjectBodySchema, projectParamsSchema } from '../../validation/schemas';
import { rateLimiters, validateFileUpload } from '../../middlewares/security.middleware';
import multer from 'multer';

const router = Router();
const upload = multer({ dest: 'uploads/' }); // We will enhance this later in Step 4

// Project routes
router.post("/",
  isAuthenticated,
  validateBody(createProjectBodySchema),
  projectController.createProject
);

router.get("/",
  isAuthenticated,
  projectController.getProjects
);

router.get("/:projectId",
  isAuthenticated,
  validateParams(projectParamsSchema),
  withProjectAccess('freelancer'),
  projectController.getProject
);

router.put("/:projectId",
  isAuthenticated,
  validateParams(projectParamsSchema),
  validateBody(updateProjectBodySchema),
  withProjectAccess('freelancer'),
  projectController.updateProject
);

router.post("/:projectId/regenerate-token",
  isAuthenticated,
  validateParams(projectParamsSchema),
  withProjectAccess('freelancer'),
  projectController.regenerateShareToken
);

router.delete("/:projectId",
  isAuthenticated,
  validateParams(projectParamsSchema),
  projectController.deleteProject
);

// Deliverables (sub-resource of projects)
router.post("/:projectId/deliverables",
  rateLimiters.fileUpload,
  isAuthenticated,
  withProjectAccess('freelancer'),
  upload.single('file'),
  validateFileUpload,
  deliverableController.uploadDeliverable
);

router.get("/:projectId/deliverables",
  isAuthenticated,
  withProjectAccess('freelancer'),
  deliverableController.getDeliverables
);

// Invoices (sub-resource of projects)
router.post("/:projectId/invoices",
  isAuthenticated,
  withProjectAccess('freelancer'),
  invoiceController.createInvoice
);

router.get("/:projectId/invoices",
  isAuthenticated,
  withProjectAccess('freelancer'),
  invoiceController.getInvoices
);

// Feedback (sub-resource of projects)
router.get("/:projectId/feedback",
  isAuthenticated,
  withProjectAccess('freelancer'),
  feedbackController.getFeedback
);

router.get("/:projectId/feedback/stats",
  isAuthenticated,
  withProjectAccess('freelancer'),
  feedbackController.getFeedbackStats
);

export default router;
