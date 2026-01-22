import express from 'express';
import {
    getEmployees,
    updateEmployee,
    getRoles,
    getEmployeeStats,
    requireAdmin
} from '../controllers/employeeController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require auth + admin
router.use(authMiddleware);

router.get('/', getEmployees);
router.get('/roles', getRoles);
router.get('/:id/stats', getEmployeeStats);
router.put('/:id', updateEmployee);

export default router;
