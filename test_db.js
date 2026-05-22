const { createClient } = require('@supabase/supabase-js');
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(url, key);
async function check() {
  const { data } = await supabase.from('automation_settings').select('evolution_api_url, evolution_api_key, evolution_instance_id').single();
  console.log(data);
}
check();
