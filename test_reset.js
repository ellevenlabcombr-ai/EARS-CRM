const { createClient } = require('@supabase/supabase-js');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(url, key);

async function check() {
  const { data } = await supabase.from('automation_settings').select('*').limit(1).single();
  const evoUrl = data.evolution_api_url;
  const evoKey = data.evolution_api_key;
  const baseUrl = evoUrl.replace(/\/+$/, "");

  // Fetch all
  const res = await fetch(`${baseUrl}/instance/fetchInstances`, { headers: { apikey: evoKey } });
  const instances = await res.json();
  console.log('Instances to delete:', instances.map(i => i.name));

  for (const i of instances) {
      console.log('Deleting', i.name);
      await fetch(`${baseUrl}/instance/delete/${i.name}`, { method: 'DELETE', headers: { apikey: evoKey } });
  }

  const newInstance = 'ears-' + Date.now();
  console.log('Creating new:', newInstance);
  const resC = await fetch(`${baseUrl}/instance/create`, {
    method: 'POST',
    headers: { 'apikey': evoKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ instanceName: newInstance, qrcode: true, integration: 'WHATSAPP-BAILEYS' })
  });
  console.log('Created:', await resC.text());

  await supabase.from('automation_settings').update({ evolution_instance_id: newInstance }).eq('id', data.id);
  console.log('Connecting...');
  for(let i=0; i<3; i++) {
     const resConn = await fetch(`${baseUrl}/instance/connect/${newInstance}?qrcode=true`, { headers: { apikey: evoKey } });
     console.log('Connect:', await resConn.text());
     await new Promise(r => setTimeout(r, 2000));
  }
}
check();
