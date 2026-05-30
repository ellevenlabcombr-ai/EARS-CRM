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
    let clientOrigin = null;
    try {
       const body = await req.json();
       force = body.force === true;
       clientOrigin = body.clientOrigin;
    } catch(e) {}
    
    // First check if the instance exists
    let stateRes = await fetch(`${baseUrl}/instance/connectionState/${settings.evolution_instance_id}`, {
      method: 'GET',
      headers: { 'apikey': settings.evolution_api_key || '' },
      signal: AbortSignal.timeout(180000)
    });

    if (stateRes.ok && force) {
      await fetch(`${baseUrl}/instance/logout/${settings.evolution_instance_id}`, {
        method: 'DELETE',
        headers: { 'apikey': settings.evolution_api_key || '' },
        signal: AbortSignal.timeout(180000)
      }).catch(e => console.log('Logout ignore'));
      
      await fetch(`${baseUrl}/instance/delete/${settings.evolution_instance_id}`, {
        method: 'DELETE',
        headers: { 'apikey': settings.evolution_api_key || '' },
        signal: AbortSignal.timeout(180000)
      }).catch(e => console.log('Delete ignore'));

      // Allow it some time to process the deletion
      await new Promise(r => setTimeout(r, 1000));
      stateRes = { ok: false, status: 404, text: async () => "{}" } as any;
    }

    // If instance doesn't exist (404), Create it
    if (stateRes.status === 404) {
      const createRes = await fetch(`${baseUrl}/instance/create`, {
        method: 'POST',
        headers: {
          'apikey': settings.evolution_api_key || '',
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(180000),
        body: JSON.stringify({
          instanceName: settings.evolution_instance_id,
          qrcode: true,
          integration: "WHATSAPP-BAILEYS"
        })
      });
      let resBody = await createRes.text();
      let crData;
      try { crData = JSON.parse(resBody); } catch(e) { crData = { message: resBody }; }

      if (!createRes.ok) {
         if (!JSON.stringify(crData).toLowerCase().includes('already in use') && !JSON.stringify(crData).toLowerCase().includes('already exists')) {
             return NextResponse.json({ error: 'Falha ao criar instância (Evolution).', details: crData }, { status: createRes.status });
         } else {
             console.log('Instance already exists or another error ignored during creation:', crData);
         }
      }
      
      // If the backend returns QR code from create, fast-track it into db
      if (crData?.qrcode?.base64 || crData?.base64) {
          try {
             let qrB64 = crData?.qrcode?.base64 || crData?.base64;
             if (qrB64 && !qrB64.startsWith('data:image')) {
                 qrB64 = 'data:image/png;base64,' + qrB64.replace(/^data:image\/[a-z]+;base64,/, "");
             }
             await supabase.from('whatsapp_messages').delete().eq('phone_number', 'QR_CODE_TEMP');
             await supabase.from('whatsapp_messages').insert({
                 phone_number: 'QR_CODE_TEMP',
                 text: qrB64,
                 direction: 'inbound',
                 status: 'sent'
             });
             // We can also return explicitly but let execution continue so webhook gets set
          } catch(e) {}
      }

      // Automatically try to set webhook after creation (even if it already exists)
      let origin = clientOrigin || req.headers.get("origin");
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
            signal: AbortSignal.timeout(180000),
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
      headers: { 'apikey': settings.evolution_api_key || '' },
      signal: AbortSignal.timeout(180000)
    });

    let resBody = await res.text();
    let data;
    try { data = JSON.parse(resBody); } catch(e) { data = { message: resBody }; }

    // If connect returns 404, the instance is corrupted or missing despite connectionState. Recreate it.
    if (res.status === 404) {
      console.log('Connect returned 404, recreating instance...');
      await fetch(`${baseUrl}/instance/logout/${settings.evolution_instance_id}`, { method: 'DELETE', headers: { 'apikey': settings.evolution_api_key || '' }, signal: AbortSignal.timeout(180000) }).catch(e => console.log('Logout ignore'));
      await fetch(`${baseUrl}/instance/delete/${settings.evolution_instance_id}`, { method: 'DELETE', headers: { 'apikey': settings.evolution_api_key || '' }, signal: AbortSignal.timeout(180000) }).catch(e => console.log('Delete ignore'));
      
      const createRes = await fetch(`${baseUrl}/instance/create`, {
        method: 'POST',
        headers: {
          'apikey': settings.evolution_api_key || '',
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(180000),
        body: JSON.stringify({
          instanceName: settings.evolution_instance_id,
          qrcode: true,
          integration: "WHATSAPP-BAILEYS"
        })
      });
      let crText = await createRes.text();
      try { data = JSON.parse(crText); } catch(e) { data = { message: crText }; }
      
      if (!createRes.ok && !JSON.stringify(data).toLowerCase().includes('already in use') && !JSON.stringify(data).toLowerCase().includes('already exists')) {
          return NextResponse.json({ error: 'Falha ao recriar instância após 404.', details: data }, { status: createRes.status });
      }
      
      // Attempt connect again
      res = await fetch(`${baseUrl}/instance/connect/${settings.evolution_instance_id}`, {
        method: 'GET',
        headers: { 'apikey': settings.evolution_api_key || '' },
        signal: AbortSignal.timeout(180000)
      });
      resBody = await res.text();
      try { data = JSON.parse(resBody); } catch(e) { data = { message: resBody }; }
    }

    let qrcodeReturn = data?.qrcode || data?.hash || data || {};
    if (data?.base64 && !qrcodeReturn.base64) {
        qrcodeReturn.base64 = data.base64;
    }
    try {
       const { data: qs } = await supabase.from('whatsapp_messages').select('text').eq('phone_number', 'QR_CODE_TEMP').order('created_at', { ascending: false }).limit(1);
       if (qs && qs.length > 0 && qs[0].text) {
           let qr = qs[0].text;
           if (qr) {
               // Verify it is a valid base64 image (not FAKE_BASE64 or malformed)
               if (qr.startsWith('data:image/png;base64,')) {
                    qrcodeReturn.base64 = qr;
               } else if (qr.length > 100) {
                    qrcodeReturn.base64 = 'data:image/png;base64,' + qr.replace(/^data:image\/[a-z]+;base64,/, "");
               }
               // Force success if we found a QR code in DB!
               return NextResponse.json({ success: true, qrcode: qrcodeReturn });
           }
       }
    } catch(e) {}

    // Fallback: If no webhook delivered QR code and it's missing, try to fetch it from fetchInstances
    if (!qrcodeReturn.base64 && qrcodeReturn.count === 0) {
       try {
           let instancesRes = await fetch(`${baseUrl}/instance/fetchInstances`, {
               method: 'GET',
               headers: { 'apikey': settings.evolution_api_key || '' },
               signal: AbortSignal.timeout(180000)
           });
           if (instancesRes.ok) {
               let instances = await instancesRes.json();
               if (Array.isArray(instances)) {
                   let inst = instances.find((i: any) => i.instance?.instanceName === settings.evolution_instance_id);
                   if (inst && inst.qrcode && inst.qrcode.base64) {
                       qrcodeReturn.base64 = inst.qrcode.base64;
                       return NextResponse.json({ success: true, qrcode: qrcodeReturn });
                   } else if (inst && inst.base64) {
                       qrcodeReturn.base64 = inst.base64;
                       return NextResponse.json({ success: true, qrcode: qrcodeReturn });
                   }
               }
           }
       } catch(e) {}
    }

    if (!res.ok) {
       return NextResponse.json({ error: 'Falha ao conectar/obter QR da instância.', details: data }, { status: res.status });
    }
    
    return NextResponse.json({ success: true, qrcode: qrcodeReturn });

  } catch (error: any) {
    console.error('Error fetching whatsapp qr:', error);
    return NextResponse.json({ error: (error.message || '').toLowerCase().includes('timeout') || (error.message || '').includes('aborted') ? 'O servidor demorou muito para responder (em plataformas free, leva alguns minutos para acordar na primeira vez). Aguarde e tente novamente em breve.' : error.message }, { status: 500 });
  }
}
