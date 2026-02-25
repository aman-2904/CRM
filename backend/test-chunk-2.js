import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testDelete() {
    try {
        console.log("Fetching leads...");
        const { data: leads, error: fetchErr } = await supabase.from('leads').select('id');
        if (fetchErr) return console.error("Fetch err:", fetchErr);
        if (!leads || leads.length === 0) return console.log("No leads to test");

        const ids = leads.map(l => l.id);
        console.log(`Testing chunked delete for ${ids.length} IDs...`);

        const CHUNK_SIZE = 100;
        let deletedCount = 0;

        for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
            const chunk = ids.slice(i, i + CHUNK_SIZE);
            const { error } = await supabase.from('leads').delete().in('id', chunk);

            if (error) {
                console.error(`Error deleting chunk ${i / CHUNK_SIZE}:`, JSON.stringify(error, null, 2));
                return;
            }
            deletedCount += chunk.length;
            console.log(`Deleted ${deletedCount}/${ids.length} leads...`);
        }

        console.log("Chunked delete successful!");
    } catch (e) {
        console.error("Exception:", e);
    }
}
testDelete();
