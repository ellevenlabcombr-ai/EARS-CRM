import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(url, key);

async function check() {
  const { error } = await supabase.rpc('run_sql', { sql: `
    CREATE TABLE IF NOT EXISTS test_logs (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      created_at TIMESTAMPTZ DEFAULT now(),
      log_data JSONB
    );
  `});
  if (error && !error.message?.includes('run_sql')) console.error(error);
}
check();
