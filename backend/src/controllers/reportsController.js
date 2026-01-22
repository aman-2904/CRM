import supabase from '../config/supabase.js';

export const getLeadReport = async (req, res, next) => {
    try {
        const { from, to } = req.query;

        let query = supabase
            .from('leads')
            .select('id, status, source, created_at, assigned_to, profiles!leads_assigned_to_fkey(full_name)');

        // Apply date filters
        if (from) query = query.gte('created_at', from);
        if (to) query = query.lte('created_at', to + 'T23:59:59');

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;

        // Calculate aggregates
        const statusCounts = {};
        const sourceCounts = {};

        data.forEach(lead => {
            statusCounts[lead.status] = (statusCounts[lead.status] || 0) + 1;
            const source = lead.source || 'Unknown';
            sourceCounts[source] = (sourceCounts[source] || 0) + 1;
        });

        res.json({
            success: true,
            data: {
                total: data.length,
                byStatus: Object.entries(statusCounts).map(([name, count]) => ({ name, count })),
                bySource: Object.entries(sourceCounts).map(([name, count]) => ({ name, count })),
                leads: data
            }
        });
    } catch (error) {
        next(error);
    }
};

export const getSalesReport = async (req, res, next) => {
    try {
        const { from, to } = req.query;

        let query = supabase
            .from('deals')
            .select('id, name, stage, amount, expected_close_date, created_at, owner_id, profiles!deals_owner_id_fkey(full_name), leads(first_name, last_name, company)');

        if (from) query = query.gte('created_at', from);
        if (to) query = query.lte('created_at', to + 'T23:59:59');

        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;

        // Aggregates
        const stageCounts = {};
        let totalValue = 0;
        let wonValue = 0;
        let lostValue = 0;

        data.forEach(deal => {
            const amount = parseFloat(deal.amount) || 0;
            totalValue += amount;
            stageCounts[deal.stage] = (stageCounts[deal.stage] || 0) + 1;
            if (deal.stage === 'closed_won') wonValue += amount;
            if (deal.stage === 'closed_lost') lostValue += amount;
        });

        res.json({
            success: true,
            data: {
                total: data.length,
                totalValue,
                wonValue,
                lostValue,
                pipelineValue: totalValue - wonValue - lostValue,
                byStage: Object.entries(stageCounts).map(([name, count]) => ({ name, count })),
                deals: data
            }
        });
    } catch (error) {
        next(error);
    }
};

export const getEmployeeReport = async (req, res, next) => {
    try {
        const { from, to } = req.query;

        // Get profiles
        const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name, email, roles(name)');
        if (profilesError) throw profilesError;

        // Get leads with date filter
        let leadsQuery = supabase.from('leads').select('id, assigned_to, status, created_at');
        if (from) leadsQuery = leadsQuery.gte('created_at', from);
        if (to) leadsQuery = leadsQuery.lte('created_at', to + 'T23:59:59');
        const { data: leads, error: leadsError } = await leadsQuery;
        if (leadsError) throw leadsError;

        // Get deals with date filter
        let dealsQuery = supabase.from('deals').select('id, owner_id, stage, amount, created_at');
        if (from) dealsQuery = dealsQuery.gte('created_at', from);
        if (to) dealsQuery = dealsQuery.lte('created_at', to + 'T23:59:59');
        const { data: deals, error: dealsError } = await dealsQuery;
        if (dealsError) throw dealsError;

        // Build employee stats
        const employees = profiles.map(profile => {
            const empLeads = leads.filter(l => l.assigned_to === profile.id);
            const empDeals = deals.filter(d => d.owner_id === profile.id);
            const wonDeals = empDeals.filter(d => d.stage === 'closed_won');
            const revenue = wonDeals.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);

            return {
                id: profile.id,
                name: profile.full_name || profile.email,
                role: profile.roles?.name || 'employee',
                leads_handled: empLeads.length,
                leads_converted: empLeads.filter(l => l.status === 'converted').length,
                deals_total: empDeals.length,
                deals_won: wonDeals.length,
                deals_lost: empDeals.filter(d => d.stage === 'closed_lost').length,
                revenue,
                conversion_rate: empLeads.length > 0 ? ((wonDeals.length / empLeads.length) * 100).toFixed(1) : 0
            };
        });

        res.json({
            success: true,
            data: {
                total: employees.length,
                employees: employees.sort((a, b) => b.revenue - a.revenue)
            }
        });
    } catch (error) {
        next(error);
    }
};
