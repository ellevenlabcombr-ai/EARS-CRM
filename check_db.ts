import { createClient } from '@supabase/supabase-js';

async function checkTable() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return;
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const { data, error } = await supabase.rpc('exec_sql', {
    sql: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'whatsapp_messages';"
  });
  
  console.log('Columns:', data);
  console.log('Error:', error);
}

checkTable();
