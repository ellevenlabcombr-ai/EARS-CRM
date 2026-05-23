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

  const resState = await fetch(`${baseUrl}/instance/connect/${instance}?number=5511999999999`, { headers: { apikey: evoKey } });
  console.log('Pair:', await resState.text());
}
check();
