import { Router } from 'express';
import { authenticateToken } from '../middlewares/authMiddleware';
import * as notificationController from '../controllers/notificationController';

const router = Router();

router.get('/', authenticateToken, notificationController.getMyNotifications);

export default router;
