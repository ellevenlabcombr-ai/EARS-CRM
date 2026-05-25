import { createClient } from '@supabase/supabase-js';

async function run() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const { data } = await supabase.from('automation_settings').select('*').single();
  const headers = { apikey: data.evolution_api_key };
  
  const req = await fetch(`${data.evolution_api_url}/instance/connect/${data.evolution_instance_id}`, { method: 'GET', headers });
  console.log('connect without base64:', await req.text());

  const req2 = await fetch(`${data.evolution_api_url}/instance/connect/${data.evolution_instance_id}?base64=true`, { method: 'GET', headers });
  console.log('connect with base64:', await req2.text());
}
run();
