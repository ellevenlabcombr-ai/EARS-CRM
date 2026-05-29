import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Evolution API sends events like "messages.upsert" or "MESSAGES_UPSERT"
    const event = body.event || body.event_type;
    
    if (event === 'qrcode.updated' || event === 'QRCODE_UPDATED' || event === 'connection.update' || event === 'CONNECTION_UPDATE') {
       const data = body.data || body;
       let qrB64 = data.qrcode?.base64 || data.base64;
       
       if (data.state === 'open' || data.connection === 'open') {
           // We could log that connection is open
           return NextResponse.json({ success: true, message: 'Connection open' });
       }
       
       if (qrB64) {
           if (!qrB64.startsWith('data:image')) {
               qrB64 = 'data:image/png;base64,' + qrB64.replace(/^data:image\/[a-z]+;base64,/, "");
           }
           const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
           const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
           if (supabaseUrl && supabaseKey) {
               const supabase = createClient(supabaseUrl, supabaseKey);
               await supabase.from('whatsapp_messages').delete().eq('phone_number', 'QR_CODE_TEMP');
               await supabase.from('whatsapp_messages').insert({
                   phone_number: 'QR_CODE_TEMP',
                   text: qrB64,
                   direction: 'inbound',
                   status: 'sent'
               });
           }
       }
       return NextResponse.json({ success: true });
    }

    if (event === 'messages.upsert' || event === 'MESSAGES_UPSERT') {
      const data = body.data || body;
      const key = data.key || data.messages?.[0]?.key;
      const messageObj = data.message || data.messages?.[0]?.message;
      
      if (!key || !messageObj) {
         return NextResponse.json({ success: true, warning: 'Missing key or message' });
      }

      const remoteJid = key.remoteJid || data.remoteJid;
      if (!remoteJid) {
         return NextResponse.json({ success: true });
      }

      if (remoteJid.includes('@g.us') || remoteJid.includes('status@broadcast')) {
         return NextResponse.json({ success: true, warning: 'Group/status ignored' });
      }

      const cleanPhone = remoteJid.split('@')[0].replace(/\D/g, '');
      const isFromMe = key.fromMe || false;
      
      let text = '';
      let mediaUrl = null;
      let mediaType = null;

      // Extract text and media
      if (messageObj.conversation) {
        text = messageObj.conversation;
      } else if (messageObj.extendedTextMessage?.text) {
        text = messageObj.extendedTextMessage.text;
      } else if (messageObj.imageMessage) {
        text = messageObj.imageMessage.caption || '';
        mediaType = 'image';
      } else if (messageObj.audioMessage) {
        mediaType = 'audio';
      } else if (messageObj.videoMessage) {
        text = messageObj.videoMessage.caption || '';
        mediaType = 'video';
      } else if (messageObj.stickerMessage) {
        mediaType = 'sticker';
      } else if (messageObj.documentMessage) {
        text = messageObj.documentMessage.caption || messageObj.documentMessage.title || '';
        mediaType = 'document';
      } else if (messageObj.documentWithCaptionMessage?.message?.documentMessage) {
        text = messageObj.documentWithCaptionMessage.message.documentMessage.caption || '';
        mediaType = 'document';
      } else if (typeof messageObj.text === 'string') {
        text = messageObj.text;
      } else if (data.messageValues?.text) {
        text = data.messageValues.text;
      }

      // Check for base64 directly in the message payload
      if (messageObj.imageMessage?.url || messageObj.audioMessage?.url || messageObj.videoMessage?.url || messageObj.documentMessage?.url) {
        mediaUrl = messageObj.imageMessage?.url || messageObj.audioMessage?.url || messageObj.videoMessage?.url || messageObj.documentMessage?.url;
      }
      
      if (body.data?.base64) {
         mediaUrl = body.data.base64;
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
          throw new Error('Missing Supabase credentials');
      }

      const supabase = createClient(supabaseUrl, supabaseKey);

      // Attempt to fetch base64 from API if we only have normal url
      if (mediaType && mediaUrl && mediaUrl.startsWith('http')) {
          try {
              const { data: settings } = await supabase.from('automation_settings')
                  .select('evolution_api_url, evolution_api_key, evolution_instance_id').single();
              
              if (settings && settings.evolution_api_url) {
                  const baseUrl = settings.evolution_api_url.endsWith('/') ? settings.evolution_api_url.slice(0, -1) : settings.evolution_api_url;
                  
                  const base64Res = await fetch(`${baseUrl}/chat/getBase64FromMediaMessage/${settings.evolution_instance_id}`, {
                      method: 'POST',
                      headers: {
                          'Content-Type': 'application/json',
                          'apikey': settings.evolution_api_key || ''
                      },
                      body: JSON.stringify({
                          message: { key, message: messageObj }
                      })
                  });

                  if (base64Res.ok) {
                      const resData = await base64Res.json();
                      if (resData && resData.base64) {
                          mediaUrl = resData.base64;
                      }
                  }
              }
          } catch (e) {
              console.error('Error fetching base64 manually', e);
          }
      }

      // Prepend data: MIME type if just base64 block
      if (mediaUrl && !mediaUrl.startsWith('http') && !mediaUrl.startsWith('data:')) {
         if (mediaUrl.length > 100) {
           let type = 'application/octet-stream';
           if (mediaType === 'image') type = 'image/jpeg';
           else if (mediaType === 'audio') type = 'audio/ogg'; // WhatsApp audios are typically ogg
           else if (mediaType === 'video') type = 'video/mp4';
           mediaUrl = `data:${type};base64,${mediaUrl}`;
         }
      }

      // Find athlete logic
      let athleteId = null;
      let athleteName = "Atleta";
      
      if (cleanPhone && cleanPhone.length >= 8) {
        const cleanPhoneNoCountry = cleanPhone.startsWith('55') ? cleanPhone.slice(2) : cleanPhone;
        const s8 = cleanPhone.slice(-8);
        const s9 = cleanPhone.slice(-9);

        const { data: athletes } = await supabase
          .from('athletes')
          .select('id, name, phone, whatsapp')
          .or(`phone.ilike.%${s8}%,whatsapp.ilike.%${s8}%,phone.ilike.%${s9}%,whatsapp.ilike.%${s9}%,phone.ilike.%${cleanPhoneNoCountry}%,whatsapp.ilike.%${cleanPhoneNoCountry}%`)
          .limit(5);
    
        if (athletes && athletes.length > 0) {
          const bestMatch = athletes.find(a => 
            (a.phone && a.phone.replace(/\D/g, '').endsWith(s9)) || 
            (a.whatsapp && a.whatsapp.replace(/\D/g, '').endsWith(s9))
          ) || athletes[0];

          athleteId = bestMatch.id;
          athleteName = bestMatch.name;
        }
      }

      // Deduplication: 15 seconds window
      let dedupeQuery = supabase
          .from('whatsapp_messages')
          .select('id')
          .eq('direction', isFromMe ? 'outbound' : 'inbound')
          .eq('phone_number', cleanPhone)
          .gte('created_at', new Date(Date.now() - 15000).toISOString());
        
      if (text) {
         dedupeQuery = dedupeQuery.eq('text', text);
      } else if (mediaType) {
         dedupeQuery = dedupeQuery.eq('media_type', mediaType);
      } else {
         dedupeQuery = dedupeQuery.eq('text', '');
      }
      
      const { data: existing } = await dedupeQuery.limit(1);

      if (!existing || existing.length === 0) {
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
           if (insertError.code === '23503' && athleteId) { 
               insertData.athlete_id = null;
               await supabase.from('whatsapp_messages').insert(insertData);
           }
        }

        // AUTO-AI RESPONSE (BACKGROUND)
        if (!isFromMe && process.env.GEMINI_API_KEY && athleteId && (text || mediaType === 'audio')) {
          const runAi = async () => {
            try {
              const { data: settings } = await supabase
                .from('automation_settings')
                .select('whatsapp_auto_ears, evolution_api_url, evolution_api_key, evolution_instance_id')
                .single();

              if (settings?.whatsapp_auto_ears) {
                 const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
                 const systemPrompt = `Você é o Ears, um assistente inteligente de performance esportiva. Você está conversando com o atleta ${athleteName}. Seu objetivo é ajudar sem rodeios. Suas respostas devem ser curtas (estilo WhatsApp). Sempre incentive o atleta.`;
                 
                 const { data: historyData } = await supabase
                   .from('whatsapp_messages')
                   .select('direction, text')
                   .eq('athlete_id', athleteId)
                   .order('created_at', { ascending: false })
                   .limit(8);

                 let contents: any[] = [{ role: 'user', parts: [{ text: "SYSTEM INSTRUCTIONS: " + systemPrompt }] }, { role: 'model', parts: [{ text: "Entendido." }] }];
                 
                 if (historyData && historyData.length > 0) {
                    const chatHistory = historyData.reverse().filter(h => h.text).map(h => ({
                        role: h.direction === 'inbound' ? 'user' : 'model',
                        parts: [{ text: h.text }]
                    }));
                    contents = [...contents, ...chatHistory];
                 }
                 
                 if (mediaType === 'audio' && mediaUrl && mediaUrl.includes('base64,')) {
                    const mime = mediaUrl.split(';')[0].split(':')[1];
                    const b64 = mediaUrl.split(',')[1];
                    contents.push({ 
                       role: 'user', 
                       parts: [
                         { text: text || '(Audio enviado pelo atleta)' },
                         { inlineData: { mimeType: mime, data: b64 } }
                       ] 
                    });
                 } else {
                    if (text || historyData?.length === 0) {
                        contents.push({ role: 'user', parts: [{ text: text || '(enviou um arquivo)' }] });
                    }
                 }

                 console.log('[AI] Running response generation...');
                 const aiResult = await ai.models.generateContent({
                    model: "gemini-1.5-flash",
                    contents: contents,
                    config: { maxOutputTokens: 250, temperature: 0.7 }
                 });

                 const aiReply = aiResult.text || "Continue focado no seu treino!";

                 if (aiReply && settings.evolution_api_url) {
                    // Send to EVOLUTION API directly using settings info
                    const baseUrl = settings.evolution_api_url.endsWith('/') ? settings.evolution_api_url.slice(0, -1) : settings.evolution_api_url;
                    await fetch(`${baseUrl}/message/sendText/${settings.evolution_instance_id}`, {
                       method: 'POST',
                       headers: {
                          'Content-Type': 'application/json',
                          'apikey': settings.evolution_api_key || ''
                       },
                       body: JSON.stringify({ number: cleanPhone, text: aiReply })
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
          };

          runAi(); 
        }
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Webhook evolution root error', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
