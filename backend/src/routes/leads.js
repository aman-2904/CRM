import express from 'express';
import { createLead, getLeads, updateLead, deleteLead, getLeadHistory } from '../controllers/leadController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply auth middleware to all lead routes
router.use(authMiddleware);

router.get('/', getLeads);
router.post('/', createLead);
router.put('/:id', updateLead);
router.delete('/:id', deleteLead);
router.get('/:id/history', getLeadHistory);

export default router;
