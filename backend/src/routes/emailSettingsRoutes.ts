import express from 'express';
import { getEmailSettings } from '../controllers/mailSettingsController';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = express.Router();

router.use(authenticateJWT);

router.get('/email-sender', getEmailSettings);

export default router;