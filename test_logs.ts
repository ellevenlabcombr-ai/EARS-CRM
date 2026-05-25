import { createClient } from '@supabase/supabase-js';

async function run() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  
  const { data } = await supabase.from('test_logs').select('*').order('created_at', { ascending: false }).limit(5);
  console.log('logs:', JSON.stringify(data, null, 2));
}
run();
