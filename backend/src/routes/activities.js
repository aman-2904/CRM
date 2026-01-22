import express from 'express';
import { getActivities, logAuthEvent, getActivityStats } from '../controllers/activityController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getActivities);
router.get('/stats', getActivityStats);
router.post('/auth', logAuthEvent);

export default router;
