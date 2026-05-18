import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { url, apiKey, instanceId, message, phone } = await req.json();

    if (!url || !instanceId || !message || !phone) {
      return NextResponse.json({ error: 'Faltam par�nmetros obrigatórios. Verifique URL, Instância, Telefone e Mensagem.' }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\D/g, '');
    const baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
    const endpoint = `${baseUrl}/message/sendText/${instanceId}`;
    
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": apiKey || "",
      },
      body: JSON.stringify({
        number: cleanPhone,
        text: message,
        options: {
          delay: 1200,
          presence: "composing",
        }
      })
    };

    const res = await fetch(endpoint, options);
    const data = await res.json();
    
    if (!res.ok) {
       return NextResponse.json({ error: data.response?.message?.[1] || data.response?.message?.[0] || data.message || 'Erro na Evolution API', details: data }, { status: res.status });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
