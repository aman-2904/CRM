import express from 'express';
import {
    createFollowup,
    getFollowups,
    updateFollowup,
    deleteFollowup
} from '../controllers/followupController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/', createFollowup);
router.get('/', getFollowups);
router.put('/:id', updateFollowup);
router.delete('/:id', deleteFollowup);

export default router;
