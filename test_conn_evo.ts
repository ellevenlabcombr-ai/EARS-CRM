import { createClient } from '@supabase/supabase-js';

async function run() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const { data: settings } = await supabase.from('automation_settings').select('*').single();
  if (settings && settings.evolution_api_url && settings.evolution_api_key && settings.evolution_instance_id) {
       const baseUrl = settings.evolution_api_url.replace(/\/+$/, "");
       const instanceId = settings.evolution_instance_id;
       const headers = { apikey: settings.evolution_api_key };

       const req = await fetch(`${baseUrl}/instance/connect/${instanceId}`, { method: 'GET', headers });
       const text = await req.text();
       console.log('Connect response:', text);
  } else {
    console.log("No settings or missing info");
  }
}
run();
