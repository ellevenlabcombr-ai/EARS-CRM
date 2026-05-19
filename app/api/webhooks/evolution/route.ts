import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Evolution API typically sends events like "messages.upsert"
    const event = body.event;
    
    if (event === 'messages.upsert') {
      const data = body.data;
      const message = data.message;
      const key = data.key;
      
      const phoneRaw = key.remoteJid.split('@')[0];
      const isFromMe = key.fromMe;
      
      let text = '';
      if (message.conversation) {
        text = message.conversation;
      } else if (message.extendedTextMessage?.text) {
        text = message.extendedTextMessage.text;
      }

      if (text) {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (supabaseUrl && supabaseKey) {
          const supabase = createClient(supabaseUrl, supabaseKey);

          // Find athlete by phone
          // phone formats can vary (with or without 55, or 9 digit vs 8 digit).
          // We will store the message and try to link if we find
          const cleanPhone = phoneRaw.replace(/\D/g, '');

          // We query athletes where phone ends with the last 8 digits of cleanPhone
          const suffix = cleanPhone.slice(-8);

          const { data: athletes } = await supabase
            .from('athletes')
            .select('id, phone')
            .like('phone', `%${suffix}%`)
            .limit(1);

          const athleteId = athletes && athletes.length > 0 ? athletes[0].id : null;

          await supabase.from('whatsapp_messages').insert({
            athlete_id: athleteId,
            phone_number: cleanPhone,
            direction: isFromMe ? 'outbound' : 'inbound',
            text: text,
            status: isFromMe ? 'sent' : 'received'
          });
        }
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Webhook evolution root error', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
