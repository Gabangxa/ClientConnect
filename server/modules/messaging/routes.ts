import { Router } from 'express';
import { messageController } from '../../controllers';
import { isAuthenticated, withProjectAccess, validateParams } from '../../middlewares';
import { rateLimiters, validateFileUpload } from '../../middlewares/security.middleware';
import { projectParamsSchema } from '../../validation/schemas';
import multer from 'multer';

const router = Router();
const upload = multer({ dest: 'uploads/' });

// Message routes
router.post("/projects/:projectId/messages",
  rateLimiters.messaging,
  isAuthenticated,
  validateParams(projectParamsSchema),
  upload.array('attachments', 5),
  validateFileUpload,
  withProjectAccess('freelancer'),
  messageController.sendMessage
);

router.get("/projects/:projectId/messages",
  isAuthenticated,
  validateParams(projectParamsSchema),
  withProjectAccess('freelancer'),
  messageController.getMessages
);

router.get("/messages/recent",
  isAuthenticated,
  messageController.getRecentMessages
);

router.post("/projects/:projectId/messages/mark-read",
  isAuthenticated,
  validateParams(projectParamsSchema),
  withProjectAccess('freelancer'),
  messageController.markAsRead
);

router.post("/messages/:messageId/mark-read",
  isAuthenticated,
  messageController.markSingleMessageAsRead
);

router.get("/messages/attachments/:attachmentId/download",
  isAuthenticated,
  messageController.downloadAttachment
);

export default router;
