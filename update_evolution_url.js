const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(url, key);

async function update() {
  const { data: settings, error: fetchError } = await supabase.from('automation_settings').select('id').limit(1);
  
  const payload = { 
     evolution_api_url: 'https://evolution-api-latest-idzi.onrender.com',
     evolution_api_key: '46765821',
     evolution_instance_id: 'ears-whatsapp'
  };

  if (!settings || settings.length === 0) {
     await supabase.from('automation_settings').insert([payload]);
  } else {
     await supabase.from('automation_settings').update(payload).eq('id', settings[0].id);
  }
}

update();
