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

      for(let i=0; i<10; i++) {
         const res = await fetch(`${baseUrl}/instance/connect/${instance}`, {
             headers: { apikey: evoKey }
         });
         const text = await res.text();
         console.log(`[Attempt ${i+1}] connect endpoint:`, text.substring(0, 150));
         await new Promise(r => setTimeout(r, 2000));
      }
  }
}
check();
