import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkProfiles() {
    try {
        const { data, error } = await supabase.from('profiles').select('*').limit(2);
        if (error) console.error("Error:", error);
        console.log("Profiles schema:", JSON.stringify(data, null, 2));
    } catch (e) {
        console.error("Exception:", e);
    }
}
checkProfiles();
