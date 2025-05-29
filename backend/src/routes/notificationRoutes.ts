import express from 'express';
import { getUserNotifications, markAsRead, createTestNotification, clearAllNotifications } from '../controllers/notificationController';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = express.Router();

router.use(authenticateJWT);

router.get('/', getUserNotifications);

router.patch('/read', markAsRead);

router.post('/test', createTestNotification);

router.delete('/clear', clearAllNotifications);

export default router;