const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(url, key);

async function check() {
  const { data } = await supabase.from('automation_settings').select('*').limit(1).single();
  const evoUrl = data.evolution_api_url;
  const evoKey = data.evolution_api_key;
  const instance = data.evolution_instance_id;
  const baseUrl = evoUrl.replace(/\/+$/, "");

  console.log('Logging out...');
  await fetch(`${baseUrl}/instance/logout/${instance}`, { method: 'DELETE', headers: { apikey: evoKey }});

  console.log('Connecting...');
  const res = await fetch(`${baseUrl}/instance/connect/${instance}?qrcode=true`, { headers: { apikey: evoKey }});
  const text = await res.text();
  console.log(text.substring(0, 500));
}
check();
