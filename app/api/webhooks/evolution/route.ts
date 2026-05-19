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

      // Evolution API can send media in several ways. v2 usually sends base64 or a link in data.messageValues
      if (data.messageValues?.base64) {
        mediaUrl = data.messageValues.base64;
      } else if (data.messageValues?.url) {
        mediaUrl = data.messageValues.url;
      } else if (data.message?.imageMessage?.url || data.message?.audioMessage?.url) {
        // If it's a direct URL from WhatsApp (needs decryption usually, but Evolution often handles it)
        mediaUrl = data.message?.imageMessage?.url || data.message?.audioMessage?.url;
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);

        const cleanPhone = phoneRaw.replace(/\D/g, '');
        // Last 8 or 9 digits match (handling differences in 9th digit in Brazil)
        const suffix8 = cleanPhone.slice(-8);
        const suffix9 = cleanPhone.slice(-9);

        // Try to find athlete
        let athleteId = null;
        const { data: athletes } = await supabase
          .from('athletes')
          .select('id, phone')
          .or(`phone.ilike.%${suffix8}%,whatsapp.ilike.%${suffix8}%`)
          .limit(1);
        
        if (athletes && athletes.length > 0) {
          athleteId = athletes[0].id;
        }

        // If not found by suffix, try exact clean phone if matches
        if (!athleteId) {
           const { data: athletesExact } = await supabase
            .from('athletes')
            .select('id')
            .eq('phone', cleanPhone)
            .limit(1);
           if (athletesExact && athletesExact.length > 0) athleteId = athletesExact[0].id;
        }

        // Check if message already exists (de-duplication)
        const { data: existing } = await supabase
          .from('whatsapp_messages')
          .select('id')
          .eq('direction', isFromMe ? 'outbound' : 'inbound')
          .eq('phone_number', cleanPhone)
          .eq('text', text || '')
          .gte('created_at', new Date(Date.now() - 3000).toISOString())
          .limit(1);

        if (!existing || existing.length === 0) {
          console.log(`Inserting message for athlete: ${athleteId}, phone: ${cleanPhone}`);
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
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Webhook evolution root error', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
