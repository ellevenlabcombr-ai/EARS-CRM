import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('Webhook body:', JSON.stringify(body, null, 2));

    // Evolution API sends events like "messages.upsert" or "MESSAGES_UPSERT"
    const event = body.event?.toLowerCase() || '';
    
    const isMessageEvent = event.includes('message') || event.includes('upsert') || body.data?.message || body.message;

    if (isMessageEvent) {
      const data = body.data || body;
      if (!data) return NextResponse.json({ success: true, warning: 'No data' });
      
      const message = data.message || data;
      const key = data.key || data.message?.key;
      
      if (!key) {
        console.log('Missing key in data');
        return NextResponse.json({ success: true, warning: 'Missing key' });
      }

      const remoteJid = key.remoteJid || data.remoteJid;
      if (!remoteJid) {
         console.log('Missing remoteJid');
         return NextResponse.json({ success: true });
      }

      const phoneRaw = remoteJid.split('@')[0];
      const isFromMe = key.fromMe;
      
      let text = '';
      let mediaUrl = null;
      let mediaType = null;

      // Extract text from various possible fields
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
      } else if (typeof message.text === 'string') {
        text = message.text;
      } else if (data.messageValues?.text) {
        text = data.messageValues.text;
      }

      // Extraction of media URL
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
        // Try to find athlete
        let athleteId = null;
        let athleteName = "Atleta";
        
        const cleanPhoneNoCountry = cleanPhone.startsWith('55') ? cleanPhone.slice(2) : cleanPhone;
        const s8 = cleanPhone.slice(-8);
        const s9 = cleanPhone.slice(-9);

        // Match by multiple possible versions
        const { data: athletes } = await supabase
          .from('athletes')
          .select('id, name, phone, whatsapp')
          .or(`phone.ilike.%${s8}%,whatsapp.ilike.%${s8}%,phone.ilike.%${s9}%,whatsapp.ilike.%${s9}%,phone.ilike.%${cleanPhoneNoCountry}%,whatsapp.ilike.%${cleanPhoneNoCountry}%`)
          .limit(5);
        
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
          console.log(`[RECEPTION] New message from ${cleanPhone}. Linking to athlete ${athleteId || 'NONE'} (text: ${text || mediaType})`);
          
          let insertData = {
            athlete_id: athleteId,
            phone_number: cleanPhone,
            direction: isFromMe ? 'outbound' : 'inbound',
            text: text,
            media_url: mediaUrl,
            media_type: mediaType,
            status: isFromMe ? 'sent' : 'received'
          };
          
          const { error: insertError } = await supabase.from('whatsapp_messages').insert(insertData);
          
          if (insertError) {
             console.error('[RECEPTION] Insert Error:', insertError);
             if (insertError.code === '23503' && athleteId) { // Foreign key violation
                 console.log('Foreign key violation, trying to insert without athleteId...');
                 insertData.athlete_id = null;
                 await supabase.from('whatsapp_messages').insert(insertData);
             }
          }

          // AUTO-AI RESPONSE
          if (!isFromMe && process.env.GEMINI_API_KEY && athleteId && text) {
            try {
              const { data: settings } = await supabase
                .from('automation_settings')
                .select('whatsapp_auto_ears, evolution_api_url, evolution_api_key, evolution_instance_id')
                .single();

              if (settings?.whatsapp_auto_ears) {
                 console.log(`[AI] Attempting auto-reply for ${athleteName}`);
                 
                 const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
                 const systemPrompt = `Você é o Ears, um assistente inteligente de performance esportiva. Você está conversando com o atleta ${athleteName}. Seu objetivo é ser empático, direto e técnico quando necessário. Suas respostas devem ser curtas (estilo WhatsApp). Sempre incentive o atleta.`;
                 
                 const aiResult = await ai.models.generateContent({
                    model: "gemini-1.5-flash",
                    contents: [
                      { role: 'user', parts: [{ text: systemPrompt }] },
                      { role: 'user', parts: [{ text: text }] }
                    ],
                    config: { maxOutputTokens: 200, temperature: 0.7 }
                 });

                 const aiReply = aiResult.text || "Continue focado no seu treino!";

                 console.log(`[AI] Response generated:`, aiReply);

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
