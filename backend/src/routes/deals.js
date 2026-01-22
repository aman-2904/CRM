import express from 'express';
import {
    createDeal,
    getDeals,
    getDealStats,
    updateDeal,
    deleteDeal
} from '../controllers/dealController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/', createDeal);
router.get('/', getDeals);
router.get('/stats', getDealStats);
router.put('/:id', updateDeal);
router.delete('/:id', deleteDeal);

export default router;
