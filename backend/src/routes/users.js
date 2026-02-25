import express from 'express';
import { getEmployees, getProfile, updateProfile, updatePassword } from '../controllers/userController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/employees', getEmployees);
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/change-password', updatePassword);

export default router;
