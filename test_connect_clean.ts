import { createClient } from '@supabase/supabase-js';

async function run() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const { data } = await supabase.from('automation_settings').select('*').single();
  const headers = { apikey: data.evolution_api_key };
  
  await fetch(`${data.evolution_api_url}/instance/logout/${data.evolution_instance_id}`, { method: 'DELETE', headers });
  
  await fetch(`${data.evolution_api_url}/instance/connect/${data.evolution_instance_id}`, { method: 'GET', headers });
  
  await new Promise(r => setTimeout(r, 2000));
  const req2 = await fetch(`${data.evolution_api_url}/instance/connect/${data.evolution_instance_id}`, { method: 'GET', headers });
  console.log('connect req2:', await req2.text());
}
run();
