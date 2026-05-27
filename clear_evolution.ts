import { createClient } from '@supabase/supabase-js';

async function run() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const { data: settings } = await supabase.from('automation_settings').select('*').single();
  if (settings) {
    if (settings.evolution_api_url && settings.evolution_api_key && settings.evolution_instance_id) {
       const baseUrl = settings.evolution_api_url.replace(/\/+$/, "");
       const instanceId = settings.evolution_instance_id;
       const headers = { apikey: settings.evolution_api_key };

       console.log('Logging out/deleting instance:', instanceId);
       await fetch(`${baseUrl}/instance/logout/${instanceId}`, { method: 'DELETE', headers }).catch(()=>console.log('logout failed'));
       await fetch(`${baseUrl}/instance/delete/${instanceId}`, { method: 'DELETE', headers }).catch(()=>console.log('delete failed'));

       console.log('Updating supabase data (resetting evolution_qr_base64 to null)...');
       await supabase.from('automation_settings').update({ evolution_qr_base64: null }).eq('id', settings.id);
       console.log('Done!');
    }
  }
}
run();
