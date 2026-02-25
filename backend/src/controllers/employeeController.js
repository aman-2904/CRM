import supabase from '../config/supabase.js';

// Admin-only middleware check
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, error: 'Admin access required' });
    }
    next();
};

export const getEmployees = async (req, res, next) => {
    try {
        // Get all profiles with their roles
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('*, roles(id, name)')
            .order('created_at', { ascending: false });

        if (profilesError) throw profilesError;

        // Get leads count per employee
        const { data: leadCounts, error: leadsError } = await supabase
            .from('leads')
            .select('assigned_to');

        if (leadsError) throw leadsError;

        // Get deals per employee
        const { data: deals, error: dealsError } = await supabase
            .from('deals')
            .select('owner_id, stage, amount');

        if (dealsError) throw dealsError;

        // Calculate performance for each employee
        const employeesWithStats = profiles.map(profile => {
            const assignedLeads = leadCounts.filter(l => l.assigned_to === profile.id).length;
            const employeeDeals = deals.filter(d => d.owner_id === profile.id);
            const wonDeals = employeeDeals.filter(d => d.stage === 'closed_won');
            const wonRevenue = wonDeals.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);
            const conversionRate = assignedLeads > 0 ? ((wonDeals.length / assignedLeads) * 100).toFixed(1) : 0;

            return {
                ...profile,
                role_name: profile.roles?.name || 'employee',
                stats: {
                    leads_handled: assignedLeads,
                    deals_closed: wonDeals.length,
                    total_deals: employeeDeals.length,
                    revenue: wonRevenue,
                    conversion_rate: parseFloat(conversionRate)
                }
            };
        });

        res.json({ success: true, data: employeesWithStats });
    } catch (error) {
        next(error);
    }
};

export const updateEmployee = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { role_id, is_active, full_name } = req.body;

        const updates = {};
        if (role_id !== undefined) updates.role_id = role_id;
        if (is_active !== undefined) updates.is_active = is_active;
        if (full_name !== undefined) updates.full_name = full_name;

        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', id)
            .select('*, roles(name)')
            .single();

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

export const getRoles = async (req, res, next) => {
    try {
        const { data, error } = await supabase
            .from('roles')
            .select('*')
            .order('name');

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

export const getEmployeeStats = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Get employee's leads
        const { data: leads, error: leadsError } = await supabase
            .from('leads')
            .select('id, status, created_at')
            .eq('assigned_to', id);

        if (leadsError) throw leadsError;

        // Get employee's deals
        const { data: deals, error: dealsError } = await supabase
            .from('deals')
            .select('id, stage, amount, created_at')
            .eq('owner_id', id);

        if (dealsError) throw dealsError;

        const wonDeals = deals.filter(d => d.stage === 'closed_won');
        const lostDeals = deals.filter(d => d.stage === 'closed_lost');

        res.json({
            success: true,
            data: {
                leads_total: leads.length,
                leads_converted: leads.filter(l => l.status === 'converted').length,
                deals_total: deals.length,
                deals_won: wonDeals.length,
                deals_lost: lostDeals.length,
                revenue: wonDeals.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0),
                conversion_rate: leads.length > 0 ? ((wonDeals.length / leads.length) * 100).toFixed(1) : 0
            }
        });
    } catch (error) {
        next(error);
    }
};

export const deleteEmployee = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ success: false, error: 'Admin password is required for verification.' });
        }

        // Prevent self-deletion
        if (id === req.user.id) {
            return res.status(400).json({ success: false, error: 'You cannot delete your own account.' });
        }

        // Verify admin password
        const { error: authError } = await supabase.auth.signInWithPassword({
            email: req.user.email,
            password: password
        });

        if (authError) {
            return res.status(401).json({ success: false, error: 'Invalid admin password. Verification failed.' });
        }

        // Unassign leads
        const { error: leadUpdateError } = await supabase
            .from('leads')
            .update({ assigned_to: null })
            .eq('assigned_to', id);

        if (leadUpdateError) throw leadUpdateError;

        // Unassign deals
        const { error: dealUpdateError } = await supabase
            .from('deals')
            .update({ owner_id: null })
            .eq('owner_id', id);

        if (dealUpdateError) throw dealUpdateError;

        // If no dependencies (or now cleared), delete from auth.users (cascades to public.profiles)
        const { error: deleteError } = await supabase.auth.admin.deleteUser(id);

        if (deleteError) throw deleteError;

        res.json({ success: true, message: 'Employee deleted successfully' });
    } catch (error) {
        console.error('Delete Employee Error:', error);
        res.status(400).json({ success: false, error: error.message });
    }
};

export { requireAdmin };
