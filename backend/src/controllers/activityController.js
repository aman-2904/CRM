import supabase from '../config/supabase.js';

// Helper function to log activities
export const logActivity = async (userId, type, description, leadId = null, dealId = null) => {
    try {
        await supabase.from('activities').insert({
            user_id: userId,
            type,
            description,
            lead_id: leadId,
            deal_id: dealId
        });
    } catch (error) {
        console.error('Activity log error:', error);
        // Don't throw - logging should not break main operations
    }
};

// Get activities with filters
export const getActivities = async (req, res, next) => {
    try {
        const { user_id, type, from, to, limit = 50 } = req.query;

        let query = supabase
            .from('activities')
            .select(`
                id, type, description, created_at,
                profiles:user_id(id, full_name, email),
                leads:lead_id(first_name, last_name, company),
                deals:deal_id(name, amount)
            `)
            .order('created_at', { ascending: false })
            .limit(parseInt(limit));

        if (user_id) query = query.eq('user_id', user_id);
        if (type) query = query.eq('type', type);
        if (from) query = query.gte('created_at', from);
        if (to) query = query.lte('created_at', to + 'T23:59:59');

        const { data, error } = await query;
        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

// Log auth events (called from frontend)
export const logAuthEvent = async (req, res, next) => {
    try {
        const { type } = req.body; // 'login' or 'logout'
        const userId = req.user.id;
        const userName = req.user.profile?.full_name || req.user.email;

        await logActivity(userId, type, `${userName} ${type === 'login' ? 'logged in' : 'logged out'}`);

        res.json({ success: true });
    } catch (error) {
        next(error);
    }
};

// Get activity summary stats
export const getActivityStats = async (req, res, next) => {
    try {
        const { data, error } = await supabase
            .from('activities')
            .select('type, created_at');

        if (error) throw error;

        const today = new Date().toISOString().split('T')[0];
        const todayActivities = data.filter(a => a.created_at.startsWith(today));

        const typeCounts = {};
        data.forEach(a => {
            typeCounts[a.type] = (typeCounts[a.type] || 0) + 1;
        });

        res.json({
            success: true,
            data: {
                total: data.length,
                today: todayActivities.length,
                byType: Object.entries(typeCounts).map(([type, count]) => ({ type, count }))
            }
        });
    } catch (error) {
        next(error);
    }
};

export default { logActivity, getActivities, logAuthEvent, getActivityStats };
