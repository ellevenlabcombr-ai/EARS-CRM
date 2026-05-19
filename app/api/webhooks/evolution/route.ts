import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('Webhook body:', JSON.stringify(body, null, 2));

    // Evolution API sends events like "messages.upsert" or "MESSAGES_UPSERT"
    const event = body.event?.toLowerCase();
    
    if (event === 'messages.upsert' || event === 'messages_upsert' || event === 'messages.upsert_v2') {
      const data = body.data;
      if (!data) return NextResponse.json({ success: true, warning: 'No data' });
      
      const message = data.message;
      const key = data.key;
      const instance = body.instance;
      
      if (!message || !key) {
        console.log('Missing message or key in data');
        return NextResponse.json({ success: true, warning: 'Missing message or key' });
      }

      const remoteJid = key.remoteJid;
      const phoneRaw = remoteJid.split('@')[0];
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

      // If it's the sender, we might need the media URL.
      // Evolution can be configured to send as base64 or link.
      if (data.messageValues?.image?.url || data.messageValues?.base64) {
         mediaUrl = data.messageValues?.image?.url || data.messageValues?.base64;
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);

        const cleanPhone = phoneRaw.replace(/\D/g, '');
        // Last 8 digits match
        const suffix = cleanPhone.length >= 8 ? cleanPhone.slice(-8) : cleanPhone;

        // Try to find athlete
        let athleteId = null;
        if (suffix) {
          const { data: athletes } = await supabase
            .from('athletes')
            .select('id')
            .or(`phone.ilike.%${suffix}%,whatsapp.ilike.%${suffix}%,athlete_code.ilike.%${suffix}%`)
            .limit(1);
          
          if (athletes && athletes.length > 0) {
            athleteId = athletes[0].id;
          }
        }

        // Check if message already exists
        const { data: existing } = await supabase
          .from('whatsapp_messages')
          .select('id')
          .eq('status', isFromMe ? 'sent' : 'received')
          .eq('text', text || '')
          .eq('phone_number', cleanPhone)
          .gte('created_at', new Date(Date.now() - 5000).toISOString()) // look back 5s
          .limit(1);

        if (!existing || existing.length === 0) {
          const { error: insertError } = await supabase.from('whatsapp_messages').insert({
            athlete_id: athleteId,
            phone_number: cleanPhone,
            direction: isFromMe ? 'outbound' : 'inbound',
            text: text,
            media_url: mediaUrl,
            media_type: mediaType,
            status: isFromMe ? 'sent' : 'received'
          });
          
          if (insertError) console.error('Supabase Insert Error:', insertError);
        }
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Webhook evolution root error', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
