const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(url, key);

async function check() {
  const { data } = await supabase.from('automation_settings').select('*').limit(1).single();
  console.log("Supabase config:", data.evolution_api_url);
  if (data?.evolution_api_url) {
      const evoUrl = data.evolution_api_url;
      const evoKey = data.evolution_api_key;
      const instance = data.evolution_instance_id;

      const baseUrl = evoUrl.replace(/\/+$/, "");
      const res = await fetch(`${baseUrl}/instance/logout/${instance}`, {
          method: 'DELETE',
          headers: { apikey: evoKey }
      });
      const text = await res.text();
      console.log('logout endpoint:', text);
      
      // now let's try connect again
      const res2 = await fetch(`${baseUrl}/instance/connect/${instance}`, {
          headers: { apikey: evoKey }
      });
      const text2 = await res2.text();
      console.log('connect endpoint after logout:', text2.substring(0, 300));
  }
}
check();
