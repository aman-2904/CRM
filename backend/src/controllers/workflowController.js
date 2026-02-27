import supabase from '../config/supabase.js';
import {
    getWorkflowSettings,
    saveWorkflowSettings,
    bulkAssignLeads,
    getUnassignedLeadCount,
    revokeLeads,
    getAssignedLeadCount,
    purgeOldLeads
} from '../services/workflowService.js';

// GET /api/workflow
export const getWorkflow = async (req, res) => {
    try {
        const settings = await getWorkflowSettings();
        res.json({ success: true, data: settings });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// POST /api/workflow  (admin only)
export const saveWorkflow = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Admins only' });
        }
        const { auto_assign_enabled, distribution_type, rules, sheet_mappings } = req.body;
        const data = await saveWorkflowSettings({
            auto_assign_enabled,
            distribution_type,
            rules,
            sheet_mappings,
        });
        res.json({ success: true, data });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// GET /api/workflow/discovered-sheets
export const getDiscoveredSheets = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('leads')
            .select('source');

        if (error) throw error;

        // Filter for Google Sheet sources and extract the tab name
        const sheets = [...new Set(data
            .map(l => l.source)
            .filter(s => s && s.startsWith('Google Sheet:'))
            .map(s => s.replace('Google Sheet: ', '').trim())
        )];

        res.json({ success: true, data: sheets });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// POST /api/workflow/bulk-assign
export const runBulkAssignment = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Admins only' });
        }
        const { timeframe } = req.body;
        const count = await bulkAssignLeads(timeframe);
        res.json({ success: true, count });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// GET /api/workflow/unassigned-count
export const getUnassignedCount = async (req, res) => {
    try {
        const { timeframe } = req.query;
        const count = await getUnassignedLeadCount(timeframe || 'all');
        res.json({ success: true, count });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// POST /api/workflow/revoke
export const runLeadRevoke = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Admins only' });
        }
        const { timeframe, employeeId } = req.body;
        const count = await revokeLeads(timeframe, employeeId);
        res.json({ success: true, count });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// GET /api/workflow/assigned-count
export const getAssignedCount = async (req, res) => {
    try {
        const { timeframe, employeeId } = req.query;
        const count = await getAssignedLeadCount(timeframe || 'all', employeeId);
        res.json({ success: true, count });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// POST /api/workflow/purge-old-leads (admin only)
export const runLeadPurge = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'Admins only' });
        }
        const count = await purgeOldLeads();
        res.json({ success: true, count });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
