import { Router } from 'express';
import authRoutes from './modules/auth/routes';
import projectRoutes from './modules/projects/routes';
import messagingRoutes from './modules/messaging/routes';
import clientRoutes from './modules/client/routes';
import fileRoutes from './modules/files/routes';

const router = Router();

// Mount modules
router.use("/auth", authRoutes);
router.use("/projects", projectRoutes);
// messagingRoutes handles /projects/:projectId/messages and /messages/recent
// so we mount it at root level relative to /api
router.use("/", messagingRoutes);
router.use("/client", clientRoutes);
router.use("/files", fileRoutes);

export default router;
