import { runSync, syncState } from '../services/sheetSyncService.js';
import authMiddleware from '../middleware/authMiddleware.js';

// POST /api/sheets/sync-now  (admin only)
export const syncNow = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Admins only' });
        }
        // Run in background — don't await so the response is instant
        runSync();
        res.json({ success: true, message: 'Sync started' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// GET /api/sheets/status
export const getSyncStatus = async (req, res) => {
    res.json({
        success: true,
        data: {
            lastSync: syncState.lastSync,
            lastSyncLeadsImported: syncState.lastSyncLeadsImported,
            totalImported: syncState.totalImported,
            isRunning: syncState.isRunning,
            lastError: syncState.lastError,
            syncEnabled: process.env.SHEET_SYNC_ENABLED === 'true',
            sheetConfigured: !!process.env.GOOGLE_SHEET_CSV_URL,
        }
    });
};
