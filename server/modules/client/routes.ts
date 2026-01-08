import { Router } from 'express';
import { clientController, messageController, deliverableController } from '../../controllers';
import { withProjectAccess } from '../../middlewares';
import { rateLimiters, validateFileUpload } from '../../middlewares/security.middleware';
import { generateJWTForClient } from '../../middlewares/jwt.middleware';
import multer from 'multer';

const router = Router();
const upload = multer({ dest: 'uploads/' });

// JWT Token
router.post("/auth/client-token/:shareToken",
  withProjectAccess('client'),
  generateJWTForClient
);

// Client Portal Data
router.get("/:shareToken",
  withProjectAccess('client'),
  clientController.getClientPortalData
);

// Messages
router.post("/:shareToken/messages",
  rateLimiters.messaging,
  withProjectAccess('client'),
  upload.array('attachments', 5),
  validateFileUpload,
  messageController.sendClientMessage
);

router.post("/:shareToken/messages/mark-read",
  withProjectAccess('client'),
  clientController.markMessagesAsRead
);

router.get("/:shareToken/messages/attachments/:attachmentId/download",
  withProjectAccess('client'),
  messageController.downloadAttachment
);

// Feedback
router.post("/:shareToken/feedback",
  withProjectAccess('client'),
  clientController.submitFeedback
);

// Deliverables
router.post("/:shareToken/deliverables",
  rateLimiters.fileUpload,
  withProjectAccess('client'),
  upload.single('file'),
  validateFileUpload,
  deliverableController.uploadClientDeliverable
);

router.delete("/:shareToken/deliverables/:deliverableId",
  withProjectAccess('client'),
  deliverableController.deleteClientDeliverable
);

export default router;
