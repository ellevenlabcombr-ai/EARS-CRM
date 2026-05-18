const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.example', 'utf8') || fs.readFileSync('.env', 'utf8') || '';
let supabaseUrl = '';
let supabaseKey = '';

envFile.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
});

if (!supabaseUrl) supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!supabaseKey) supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const sup = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await sup.from('athletes').select('*').limit(1);
  console.log("Cols:", Object.keys(data[0] || {}));
}

run();
