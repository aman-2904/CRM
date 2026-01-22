import express from 'express';
import leadsRouter from './leads.js';

import usersRouter from './users.js';
import followupsRouter from './followups.js';
import dealsRouter from './deals.js';
import employeesRouter from './employees.js';
import reportsRouter from './reports.js';
import activitiesRouter from './activities.js';

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
    });
});

router.use('/leads', leadsRouter);
router.use('/users', usersRouter);
router.use('/followups', followupsRouter);
router.use('/deals', dealsRouter);
router.use('/employees', employeesRouter);
router.use('/reports', reportsRouter);
router.use('/activities', activitiesRouter);

export default router;
