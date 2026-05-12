import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.rpc('execute_sql', {
    sql: `
        ALTER TABLE public.agenda_events ADD COLUMN IF NOT EXISTS result TEXT;
        ALTER TABLE public.agenda_events ADD COLUMN IF NOT EXISTS feedback TEXT;
        NOTIFY pgrst, 'reload schema';
    `
  });
  console.log("RPC Error:", error);
  console.log("RPC Data:", data);
}
run();
