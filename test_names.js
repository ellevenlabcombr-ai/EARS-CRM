const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(url, key);

async function check() {
  const { data } = await supabase.from('automation_settings').select('*').limit(1).single();
  if (data?.evolution_api_url) {
      const evoUrl = data.evolution_api_url;
      const evoKey = data.evolution_api_key;

      const baseUrl = evoUrl.replace(/\/+$/, "");
      const res = await fetch(`${baseUrl}/instance/fetchInstances`, {
          headers: { apikey: evoKey }
      });
      const data2 = await res.json();
      console.log('Instances:', data2.map(i => i.name));
  }
}
check();
