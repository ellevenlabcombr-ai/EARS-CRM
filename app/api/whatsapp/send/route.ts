import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const bodyPayload = await req.json();
    const { phone, message, mediaUrl, mediaType, fileName } = bodyPayload;

    if (!phone || !message) {
      return NextResponse.json({ error: 'Faltam parametros: phone ou message' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
       return NextResponse.json({ error: 'Supabase credentials missing.' }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: settings, error: settingsError } = await supabase
        .from('automation_settings')
        .select('*')
        .maybeSingle();

    if (settingsError || !settings) {
        return NextResponse.json({ error: 'Automacoes nao configuradas ou erro ao buscar.' }, { status: 400 });
    }

    if (!settings.whatsapp_enabled) {
        return NextResponse.json({ error: 'WhatsApp esta desativado nas configuracoes.' }, { status: 400 });
    }

    if (settings.whatsapp_provider !== 'evolution') {
        return NextResponse.json({ error: 'Provedor de WhatsApp nao suportado por esta rota.' }, { status: 400 });
    }

    const url = settings.evolution_api_url;
    const apiKey = settings.evolution_api_key;
    const instanceId = settings.evolution_instance_id;

    if (!url || !instanceId) {
        return NextResponse.json({ error: 'Credenciais da Evolution API estao incompletas nas configuracoes.' }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\D/g, '');
    const finalPhone = cleanPhone.startsWith('55') ? cleanPhone : '55' + cleanPhone;

    const baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
    let endpoint = `${baseUrl}/message/sendText/${instanceId}`;
    let body: any = {
      number: finalPhone,
      options: {
        delay: 1200,
        presence: "composing",
      }
    };

    // media params extracted above

    if (mediaUrl && mediaType) {
      if (mediaType === 'image') {
        endpoint = `${baseUrl}/message/sendMedia/${instanceId}`;
        body.image = mediaUrl;
        body.caption = message || "";
        body.mediaType = "image";
      } else if (mediaType === 'audio') {
        endpoint = `${baseUrl}/message/sendWhatsAppAudio/${instanceId}`;
        body.audio = mediaUrl;
        body.mediaType = "audio";
      } else if (mediaType === 'document' || mediaType === 'video') {
        endpoint = `${baseUrl}/message/sendMedia/${instanceId}`;
        body.media = mediaUrl;
        body.caption = message || "";
        body.mediaType = mediaType;
        body.fileName = fileName || "arquivo";
      }
    } else {
      body.text = message;
      body.textMessage = { text: message };
    }
    
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": apiKey || "",
      },
      body: JSON.stringify(body)
    };

    const res = await fetch(endpoint, options);
    const data = await res.json();
    
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
