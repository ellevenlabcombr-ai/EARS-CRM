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
      options.method = "GET"; // connect is usually GET in Evolution? wait, let's use the UI docs. evolution api connect is GET.
    } else if (action === "status") {
      endpoint = `${baseUrl}/instance/connectionState/${instanceId}`;
      options.method = "GET";
    } else if (action === "logout") {
      endpoint = `${baseUrl}/instance/logout/${instanceId}`;
      options.method = "DELETE";
    } else if (action === "delete") {
      endpoint = `${baseUrl}/instance/delete/${instanceId}`;
      options.method = "DELETE";
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
       return NextResponse.json({ error: data.response?.message?.[0] || data.message || data.error || 'Erro na Evolution API', details: data }, { status: res.status });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
