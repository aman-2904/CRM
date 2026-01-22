import express from 'express';
import {
    getLeadReport,
    getSalesReport,
    getEmployeeReport
} from '../controllers/reportsController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/leads', getLeadReport);
router.get('/sales', getSalesReport);
router.get('/employees', getEmployeeReport);

export default router;
