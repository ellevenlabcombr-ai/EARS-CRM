import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

async function run() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );

  const { data, error } = await supabase.rpc('execute_sql', { sql: 'ALTER TABLE IF EXISTS public.financial_transactions ADD COLUMN IF NOT EXISTS asaas_payment_id TEXT;' });
  console.log(error || data);
}
run();
