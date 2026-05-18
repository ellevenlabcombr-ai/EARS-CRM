import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import fs from 'fs';

const envStr = fs.readFileSync('.env.example', 'utf8') || fs.readFileSync('.env', 'utf8');
let supabaseUrl = '';
let supabaseKey = '';

envStr.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) supabaseKey = line.split('=')[1].trim();
});

const sup = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: athletes } = await sup.from('athletes').select('id, phone').limit(1);
  if (!athletes || athletes.length === 0) { console.log('No athletes'); return; }
  const athlete = athletes[0];
  console.log('Old Phone:', athlete.phone);
  
  const { data: updated, error } = await sup.from('athletes').update({ phone: '1234567890' }).eq('id', athlete.id).select();
  console.log('Update result:', updated, error);
}

run();
