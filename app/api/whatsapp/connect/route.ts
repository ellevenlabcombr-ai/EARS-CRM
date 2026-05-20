import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({ error: 'Missing Supabase credentials' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Fetch settings based on the dashboard context
    const { data: settings } = await supabase.from('automation_settings')
      .select('evolution_api_url, evolution_api_key, evolution_instance_id').single();

    if (!settings || !settings.evolution_api_url || !settings.evolution_instance_id) {
      return NextResponse.json({ error: 'Configuração do WhatsApp ausente nas Settings' }, { status: 400 });
    }

    const baseUrl = settings.evolution_api_url.endsWith('/') ? settings.evolution_api_url.slice(0, -1) : settings.evolution_api_url;
    
    // First try to Connect
    let res = await fetch(`${baseUrl}/instance/connect/${settings.evolution_instance_id}`, {
      method: 'GET',
      headers: { 'apikey': settings.evolution_api_key || '' }
    });

    let resBody = await res.text();
    let data;
    try { data = JSON.parse(resBody); } catch(e) { data = { message: resBody }; }

    // If instance doesn't exist, Create it
    if (!res.ok && (res.status === 404 || JSON.stringify(data).toLowerCase().includes('not found') || JSON.stringify(data).toLowerCase().includes('application not found'))) {
      const createRes = await fetch(`${baseUrl}/instance/create`, {
        method: 'POST',
        headers: {
          'apikey': settings.evolution_api_key || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          instanceName: settings.evolution_instance_id,
          qrcode: true,
          integration: "WHATSAPP-BAILEYS"
        })
      });
      resBody = await createRes.text();
      try { data = JSON.parse(resBody); } catch(e) { data = { message: resBody }; }

      if (!createRes.ok) {
         return NextResponse.json({ error: 'Falha ao criar instância.', details: data }, { status: createRes.status });
      }

      // Automatically try to set webhook after creation
      let origin = req.headers.get("origin");
      if (!origin && req.headers.get("x-forwarded-host")) {
        const host = req.headers.get("x-forwarded-host");
        const protocol = req.headers.get("x-forwarded-proto") || 'https';
        origin = `${protocol}://${host}`;
      } else if (!origin && req.headers.get("host")) {
        const host = req.headers.get("host");
        const protocol = host?.includes('localhost') ? 'http' : 'https';
        origin = `${protocol}://${host}`;
      }
      if (origin) {
         await fetch(`${baseUrl}/webhook/set/${settings.evolution_instance_id}`, {
            method: 'POST',
            headers: { 'apikey': settings.evolution_api_key || '', 'Content-Type': 'application/json' },
            body: JSON.stringify({
               webhook: {
                 enabled: true,
                 url: `${origin}/api/webhooks/evolution`,
                 byEvents: false,
                 base64: true,
                 events: ["MESSAGES_UPSERT", "MESSAGES_UPDATE", "SEND_MESSAGE"]
               }
            })
         }).catch(e => console.error("Webhook error: ", e));
      }
    } else if (!res.ok) {
       return NextResponse.json({ error: 'Falha ao conectar instância.', details: data }, { status: res.status });
    }

    return NextResponse.json({ success: true, qrcode: data?.qrcode || data?.hash || data });

  } catch (error: any) {
    console.error('Error fetching whatsapp qr:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
