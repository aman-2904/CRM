import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import { getWorkflow, saveWorkflow, getDiscoveredSheets, runBulkAssignment, getUnassignedCount, runLeadRevoke, getAssignedCount } from '../controllers/workflowController.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getWorkflow);
router.post('/', saveWorkflow);
router.get('/discovered-sheets', getDiscoveredSheets);
router.post('/bulk-assign', runBulkAssignment);
router.get('/unassigned-count', getUnassignedCount);
router.post('/revoke', runLeadRevoke);
router.get('/assigned-count', getAssignedCount);

export default router;
