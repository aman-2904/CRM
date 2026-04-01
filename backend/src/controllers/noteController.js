import supabase from '../config/supabase.js';

export const getLeadNotes = async (req, res, next) => {
    try {
        const { leadId } = req.params;
        
        const { data, error } = await supabase
            .from('lead_notes')
            .select(`
                *,
                profiles:user_id(full_name, email)
            `)
            .eq('lead_id', leadId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        
        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

export const createNote = async (req, res, next) => {
    try {
        const { lead_id, content } = req.body;
        const userId = req.user.id;

        if (!lead_id || !content) {
            return res.status(400).json({ success: false, error: 'Lead ID and content are required' });
        }

        const { data, error } = await supabase
            .from('lead_notes')
            .insert({
                lead_id,
                user_id: userId,
                content
            })
            .select(`
                *,
                profiles:user_id(full_name, email)
            `)
            .single();

        if (error) throw error;

        // Optionally log as an activity too
        try {
            await supabase.from('activities').insert({
                user_id: userId,
                lead_id: lead_id,
                type: 'note',
                description: `Added a manual note: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`
            });
        } catch (logErr) {
            console.error('Failed to log note activity:', logErr);
        }

        res.status(201).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

export const deleteNote = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const userRole = req.user.role;

        // Check if the user is the owner or an admin
        const { data: note, error: fetchError } = await supabase
            .from('lead_notes')
            .select('user_id')
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;

        if (userRole !== 'admin' && note.user_id !== userId) {
            return res.status(403).json({ success: false, error: 'Unauthorized to delete this note' });
        }

        const { error } = await supabase
            .from('lead_notes')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({ success: true, message: 'Note deleted' });
    } catch (error) {
        next(error);
    }
};

export default { getLeadNotes, createNote, deleteNote };
