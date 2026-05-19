import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!url || !key) {
  console.log('Missing env');
  process.exit(1);
}

const supabase = createClient(url, key);

async function test() {
  const { data, error } = await supabase.from('whatsapp_messages').insert({
    phone_number: '12345678',
    direction: 'inbound',
    text: 'test',
    status: 'received'
  });
  console.log('Error:', error);
  console.log('Data:', data);
}

test();
