import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(url, key);

async function check() {
  const { data, error } = await supabase.from('whatsapp_messages').select('*').eq('phone_number', '551199999999');
  console.log('Error:', error);
  console.log('Data:', data);
}

check();
