import { createClient } from '@supabase/supabase-js';

async function run() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  const { data } = await supabase.from('automation_settings').select('*').single();
  
  if (!data) return console.log('no settings');

  const headers = { apikey: data.evolution_api_key };
  for (let i = 0; i < 3; i++) {
    const res = await fetch(`${data.evolution_api_url}/instance/connect/${data.evolution_instance_id}`, {
      method: 'GET',
      headers
    });
    
    const text = await res.text();
    console.log(`Poll ${i} Result:`, text.substring(0, 200));
    await new Promise(r => setTimeout(r, 2000));
  }
}
run();
