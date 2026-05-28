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
    
    let force = false;
    try {
       const body = await req.json();
       force = body.force === true;
    } catch(e) {}
    
    // First check if the instance exists
    let stateRes = await fetch(`${baseUrl}/instance/connectionState/${settings.evolution_instance_id}`, {
      method: 'GET',
      headers: { 'apikey': settings.evolution_api_key || '' }
    });

    if (stateRes.ok && force) {
      await fetch(`${baseUrl}/instance/logout/${settings.evolution_instance_id}`, {
        method: 'DELETE',
        headers: { 'apikey': settings.evolution_api_key || '' }
      });
      // Allow it some time to process the logout
      await new Promise(r => setTimeout(r, 500));
    }

    // If instance doesn't exist (404), Create it
    if (stateRes.status === 404) {
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
      let resBody = await createRes.text();
      let data;
      try { data = JSON.parse(resBody); } catch(e) { data = { message: resBody }; }

      if (!createRes.ok) {
         if (createRes.status !== 400 && createRes.status !== 403 && !JSON.stringify(data).toLowerCase().includes('already in use')) {
             return NextResponse.json({ error: 'Falha ao criar instância.', details: data }, { status: createRes.status });
         } else {
             console.log('Instance already exists or another error ignored during creation:', data);
         }
      }

      // Automatically try to set webhook after creation (even if it already exists)
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
                 events: ["MESSAGES_UPSERT", "MESSAGES_UPDATE", "SEND_MESSAGE", "QRCODE_UPDATED", "CONNECTION_UPDATE"]
               }
            })
         }).catch(e => console.error("Webhook error: ", e));
      }
    } else if (!stateRes.ok) {
       let resBody = await stateRes.text();
       let data;
       try { data = JSON.parse(resBody); } catch(e) { data = { message: resBody }; }
       return NextResponse.json({ error: 'Falha ao verificar instância.', details: data }, { status: stateRes.status });
    }

    // Now try to get the QR code
    let res = await fetch(`${baseUrl}/instance/connect/${settings.evolution_instance_id}`, {
      method: 'GET',
      headers: { 'apikey': settings.evolution_api_key || '' }
    });

    let resBody = await res.text();
    let data;
    try { data = JSON.parse(resBody); } catch(e) { data = { message: resBody }; }

    if (!res.ok) {
       return NextResponse.json({ error: 'Falha ao conectar/obter QR da instância.', details: data }, { status: res.status });
    }
    
    let qrcodeReturn = data?.qrcode || data?.hash || data || {};
    try {
       const { data: qs } = await supabase.from('whatsapp_messages').select('text').eq('phone_number', 'QR_CODE_TEMP').order('created_at', { ascending: false }).limit(1);
       if (qs && qs.length > 0 && qs[0].text) {
           let qr = qs[0].text;
           if (qr && (!qrcodeReturn.base64)) {
               // Verify it is a valid base64 image (not FAKE_BASE64 or malformed)
               if (qr.startsWith('data:image/png;base64,')) {
                    qrcodeReturn.base64 = qr;
               } else if (qr.length > 100) {
                    qrcodeReturn.base64 = 'data:image/png;base64,' + qr.replace(/^data:image\/[a-z]+;base64,/, "");
               }
           }
       }
    } catch(e) {}

    return NextResponse.json({ success: true, qrcode: qrcodeReturn });

  } catch (error: any) {
    console.error('Error fetching whatsapp qr:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
