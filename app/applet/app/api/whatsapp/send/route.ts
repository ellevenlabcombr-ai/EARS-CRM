import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const { phone, message } = await req.json();

    if (!phone || !message) {
      return NextResponse.json({ error: 'Faltam parâmetros: phone ou message' }, { status: 400 });
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
        return NextResponse.json({ error: 'Automações não configuradas ou erro ao buscar.' }, { status: 400 });
    }

    if (!settings.whatsapp_enabled) {
        return NextResponse.json({ error: 'WhatsApp está desativado nas configurações.' }, { status: 400 });
    }

    if (settings.whatsapp_provider !== 'evolution') {
        return NextResponse.json({ error: `Provedor de WhatsApp '${settings.whatsapp_provider}' não suportado por esta rota.` }, { status: 400 });
    }

    const url = settings.evolution_api_url;
    const apiKey = settings.evolution_api_key;
    const instanceId = settings.evolution_instance_id;

    if (!url || !instanceId) {
        return NextResponse.json({ error: 'Credenciais da Evolution API estão incompletas nas configurações.' }, { status: 400 });
    }

    const cleanPhone = phone.replace(/\D/g, '');
    const finalPhone = cleanPhone.startsWith('55') ? cleanPhone : '55' + cleanPhone;

    const baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
    const endpoint = `${baseUrl}/message/sendText/${instanceId}`;
    
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": apiKey || "",
      },
      body: JSON.stringify({
        number: finalPhone,
        text: message,
        options: {
          delay: 1200,
          presence: 'composing',
          linkPreview: true
        }
      })
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
