import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(url, key);

async function check() {
  const sql = `
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'whatsapp_messages' AND column_name = 'media_url') THEN
              ALTER TABLE public.whatsapp_messages ADD COLUMN media_url TEXT;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'whatsapp_messages' AND column_name = 'media_type') THEN
              ALTER TABLE public.whatsapp_messages ADD COLUMN media_type TEXT;
          END IF;
      EXCEPTION WHEN OTHERS THEN END $$;
      NOTIFY pgrst, 'reload schema';
  `;
  const { data, error } = await supabase.rpc('exec_sql', { sql });
  console.log('Error:', error);
  console.log('Data:', data);
}

check();
