import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testDelete() {
    try {
        console.log("Fetching leads...");
        const { data: leads, error: fetchErr } = await supabase.from('leads').select('id');
        if (fetchErr) {
            console.error("Fetch err:", fetchErr);
            return;
        }
        if (!leads || leads.length === 0) {
            console.log("No leads to test");
            return;
        }

        const ids = leads.map(l => l.id);
        console.log(`Testing delete for ${ids.length} IDs...`);

        const { error } = await supabase.from('leads').delete().in('id', ids);
        if (error) {
            console.error("Delete error:", JSON.stringify(error, null, 2));
        } else {
            console.log("Delete successful");
        }
    } catch (e) {
        console.error("Exception:", e);
    }
}
testDelete();
