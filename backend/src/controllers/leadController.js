import supabase from '../config/supabase.js';

export const createLead = async (req, res, next) => {
    try {
        const { first_name, last_name, email, phone, company, source, notes, status, assigned_to } = req.body;
        const userId = req.user.id;

        // Create Lead
        // Note: Clean the assigned_to to null if it's an empty string to avoid UUID errors
        const cleanedAssignedTo = assigned_to && assigned_to !== '' ? assigned_to : userId;

        const { data, error } = await supabase
            .from('leads')
            .insert({
                first_name,
                last_name,
                email,
                phone,
                company,
                source,
                notes,
                status: status || 'new',
                assigned_to: cleanedAssignedTo
            })
            .select()
            .single();

        if (error) throw error;

        // Log Activity (Non-blocking)
        try {
            await supabase.from('activities').insert({
                user_id: userId,
                lead_id: data.id,
                type: 'log',
                description: `Lead created by ${req.user.profile?.full_name || req.user.email || 'User'}`
            });
        } catch (logError) {
            console.error('Activity Log Error (Non-critical):', logError);
        }

        res.status(201).json({ success: true, data });
    } catch (error) {
        console.error('Lead Creation Error Details:', error);
        const errorMessage = error.message || error.details || 'Unknown database error';
        res.status(400).json({ success: false, error: errorMessage });
    }
};

export const getLeads = async (req, res, next) => {
    try {
        // Admin sees all, Employee sees assigned (or all if we want open model)
        // Going with "Employee sees all" as per typical SME CRM, but we filter in UI mostly.
        // However, let's implement the query.

        let query = supabase
            .from('leads')
            .select('*, profiles!leads_assigned_to_fkey(full_name)')
            .order('created_at', { ascending: false });

        // If we wanted to restrict employees:
        // if (req.user.role !== 'admin') {
        //    query = query.eq('assigned_to', req.user.id);
        // }

        const { data, error } = await query;
        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

export const updateLead = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const userId = req.user.id;

        // 1. Get current state for history comparison
        const { data: currentLead, error: fetchError } = await supabase
            .from('leads')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;

        // 2. Perform Update
        const { data, error } = await supabase
            .from('leads')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // 3. Log differences (History)
        const activities = [];

        if (updates.status && updates.status !== currentLead.status) {
            activities.push({
                user_id: userId,
                lead_id: id,
                type: 'log',
                description: `Changed status from ${currentLead.status} to ${updates.status}`
            });
        }

        if (updates.assigned_to && updates.assigned_to !== currentLead.assigned_to) {
            activities.push({
                user_id: userId,
                lead_id: id,
                type: 'log',
                description: `Reassigned lead`
            });
        }

        // Generic update log if nothing specific
        if (activities.length === 0 && Object.keys(updates).length > 0) {
            activities.push({
                user_id: userId,
                lead_id: id,
                type: 'log',
                description: `Updated details`
            });
        }

        if (activities.length > 0) {
            await supabase.from('activities').insert(activities);
        }

        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

export const deleteLead = async (req, res, next) => {
    try {
        const { id } = req.params;

        // Admin only check
        if (req.user.role !== 'admin') {
            const error = new Error('Unauthorized: Only admins can delete leads');
            error.statusCode = 403;
            throw error;
        }

        const { error } = await supabase
            .from('leads')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({ success: true, message: 'Lead deleted' });
    } catch (error) {
        next(error);
    }
};

export const deleteLeadsBulk = async (req, res, next) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, error: 'No IDs provided' });
        }

        // Admin only check
        if (req.user.role !== 'admin') {
            const error = new Error('Unauthorized: Only admins can delete leads');
            error.statusCode = 403;
            throw error;
        }

        const { error } = await supabase
            .from('leads')
            .delete()
            .in('id', ids);

        if (error) throw error;

        res.json({ success: true, message: `${ids.length} leads deleted` });
    } catch (error) {
        next(error);
    }
};

export const getLeadHistory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase
            .from('activities')
            .select('*, profiles(full_name)')
            .eq('lead_id', id)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
};
