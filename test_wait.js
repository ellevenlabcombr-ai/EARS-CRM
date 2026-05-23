const { createClient } = require('@supabase/supabase-js');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(url, key);

async function check() {
  const { data } = await supabase.from('automation_settings').select('*').limit(1).single();
  const evoUrl = data.evolution_api_url;
  const evoKey = data.evolution_api_key;
  const baseUrl = evoUrl.replace(/\/+$/, "");
  const instance = data.evolution_instance_id;

  for(let i=0; i<30; i++) {
     const resConn = await fetch(`${baseUrl}/instance/connect/${instance}`, { headers: { apikey: evoKey } });
     const text = await resConn.text();
     if (!text.includes('"count":0')) {
       console.log('Got something! ', text);
       break;
     }
     console.log('Waiting...', text);
     await new Promise(r => setTimeout(r, 2000));
  }
}
check();
