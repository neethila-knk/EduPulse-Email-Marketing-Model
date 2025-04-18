// routes/notificationRoutes.ts
import express from 'express';
import { getUserNotifications, markAsRead, createTestNotification, clearAllNotifications } from '../controllers/notificationController';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateJWT);

// Get user notifications
router.get('/', getUserNotifications);

// Mark notifications as read
router.patch('/read', markAsRead);

// Test endpoint for creating notifications (remove in production)
router.post('/test', createTestNotification);

router.delete('/clear', clearAllNotifications);

export default router;