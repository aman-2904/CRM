import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function addIsActiveColumn() {
    try {
        console.log("Checking if is_active exists...");
        // This query will fail if the column does not exist, or run if it does.
        const { error: testError } = await supabase.from('profiles').select('is_active').limit(1);
        
        if (testError && testError.code === '42703') {
            console.log("Column 'is_active' does not exist. It must be added via SQL.");
            
            // Execute SQL via RPC if we have an unmanaged query or use supabase REST API
            const sql = 'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;';
            const { error: rpcError } = await supabase.rpc('execute_sql', { query: sql });
            
            if (rpcError) {
                console.error("RPC failed:", rpcError);
                console.log("Will attempt to modify using a raw fetch to the REST API via postgres functions or direct connection.");
            } else {
                console.log("Migration successful via RPC");
            }
        } else {
            console.log("Column 'is_active' might already exist or test query worked.", testError || "Success");
        }
    } catch(e) {
        console.log("Exception:", e);
    }
}
addIsActiveColumn();
