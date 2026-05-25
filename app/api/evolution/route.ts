import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { url, apiKey, instanceId, action } = await req.json();

    if (!url || !instanceId || !action) {
      return NextResponse.json({ error: 'Faltam parâmetros obrigatórios. Verifique URL, Instância e Action.' }, { status: 400 });
    }

    const baseUrl = url.replace(/\/+$/, "");
    let endpoint = "";
    let options: any = {
      headers: {
        "Content-Type": "application/json",
        "apikey": apiKey || "",
      }
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
         headers: options.headers
      });
      let cText = await cRes.text();
      let cData;
      try { cData = JSON.parse(cText); } catch(e) { cData = {}; }

      if (cRes.ok && (cData?.base64 || cData?.qrcode?.base64 || cData?.hash?.base64)) {
         return NextResponse.json({ success: true, data: cData });
      }

      // If failed or count: 0, it means it's stuck. Delete and recreate.
      await fetch(`${baseUrl}/instance/logout/${instanceId}`, { method: "DELETE", headers: options.headers }).catch(() => {});
      await fetch(`${baseUrl}/instance/delete/${instanceId}`, { method: "DELETE", headers: options.headers }).catch(() => {});

      const createRes = await fetch(`${baseUrl}/instance/create`, {
        method: "POST",
        headers: options.headers,
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
                 events: ["MESSAGES_UPSERT", "MESSAGES_UPDATE", "SEND_MESSAGE"]
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
            "SEND_MESSAGE"
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
             headers: options.headers
           });
           let cText = await cRes.text();
           let cData;
           try { cData = JSON.parse(cText); } catch(e) { cData = {}; }
           
           if (cRes.ok && (cData?.base64 || cData?.qrcode?.base64 || cData?.hash?.base64)) {
             return NextResponse.json({ success: true, data: cData });
           } else {
             return NextResponse.json({ success: true, data: cData });
           }
       }
       
       return NextResponse.json({ error: errorMsg, details: data }, { status: res.status });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
