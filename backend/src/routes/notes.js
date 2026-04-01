import express from 'express';
import { getLeadNotes, createNote, deleteNote } from '../controllers/noteController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/leads/:leadId', getLeadNotes);
router.post('/', createNote);
router.delete('/:id', deleteNote);

export default router;
