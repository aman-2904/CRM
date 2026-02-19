import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { syncNow, getSyncStatus } from '../controllers/sheetSyncController.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/status', getSyncStatus);
router.post('/sync-now', syncNow);

export default router;
