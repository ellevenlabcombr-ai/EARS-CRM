import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

async function run() {
  console.log("Fetching athletes...");
  const { data } = await supabase.from('athletes').select('id, created_at, name, athlete_code').order('created_at', { ascending: true });
  if (data) {
    for (let i = 0; i < data.length; i++) {
      console.log("Updating", data[i].name, "to", 11001+i);
      await supabase.from('athletes').update({ athlete_code: String(11001 + i) }).eq('id', data[i].id);
    }
    console.log("DONE");
  } else {
    console.log("No data found.");
  }
}
run();
