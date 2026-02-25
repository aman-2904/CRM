import supabase from './src/config/supabase.js';

async function setupProfileSchema() {
    console.log('Checking profiles table for avatar_url...');

    // Attempt to select avatar_url to see if it exists
    const { data, error } = await supabase.from('profiles').select('avatar_url').limit(1);

    if (error && error.message.includes('column "avatar_url" does not exist')) {
        console.log('avatar_url does not exist. Adding it...');
        // Since I cannot run direct SQL easily via the client if RLS is strict or if it is a DDL operation,
        // I will try to use the rpc if available, or just assume I need to tell the user.
        // BUT, usually in these tasks, I can try to run a raw SQL if I have the psql connection.
        // Given I cannot use psql effectively, I will skip the DDL part and just use full_name for now,
        // OR I will ask the user to add the column.
        // Actually, let's check what ELSE is in profiles.
        const { data: cols, error: cErr } = await supabase.from('profiles').select('*').limit(1);
        console.log('Current columns:', Object.keys(cols?.[0] || {}));
    } else if (error) {
        console.error('Error checking schema:', error);
    } else {
        console.log('avatar_url already exists!');
    }
}

setupProfileSchema();
