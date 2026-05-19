import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('Webhook body:', JSON.stringify(body, null, 2));

    // Evolution API sends events like "messages.upsert" or "MESSAGES_UPSERT"
    const event = body.event?.toLowerCase();
    
    if (event === 'messages.upsert' || event === 'messages_upsert') {
      const data = body.data;
      const message = data.message;
      const key = data.key;
      const instance = body.instance;
      
      if (!message || !key) {
        console.log('Missing message or key in data');
        return NextResponse.json({ success: true, warning: 'Missing message or key' });
      }

      const phoneRaw = key.remoteJid.split('@')[0];
      const isFromMe = key.fromMe;
      const messageId = key.id;
      
      let text = '';
      let mediaUrl = null;
      let mediaType = null;

      if (message.conversation) {
        text = message.conversation;
      } else if (message.extendedTextMessage?.text) {
        text = message.extendedTextMessage.text;
      } else if (message.imageMessage) {
        text = message.imageMessage.caption || '';
        mediaType = 'image';
        // Evolution API provides base64 if configured, but here we might just have the metadata
      } else if (message.audioMessage) {
        mediaType = 'audio';
      } else if (message.videoMessage) {
        text = message.videoMessage.caption || '';
        mediaType = 'video';
      } else if (message.stickerMessage) {
        mediaType = 'sticker';
      } else if (message.documentMessage) {
        text = message.documentMessage.caption || message.documentMessage.title || '';
        mediaType = 'document';
      } else if (message.documentWithCaptionMessage?.message?.documentMessage) {
        text = message.documentWithCaptionMessage.message.documentMessage.caption || '';
        mediaType = 'document';
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);

        const cleanPhone = phoneRaw.replace(/\D/g, '');
        const suffix = cleanPhone.slice(-8);

        const { data: athletes } = await supabase
          .from('athletes')
          .select('id')
          .or(`phone.ilike.%${suffix}%,athlete_code.ilike.%${suffix}%`)
          .limit(1);

        const athleteId = athletes && athletes.length > 0 ? athletes[0].id : null;

        await supabase.from('whatsapp_messages').insert({
          athlete_id: athleteId,
          phone_number: cleanPhone,
          direction: isFromMe ? 'outbound' : 'inbound',
          text: text,
          media_url: mediaUrl,
          media_type: mediaType,
          status: isFromMe ? 'sent' : 'received'
        });
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Webhook evolution root error', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
