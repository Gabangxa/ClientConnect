import { Router } from 'express';
import { authController } from '../../controllers';

const router = Router();

router.get("/user", authController.getCurrentUser);
router.post("/logout", authController.logout);
router.get("/status", authController.checkAuthStatus);

export default router;
