const { createClient } = require("@supabase/supabase-js");

async function run() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
  const { data } = await supabase.from('branding_settings').select('logo_url').maybeSingle();
  if (data?.logo_url) {
    console.log("LOGO_URL:", data.logo_url);
  } else {
    console.log("NO_LOGO");
  }
}
run();
