const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(url, key);

async function update() {
  const { data: settings, error: fetchError } = await supabase.from('automation_settings').select('id').limit(1);
  
  if (fetchError) {
      console.error('Fetch error:', fetchError);
      return;
  }
  
  const payload = { 
     evolution_api_url: 'https://evolution-api-latest-idzi.onrender.com',
     evolution_api_key: 'SuaSenhaForteAqui123!',
     evolution_instance_id: 'ears-whatsapp'
  };

  if (!settings || settings.length === 0) {
     console.log('Inserting new settings...');
     const { data, error } = await supabase.from('automation_settings').insert([payload]);
     console.log('Insert Error:', error);
  } else {
     console.log(`Updating setting ID ${settings[0].id}...`);
     const { data, error } = await supabase.from('automation_settings').update(payload).eq('id', settings[0].id);
     console.log('Update Error:', error);
  }
  console.log('Done!');
}

update();
