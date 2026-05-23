const { createClient } = require('@supabase/supabase-js');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(url, key);

async function check() {
  const { data } = await supabase.from('automation_settings').select('*').limit(1).single();
  const evoUrl = data.evolution_api_url;
  const baseUrl = evoUrl.replace(/\/+$/, "");

  const res = await fetch(`${baseUrl}/`);
  console.log('Root:', await res.text());
}
check();
