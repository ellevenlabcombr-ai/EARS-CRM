import { createClient } from '@supabase/supabase-js';

async function run() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const { data } = await supabase.from('automation_settings').select('*').single();
  const headers = { apikey: data.evolution_api_key };
  
  // Try several endpoints to see what has the QR code
  const e1 = await fetch(`${data.evolution_api_url}/instance/connect/${data.evolution_instance_id}`, { method: 'GET', headers });
  console.log('/instance/connect:', (await e1.text()).substring(0, 100));

  const e2 = await fetch(`${data.evolution_api_url}/instance/connectionState/${data.evolution_instance_id}`, { method: 'GET', headers });
  console.log('/instance/connectionState:', (await e2.text()).substring(0, 100));
}
run();
