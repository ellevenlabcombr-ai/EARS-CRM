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
      endpoint = `${baseUrl}/instance/connect/${instanceId}`;
      options.method = "GET"; 
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
      if (!origin && req.headers.get("host")) {
        const host = req.headers.get("host");
        const protocol = host?.includes('localhost') ? 'http' : 'https';
        origin = `${protocol}://${host}`;
      }
      
      const webhookUrl = `${origin}/api/webhooks/evolution`;

      endpoint = `${baseUrl}/webhook/set/${instanceId}`;
      options.method = "POST";
      options.body = JSON.stringify({
        enabled: true,
        url: webhookUrl,
        webhook_by_events: true, // Set to true to use the specific events list below
        events: [
          "MESSAGES_UPSERT", 
          "MESSAGES_UPDATE", 
          "MESSAGES_DELETE", 
          "SEND_MESSAGE",
          "messages.upsert",
          "messages.update",
          "messages.delete",
          "messages.send"
        ]
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
       return NextResponse.json({ error: errorMsg, details: data }, { status: res.status });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
