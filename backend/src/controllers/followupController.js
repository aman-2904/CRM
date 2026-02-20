import supabase from '../config/supabase.js';

export const createFollowup = async (req, res, next) => {
    try {
        const { lead_id, deal_id, assigned_to, scheduled_at, notes, status } = req.body;
        const userId = req.user.id;

        const { data, error } = await supabase
            .from('followups')
            .insert({
                lead_id,
                deal_id,
                assigned_to: assigned_to || userId,
                scheduled_at,
                notes,
                status: status || 'pending'
            })
            .select('*, leads(first_name, last_name)')
            .single();

        if (error) throw error;

        // Log Activity
        await supabase.from('activities').insert({
            user_id: userId,
            lead_id,
            deal_id,
            type: 'log',
            description: `Scheduled follow-up for ${new Date(scheduled_at).toLocaleString()}`
        });

        res.status(201).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

export const getFollowups = async (req, res, next) => {
    try {
        const { status, type, assigned_to } = req.query;
        const now = new Date().toISOString();

        let query = supabase
            .from('followups')
            .select('*, leads(first_name, last_name, email), profiles!followups_assigned_to_fkey(full_name)')
            .order('scheduled_at', { ascending: true });

        // Filters
        if (assigned_to) {
            query = query.eq('assigned_to', assigned_to);
        } else if (req.user.role !== 'admin') {
            // Enforce assigned_to for employees
            query = query.eq('assigned_to', req.user.id);
        }

        if (status) {
            query = query.eq('status', status);
        }

        // Dashboard specific filters (type = today, missed, upcoming)
        if (type === 'today') {
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date();
            endOfDay.setHours(23, 59, 59, 999);

            query = query
                .gte('scheduled_at', startOfDay.toISOString())
                .lte('scheduled_at', endOfDay.toISOString())
                .eq('status', 'pending');
        } else if (type === 'missed') {
            query = query
                .lt('scheduled_at', now)
                .eq('status', 'pending');
        } else if (type === 'upcoming') {
            query = query
                .gt('scheduled_at', now)
                .eq('status', 'pending');
        }

        const { data, error } = await query;
        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

export const updateFollowup = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const userId = req.user.id;

        const { data, error } = await supabase
            .from('followups')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Log specific status transitions
        if (updates.status) {
            await supabase.from('activities').insert({
                user_id: userId,
                lead_id: data.lead_id,
                deal_id: data.deal_id,
                type: 'log',
                description: `Follow-up marked as ${updates.status}`
            });
        }

        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

export const deleteFollowup = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { error } = await supabase
            .from('followups')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true, message: 'Follow-up deleted' });
    } catch (error) {
        next(error);
    }
};
