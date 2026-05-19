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

      // Extraction of media URL
      // Evolution API v2: media values are often in data.messageValues
      if (data.messageValues?.base64) {
        mediaUrl = data.messageValues.base64;
      } else if (data.messageValues?.url) {
        mediaUrl = data.messageValues.url;
      } else if (message.imageMessage?.url || message.audioMessage?.url || message.videoMessage?.url) {
        mediaUrl = message.imageMessage?.url || message.audioMessage?.url || message.videoMessage?.url;
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);

        const cleanPhone = phoneRaw.replace(/\D/g, '');
        // Extract many possible suffixes
        const s8 = cleanPhone.slice(-8);
        const s9 = cleanPhone.slice(-9);

        // Try to find athlete
        let athleteId = null;
        let athleteName = "Atleta";
        
        // Match by multiple possible versions of the suffix
        const { data: athletes } = await supabase
          .from('athletes')
          .select('id, name, phone, whatsapp')
          .or(`phone.ilike.%${s8}%,whatsapp.ilike.%${s8}%,phone.ilike.%${s9}%,whatsapp.ilike.%${s9}%`)
          .limit(5); // Get a few to filter manually if needed
        
        if (athletes && athletes.length > 0) {
          // Priority to those that match s9 or exact
          const bestMatch = athletes.find(a => 
            (a.phone && a.phone.replace(/\D/g, '').endsWith(s9)) || 
            (a.whatsapp && a.whatsapp.replace(/\D/g, '').endsWith(s9))
          ) || athletes[0];

          athleteId = bestMatch.id;
          athleteName = bestMatch.name;
        }

        // Check if message already exists (de-duplication)
        const { data: existing } = await supabase
          .from('whatsapp_messages')
          .select('id')
          .eq('direction', isFromMe ? 'outbound' : 'inbound')
          .eq('phone_number', cleanPhone)
          .eq('text', text || '')
          .gte('created_at', new Date(Date.now() - 5000).toISOString())
          .limit(1);

        if (!existing || existing.length === 0) {
          console.log(`[RECEPTION] New message from ${cleanPhone}. Linking to athlete ${athleteId || 'NONE'}`);
          await supabase.from('whatsapp_messages').insert({
            athlete_id: athleteId,
            phone_number: cleanPhone,
            direction: isFromMe ? 'outbound' : 'inbound',
            text: text,
            media_url: mediaUrl,
            media_type: mediaType,
            status: isFromMe ? 'sent' : 'received'
          });

          // AUTO-AI RESPONSE
          if (!isFromMe && process.env.GEMINI_API_KEY && athleteId && text) {
            try {
              const { data: settings } = await supabase
                .from('automation_settings')
                .select('whatsapp_auto_ears, evolution_api_url, evolution_api_key, evolution_instance_id')
                .single();

              if (settings?.whatsapp_auto_ears) {
                 const chatRes = await fetch(`${req.url.split('/api/')[0]}/api/ears/chat`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      messages: [{ direction: 'inbound', text: text }],
                      athleteName: athleteName
                    })
                 });
                 const aiData = await chatRes.json();
                 const aiReply = aiData.text;

                 if (aiReply && settings.evolution_api_url) {
                    await fetch(`${req.url.split('/api/')[0]}/api/whatsapp/send`, {
                       method: 'POST',
                       headers: { 'Content-Type': 'application/json' },
                       body: JSON.stringify({
                          url: settings.evolution_api_url,
                          apiKey: settings.evolution_api_key,
                          instanceId: settings.evolution_instance_id,
                          phone: cleanPhone,
                          message: aiReply
                       })
                    });
                    
                    await supabase.from('whatsapp_messages').insert({
                       athlete_id: athleteId,
                       phone_number: cleanPhone,
                       direction: 'outbound',
                       text: aiReply,
                       status: 'sent'
                    });
                 }
              }
            } catch (err) { console.error('Auto-AI error', err); }
          }
        }
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Webhook evolution root error', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
