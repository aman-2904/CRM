import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY); // we'll use anon or let's just use service role if available

async function testDelete() {
    const { data: leads, error: fetchErr } = await supabase.from('leads').select('id').limit(10);
    if (fetchErr) return console.error("Fetch err:", fetchErr);
    
    console.log("Got leads:", leads.length);
    const ids = leads.map(l => l.id);
    
    // Test the exact delete query used in controller
    const { error } = await supabase.from('leads').delete().in('id', ids);
    console.log("Delete error:", error);
}

testDelete();
