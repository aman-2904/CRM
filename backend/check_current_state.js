import supabase from './src/config/supabase.js';

async function checkState() {
    console.log('--- CURRENT STATE CHECK ---');

    // 1. Check Workflow Settings
    const { data: settings, error: sErr } = await supabase
        .from('workflow_settings')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1);

    if (sErr) console.error('Settings Error:', sErr);
    console.log('Current Workflow Settings:', JSON.stringify(settings?.[0], null, 2));

    // 2. Check Leads count by assignment
    const { data: leads, error: lErr } = await supabase
        .from('leads')
        .select('assigned_to, first_name');

    if (lErr) console.error('Leads Error:', lErr);

    const unassigned = leads?.filter(l => !l.assigned_to) || [];
    const assigned = leads?.filter(l => l.assigned_to) || [];

    console.log(`Total Leads: ${leads?.length || 0}`);
    console.log(`Unassigned Leads: ${unassigned.length}`);
    console.log(`Assigned Leads: ${assigned.length}`);

    if (assigned.length > 0) {
        console.log('Assigned to IDs:', [...new Set(assigned.map(l => l.assigned_to))]);
    }

    // 3. Check Profiles
    const { data: profiles } = await supabase.from('profiles').select('id, full_name');
    console.log('Profiles:', JSON.stringify(profiles, null, 2));

    console.log('--- END CHECK ---');
}

checkState();
