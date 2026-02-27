import supabase from '../config/supabase.js';

/**
 * Load the single workflow_settings row.
 * Returns null if the table is empty or doesn't exist.
 */
export async function getWorkflowSettings() {
    try {
        const { data, error } = await supabase
            .from('workflow_settings')
            .select('*')
            .order('updated_at', { ascending: false })
            .limit(1);

        if (error || !data || data.length === 0) return null;
        return data[0];
    } catch {
        return null;
    }
}

/**
 * Upsert (save) workflow settings.
 */
export async function saveWorkflowSettings(settings) {
    const { data: existingRows } = await supabase
        .from('workflow_settings')
        .select('id')
        .order('updated_at', { ascending: false })
        .limit(1);

    const existing = existingRows?.[0];

    if (existing?.id) {
        const { data, error } = await supabase
            .from('workflow_settings')
            .update({ ...settings, updated_at: new Date().toISOString() })
            .eq('id', existing.id)
            .select()
            .single();
        if (error) throw error;
        return data;
    } else {
        // No row yet — insert one
        const { data, error } = await supabase
            .from('workflow_settings')
            .insert({ ...settings, updated_at: new Date().toISOString() })
            .select()
            .single();
        if (error) throw error;
        return data;
    }
}

/**
 * Pick an employee ID to assign to a new lead.
 *
 * @param {string|null} source - the lead's source string (e.g. "Google Sheet: GJ AD")
 * @returns {string|null} employee UUID or null (no assignment)
 */
export async function pickEmployee(source = '') {
    const settings = await getWorkflowSettings();

    if (!settings || !settings.auto_assign_enabled) return null;

    const activeRules = (settings.rules || []).filter(r => r.active && r.employee_id);

    if (activeRules.length === 0) return null;

    // ── Sheet Based ────────────────────────────────────────────────────────────
    if (settings.distribution_type === 'sheet_based') {
        const mappings = settings.sheet_mappings || [];
        const src = (source || '').toLowerCase();

        for (const mapping of mappings) {
            if (!mapping.sheet_pattern || !mapping.employee_id) continue;
            if (src.includes(mapping.sheet_pattern.toLowerCase())) {
                return mapping.employee_id;
            }
        }
        // No pattern matched — fall back to first active rule
        return activeRules[0]?.employee_id || null;
    }

    // ── Round Robin ────────────────────────────────────────────────────────────
    if (settings.distribution_type === 'round_robin') {
        const idx = (settings.round_robin_index || 0) % activeRules.length;
        const chosen = activeRules[idx].employee_id;

        // Increment the index atomically
        await supabase
            .from('workflow_settings')
            .update({ round_robin_index: idx + 1, updated_at: new Date().toISOString() })
            .eq('id', settings.id);

        return chosen;
    }

    // ── Percentage Based (default) ─────────────────────────────────────────────
    const total = activeRules.reduce((s, r) => s + Number(r.percentage || 0), 0);
    if (total === 0) return activeRules[0].employee_id;

    let rand = Math.random() * total;
    for (const rule of activeRules) {
        rand -= Number(rule.percentage || 0);
        if (rand <= 0) return rule.employee_id;
    }

    return activeRules[activeRules.length - 1].employee_id;
}

/**
 * Bulk assign unassigned leads created within X days.
 */
export async function bulkAssignLeads(days) {
    const settings = await getWorkflowSettings();
    if (!settings || !settings.auto_assign_enabled) return 0;

    let startDate;
    if (days === 'all') {
        startDate = new Date(0); // Epoch
    } else {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));
        startDate.setHours(0, 0, 0, 0); // Start of the day
    }

    // Fetch unassigned leads in timeframe
    const { data: leads, error } = await supabase
        .from('leads')
        .select('id, source')
        .is('assigned_to', null)
        .gte('created_at', startDate.toISOString());

    if (error) throw error;
    if (!leads.length) return 0;

    let assignedCount = 0;
    for (const lead of leads) {
        const employeeId = await pickEmployee(lead.source);
        if (employeeId) {
            const { error: updateError } = await supabase
                .from('leads')
                .update({ assigned_to: employeeId })
                .eq('id', lead.id);

            if (!updateError) assignedCount++;
        }
    }

    return assignedCount;
}

/**
 * Get count of unassigned leads in timeframe.
 */
export async function getUnassignedLeadCount(days) {
    let startDate;
    if (days === 'all') {
        startDate = new Date(0);
    } else {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));
        startDate.setHours(0, 0, 0, 0);
    }

    const { count, error } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .is('assigned_to', null)
        .gte('created_at', startDate.toISOString());

    if (error) throw error;
    return count || 0;
}

/**
 * Bulk unassign (revoke) leads created within X days.
 */
/**
 * Set assigned_to to null for all leads in the timeframe.
 * If employeeId is provided, ONLY revoke from that specific person.
 */
export async function revokeLeads(days, employeeId = null) {
    let startDate;
    if (days === 'all') {
        startDate = new Date(0);
    } else {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));
        startDate.setHours(0, 0, 0, 0);
    }

    let query = supabase
        .from('leads')
        .update({ assigned_to: null })
        .gte('created_at', startDate.toISOString());

    if (employeeId && employeeId !== 'all') {
        query = query.eq('assigned_to', employeeId);
    } else {
        query = query.not('assigned_to', 'is', null);
    }

    const { data, error } = await query.select('id');

    if (error) throw error;
    return data?.length || 0;
}

/**
 * Get count of assigned leads in timeframe (candidates for revoke).
 */
export async function getAssignedLeadCount(days, employeeId = null) {
    let startDate;
    if (days === 'all') {
        startDate = new Date(0);
    } else {
        startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));
        startDate.setHours(0, 0, 0, 0);
    }

    let query = supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString());

    if (employeeId && employeeId !== 'all') {
        query = query.eq('assigned_to', employeeId);
    } else {
        query = query.not('assigned_to', 'is', null);
    }

    const { count, error } = await query;

    if (error) throw error;
    return count || 0;
}

/**
 * Delete leads that were imported from sheet URLs that are NOT the current one.
 */
export async function purgeOldLeads() {
    const currentUrl = process.env.GOOGLE_SHEET_CSV_URL;
    if (!currentUrl) throw new Error('GOOGLE_SHEET_CSV_URL not configured');

    const { data, error } = await supabase
        .from('leads')
        .delete()
        .like('source', 'Google Sheet%')
        // Wrap URL in double quotes to handle special characters (dots, commas, etc.)
        .or(`source_url.is.null,source_url.neq."${currentUrl}"`)
        .select('id');

    if (error) throw error;
    return data?.length || 0;
}
