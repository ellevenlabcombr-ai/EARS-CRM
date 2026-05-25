import { createClient } from '@supabase/supabase-js';

async function run() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const { data } = await supabase.from('automation_settings').select('evolution_api_url, evolution_api_key, evolution_instance_id').single();
  
  if (!data) return console.log('no settings');

  const headers = { apikey: data.evolution_api_key };
  const res = await fetch(`${data.evolution_api_url}/instance/connect/${data.evolution_instance_id}`, {
    method: 'GET',
    headers
  });
  
  const text = await res.text();
  console.log('Connect Result:', res.status, text.substring(0, 500));
}
run();
