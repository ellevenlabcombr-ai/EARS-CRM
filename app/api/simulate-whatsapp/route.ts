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
        textMessage: { text: message },
        options: {
          delay: 1200,
          presence: "composing",
        }
      })
    };

    const res = await fetch(endpoint, options);
    const data = await res.json();
    
    if (!res.ok) {
       let errorMsg = 'Erro na Evolution API§';
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
