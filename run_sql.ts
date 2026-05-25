import { createClient } from '@supabase/supabase-js';

async function run() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  await fetch(`${SUPABASE_URL}/rest/v1/rpc/check_and_create_tables`, {
      method: 'POST',
      headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
      }
  });
  console.log('called RPC');
}
run();
