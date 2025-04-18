// src/routes/searchRoutes.ts
import express from 'express';
import { globalSearch } from '../controllers/searchController';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = express.Router();
router.use(authenticateJWT);
router.get('/', globalSearch);

export default router;

