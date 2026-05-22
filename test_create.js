const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(url, key);

async function createInstance() {
  const { data: settings } = await supabase.from('automation_settings').select('*').limit(1).single();
  if (settings?.evolution_api_url) {
      const evoUrl = settings.evolution_api_url;
      const evoKey = settings.evolution_api_key;
      const newInstance = 'ears-wa-' + Date.now(); // unique instance name!

      const baseUrl = evoUrl.replace(/\/+$/, "");
      const res2 = await fetch(`${baseUrl}/instance/create`, {
        method: 'POST',
        headers: {
          'apikey': evoKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          instanceName: newInstance,
          qrcode: true,
          integration: "WHATSAPP-BAILEYS"
        })
      });
      const text2 = await res2.text();
      console.log('create endpoint:', text2.substring(0, 500));
      
      try {
         const d = JSON.parse(text2);
         if (d.hash || d.qrcode) {
             console.log("Success! Updating database...");
             await supabase.from('automation_settings').update({ evolution_instance_id: newInstance }).eq('id', settings.id);
             console.log("Updated ID to", newInstance);
         }
      } catch(e) {}
  }
}
createInstance();
