import { createClient } from '@supabase/supabase-js';

async function run() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const { data } = await supabase.from('automation_settings').select('*').single();
  const headers = { apikey: data.evolution_api_key };
  
  await fetch(`${data.evolution_api_url}/instance/logout/${data.evolution_instance_id}`, { method: 'DELETE', headers });
  await fetch(`${data.evolution_api_url}/instance/delete/${data.evolution_instance_id}`, { method: 'DELETE', headers });
  
  const instanceName = "ears-" + Date.now();
  await supabase.from('automation_settings').update({ evolution_instance_id: instanceName }).eq('id', data.id);
  
  const createReq = await fetch(`${data.evolution_api_url}/instance/create`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      instanceName,
      qrcode: true,
      integration: "WHATSAPP-BAILEYS"
    })
  });
  console.log('create:', await createReq.text());
}
run();
