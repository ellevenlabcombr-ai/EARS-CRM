const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(url, key);

async function check() {
  const { data } = await supabase.from('automation_settings').select('*').limit(1).single();
  if (data?.evolution_api_url) {
      const evoUrl = data.evolution_api_url;
      const evoKey = data.evolution_api_key;
      const instance = data.evolution_instance_id;

      const baseUrl = evoUrl.replace(/\/+$/, "");
      const res = await fetch(`${baseUrl}/instance/delete/${instance}`, {
          method: 'DELETE',
          headers: { apikey: evoKey }
      });
      const text = await res.text();
      console.log('delete endpoint:', text);
      
      // now let's try connect again
      const res2 = await fetch(`${baseUrl}/instance/create`, {
        method: 'POST',
        headers: {
          'apikey': evoKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          instanceName: instance,
          qrcode: true,
          integration: "WHATSAPP-BAILEYS"
        })
      });
      const text2 = await res2.text();
      console.log('create endpoint after delete:', text2.substring(0, 300));
  }
}
check();
