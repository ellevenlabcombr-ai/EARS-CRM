const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(url, key);

async function check() {
  const { data } = await supabase.from('automation_settings').select('*').limit(1).single();
  const evoUrl = data.evolution_api_url;
  const evoKey = data.evolution_api_key;
  const baseUrl = evoUrl.replace(/\/+$/, "");

  console.log('Connecting elleven...');
  const res = await fetch(`${baseUrl}/instance/connect/elleven`);
  const text = await res.text();
  console.log(text.substring(0, 500));
}
check();
