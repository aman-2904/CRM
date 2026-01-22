import express from 'express';
import { getEmployees } from '../controllers/userController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/employees', getEmployees);

export default router;
