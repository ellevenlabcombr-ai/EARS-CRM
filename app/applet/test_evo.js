import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
      console.log('Missing Supabase credentials');
      return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const { data: settings } = await supabase.from('automation_settings')
    .select('evolution_api_url, evolution_api_key, evolution_instance_id').single();

  if (!settings || !settings.evolution_api_url || !settings.evolution_instance_id) {
    console.log('Missing config');
    return;
  }

  const baseUrl = settings.evolution_api_url.endsWith('/') ? settings.evolution_api_url.slice(0, -1) : settings.evolution_api_url;
  
  console.log(`Connecting to: ${baseUrl}`);
  console.log(`Instance ID: ${settings.evolution_instance_id}`);

  let res = await fetch(`${baseUrl}/instance/connect/${settings.evolution_instance_id}`, {
    method: 'GET',
    headers: { 'apikey': settings.evolution_api_key || '' }
  });

  let resBody = await res.text();
  console.log('Connect status:', res.status);
  console.log('Connect body:', resBody);
  
  let resState = await fetch(`${baseUrl}/instance/connectionState/${settings.evolution_instance_id}`, {
    method: 'GET',
    headers: { 'apikey': settings.evolution_api_key || '' }
  });
  console.log('State status:', resState.status);
  console.log('State body:', await resState.text());
}

test();
