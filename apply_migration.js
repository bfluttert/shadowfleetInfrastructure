import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
    console.log('Applying migration to update geom_geojson function...');

    // Note: To run arbitrary SQL via the client, we usually need an RPC or be using the SQL editor.
    // However, if the service key has enough permissions, we might be able to use the `unsafe` sql method if available,
    // but usually, we just run it as a string if we have a custom RPC for it.
    // If not, I'll have to ask the user to run it in the Supabase SQL Editor.

    const sql = `
create or replace function geom_geojson(rec infrastructure_layers)
returns json as $$
  select st_asgeojson(
    st_simplify(
      rec.geom::geometry, 
      case 
        when rec.type in ('power_cable', 'telecom_cable', 'gas_pipeline') then 0.01
        else 0.001
      end
    )
  )::json;
$$ language sql stable;
    `;

    // Attempting to use the REST API to run SQL is not standard, 
    // but sometimes users have a 'exec_sql' RPC.
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
        console.error('Migration failed via RPC. You may need to run this SQL manually in the Supabase SQL Editor:');
        console.log(sql);
    } else {
        console.log('Migration applied successfully!');
    }
}

applyMigration();
