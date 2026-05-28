import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { url, apiKey, instanceId, action, clientOrigin } = await req.json();

    if (!url || !instanceId || !action) {
      return NextResponse.json({ error: 'Faltam parâmetros obrigatórios. Verifique URL, Instância e Action.' }, { status: 400 });
    }

    const baseUrl = url.replace(/\/+$/, "");
    let endpoint = "";
    let options: any = {
      headers: {
        "Content-Type": "application/json",
        "apikey": apiKey || "",
      },
      signal: AbortSignal.timeout(45000)
    };

    if (action === "create") {
      endpoint = `${baseUrl}/instance/create`;
      options.method = "POST";
      options.body = JSON.stringify({
        instanceName: instanceId,
        qrcode: true,
        integration: "WHATSAPP-BAILEYS"
      });
    } else if (action === "connect") {
      // First try standard connect
      let cRes = await fetch(`${baseUrl}/instance/connect/${instanceId}`, {
         method: "GET",
         headers: options.headers,
         signal: AbortSignal.timeout(45000)
      });
      let cText = await cRes.text();
      let cData;
      try { cData = JSON.parse(cText); } catch(e) { cData = {}; }

         if (cRes.ok) {
            // Map Evolution V2 direct base64 response
            if (cData.base64 && (!cData.qrcode || !cData.qrcode.base64)) {
                cData.qrcode = cData.qrcode || {};
                cData.qrcode.base64 = cData.base64;
            }
         // Append the QR code base64 from our database if it exists
         const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
         const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
         if (supabaseUrl && supabaseKey) {
             try {
                const { createClient } = require('@supabase/supabase-js');
                const supabase = createClient(supabaseUrl, supabaseKey);
                const { data: qs } = await supabase.from('whatsapp_messages').select('text').eq('phone_number', 'QR_CODE_TEMP').order('created_at', { ascending: false }).limit(1);
                if (qs && qs.length > 0 && qs[0].text) {
                    const qr = qs[0].text;
                    if (qr && (!cData.qrcode || !cData.qrcode.base64)) {
                        cData.qrcode = cData.qrcode || {};
                        cData.qrcode.base64 = qr;
                    }
                }
             } catch(e) {}
         }
         
         // Fallback: Try fetchInstances if we still don't have it
         if ((!cData.qrcode || !cData.qrcode.base64) && cData.count === 0) {
             try {
                 let instancesRes = await fetch(`${baseUrl}/instance/fetchInstances`, {
                     method: 'GET',
                     headers: options.headers,
                     signal: AbortSignal.timeout(45000)
                 });
                 if (instancesRes.ok) {
                     let instances = await instancesRes.json();
                     if (Array.isArray(instances)) {
                         let inst = instances.find((i: any) => i.instance?.instanceName === instanceId);
                         if (inst && inst.qrcode && inst.qrcode.base64) {
                             cData.qrcode = cData.qrcode || {};
                             cData.qrcode.base64 = inst.qrcode.base64;
                         } else if (inst && inst.base64) {
                             cData.qrcode = cData.qrcode || {};
                             cData.qrcode.base64 = inst.base64;
                         }
                     }
                 }
             } catch(e) {}
         }
         
         return NextResponse.json({ success: true, data: cData });
      }

      // If instance doesn't exist, try recreating.
      if (cRes.status === 404 || (cData?.response?.message && JSON.stringify(cData.response.message).includes('not found'))) {
          // safe clean just in case
          await fetch(`${baseUrl}/instance/logout/${instanceId}`, { method: "DELETE", headers: options.headers, signal: AbortSignal.timeout(45000) }).catch(() => {});
          await fetch(`${baseUrl}/instance/delete/${instanceId}`, { method: "DELETE", headers: options.headers, signal: AbortSignal.timeout(45000) }).catch(() => {});
      }

      const createRes = await fetch(`${baseUrl}/instance/create`, {
        method: "POST",
        headers: options.headers,
        signal: AbortSignal.timeout(45000),
        body: JSON.stringify({
          instanceName: instanceId,
          qrcode: true,
          integration: "WHATSAPP-BAILEYS"
        })
      });
      const crText = await createRes.text();
      let crData;
      try { crData = JSON.parse(crText); } catch(e) { crData = {}; }
      
      // Auto-set webhook just in case
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
      if (origin && crData?.instance) {
         fetch(`${baseUrl}/webhook/set/${instanceId}`, {
            method: 'POST',
            headers: options.headers,
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

      return NextResponse.json({ success: createRes.ok, data: crData }, { status: createRes.status });
    } else if (action === "status") {
      endpoint = `${baseUrl}/instance/connectionState/${instanceId}`;
      options.method = "GET";
    } else if (action === "logout") {
      endpoint = `${baseUrl}/instance/logout/${instanceId}`;
      options.method = "DELETE";
    } else if (action === "delete") {
      endpoint = `${baseUrl}/instance/delete/${instanceId}`;
      options.method = "DELETE";
    } else if (action === "set_webhook") {
      // Setup webhook logic
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
      
      const webhookUrl = `${origin}/api/webhooks/evolution`;
      console.log('Setting webhook URL to:', webhookUrl);

      endpoint = `${baseUrl}/webhook/set/${instanceId}`;
      options.method = "POST";
      options.body = JSON.stringify({
        webhook: {
          enabled: true,
          url: webhookUrl,
          byEvents: false,
          base64: true,
          events: [
            "MESSAGES_UPSERT", 
            "MESSAGES_UPDATE",
            "SEND_MESSAGE",
            "QRCODE_UPDATED",
            "CONNECTION_UPDATE"
          ]
        }
      });
    }

    const res = await fetch(endpoint, options);
    
    // some endpoints return empty bodies on DELETE
    const text = await res.text();
    let data;
    try {
        data = text ? JSON.parse(text) : {};
    } catch(e) {
        data = { message: text };
    }
    
    if (action === "create" && res.ok) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (supabaseUrl && supabaseKey) {
            try {
               const { createClient } = require('@supabase/supabase-js');
               const supabase = createClient(supabaseUrl, supabaseKey);
               await supabase.from('whatsapp_messages').delete().eq('phone_number', 'QR_CODE_TEMP');
            } catch(ex) {}
        }

        // Auto-set webhook just in case
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
           fetch(`${baseUrl}/webhook/set/${instanceId}`, {
              method: 'POST',
              headers: { "Content-Type": "application/json", "apikey": apiKey || "" },
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
    }

    if (action === "status" || action === "connect") {
       // Append the QR code base64 from our database if it exists
       const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
       const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
       if (supabaseUrl && supabaseKey) {
           try {
              const { createClient } = require('@supabase/supabase-js');
              const supabase = createClient(supabaseUrl, supabaseKey);
              const { data: qs } = await supabase.from('whatsapp_messages').select('text').eq('phone_number', 'QR_CODE_TEMP').order('created_at', { ascending: false }).limit(1);
              if (qs && qs.length > 0 && qs[0].text) {
                  const qr = qs[0].text;
                  if (qr && res.ok && (!data.qrcode || !data.qrcode.base64)) {
                      data.qrcode = data.qrcode || {};
                      data.qrcode.base64 = qr;
                  }
              }
           } catch(e) {}
       }
    }

    if (!res.ok) {
       let errorMsg = 'Erro na Evolution API';
       if (data.response?.message && Array.isArray(data.response.message)) {
           errorMsg = data.response.message.map((m: any) => typeof m === 'string' ? m : JSON.stringify(m)).join(', ');
       } else if (data.response?.message) {
           errorMsg = typeof data.response.message === 'string' ? data.response.message : JSON.stringify(data.response.message);
       } else if (data.message) {
           errorMsg = typeof data.message === 'string' ? data.message : JSON.stringify(data.message);
       } else if (data.error) {
           errorMsg = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
       }
       
       if (action === "create" && errorMsg.toLowerCase().includes('already in use')) {
           console.log('Instance already in use. Retrying with instance/connect...');
           let cRes = await fetch(`${baseUrl}/instance/connect/${instanceId}`, {
             method: "GET",
             headers: options.headers,
             signal: AbortSignal.timeout(45000)
           });
           let cText = await cRes.text();
           let cData;
           try { cData = JSON.parse(cText); } catch(e) { cData = {}; }
           
           if (cRes.ok) {
            // Fallback: Try fetchInstances if we still don't have it
         if ((!cData.qrcode || !cData.qrcode.base64) && cData.count === 0) {
             try {
                 let instancesRes = await fetch(`${baseUrl}/instance/fetchInstances`, {
                     method: 'GET',
                     headers: options.headers,
                     signal: AbortSignal.timeout(45000)
                 });
                 if (instancesRes.ok) {
                     let instances = await instancesRes.json();
                     if (Array.isArray(instances)) {
                         let inst = instances.find((i: any) => i.instance?.instanceName === instanceId);
                         if (inst && inst.qrcode && inst.qrcode.base64) {
                             cData.qrcode = cData.qrcode || {};
                             cData.qrcode.base64 = inst.qrcode.base64;
                         } else if (inst && inst.base64) {
                             cData.qrcode = cData.qrcode || {};
                             cData.qrcode.base64 = inst.base64;
                         }
                     }
                 }
             } catch(e) {}
         }

          return NextResponse.json({ success: true, data: cData });
           } else {
             // If completely failed, delete and recreate
             await fetch(`${baseUrl}/instance/logout/${instanceId}`, { method: "DELETE", headers: options.headers, signal: AbortSignal.timeout(45000) }).catch(() => {});
             await fetch(`${baseUrl}/instance/delete/${instanceId}`, { method: "DELETE", headers: options.headers, signal: AbortSignal.timeout(45000) }).catch(() => {});
             
             const createRes = await fetch(`${baseUrl}/instance/create`, {
               method: "POST",
               headers: options.headers,
               signal: AbortSignal.timeout(45000),
               body: JSON.stringify({
                 instanceName: instanceId,
                 qrcode: true,
                 integration: "WHATSAPP-BAILEYS"
               })
             });
             let crText = await createRes.text();
             let crData;
             try { crData = JSON.parse(crText); } catch(e) { crData = {}; }
             return NextResponse.json({ success: createRes.ok, data: crData }, { status: createRes.status });
           }
       }
       
       return NextResponse.json({ error: errorMsg, details: data }, { status: res.status });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
