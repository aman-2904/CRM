import supabase from '../config/supabase.js';

export const createDeal = async (req, res, next) => {
    try {
        const { lead_id, amount, stage, expected_close_date, name } = req.body;
        const userId = req.user.id;

        const { data, error } = await supabase
            .from('deals')
            .insert({
                lead_id,
                owner_id: userId,
                amount: amount || 0,
                stage: stage || 'prospecting',
                expected_close_date,
                name: name || 'New Deal'
            })
            .select('*, leads(first_name, last_name, company)')
            .single();

        if (error) throw error;

        // If converting from lead, update lead status
        if (lead_id) {
            await supabase
                .from('leads')
                .update({ status: 'converted' })
                .eq('id', lead_id);
        }

        // Log Activity
        await supabase.from('activities').insert({
            user_id: userId,
            deal_id: data.id,
            lead_id,
            type: 'log',
            description: `Deal created: ${name || 'New Deal'} - $${amount || 0}`
        });

        res.status(201).json({ success: true, data });
    } catch (error) {
        console.error('Deal Creation Error:', error);
        res.status(400).json({ success: false, error: error.message });
    }
};

export const getDeals = async (req, res, next) => {
    try {
        const { stage, owner_id } = req.query;

        let query = supabase
            .from('deals')
            .select('*, leads(first_name, last_name, company, email), profiles!deals_owner_id_fkey(full_name)')
            .order('created_at', { ascending: false });

        if (stage) query = query.eq('stage', stage);
        if (owner_id) query = query.eq('owner_id', owner_id);

        const { data, error } = await query;
        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

export const getDealStats = async (req, res, next) => {
    try {
        const { data: allDeals, error } = await supabase
            .from('deals')
            .select('amount, stage');

        if (error) throw error;

        const stats = {
            total: allDeals.length,
            totalValue: allDeals.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0),
            won: allDeals.filter(d => d.stage === 'closed_won').length,
            wonValue: allDeals.filter(d => d.stage === 'closed_won').reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0),
            lost: allDeals.filter(d => d.stage === 'closed_lost').length,
            inPipeline: allDeals.filter(d => !['closed_won', 'closed_lost'].includes(d.stage)).length,
            pipelineValue: allDeals.filter(d => !['closed_won', 'closed_lost'].includes(d.stage)).reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0),
        };

        res.json({ success: true, data: stats });
    } catch (error) {
        next(error);
    }
};

export const updateDeal = async (req, res, next) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const userId = req.user.id;

        const { data, error } = await supabase
            .from('deals')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        // Log stage changes
        if (updates.stage) {
            await supabase.from('activities').insert({
                user_id: userId,
                deal_id: id,
                type: 'log',
                description: `Deal moved to ${updates.stage.replace('_', ' ')}`
            });
        }

        res.json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

export const deleteDeal = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { error } = await supabase
            .from('deals')
            .delete()
            .eq('id', id);

        if (error) throw error;
        res.json({ success: true, message: 'Deal deleted' });
    } catch (error) {
        next(error);
    }
};
