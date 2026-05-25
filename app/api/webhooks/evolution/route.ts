import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('Webhook body:', JSON.stringify(body, null, 2));

    // Evolution API sends events like "messages.upsert" or "MESSAGES_UPSERT"
    const event = body.event?.toLowerCase() || '';
    
    // Handle QR code and connection updates
    if (event === 'qrcode.updated' || event === 'connection.update') {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (supabaseUrl && supabaseKey) {
            const supabase = createClient(supabaseUrl, supabaseKey);
            
            let qrBase64 = null;
            if (body.data?.qrcode?.base64) {
                qrBase64 = body.data.qrcode.base64;
            } else if (body.qrcode?.base64) {
                qrBase64 = body.qrcode.base64;
            } else if (body.base64) {
                qrBase64 = body.base64;
            }

            if (qrBase64) {
               await supabase.from('automation_settings')
                  .update({ evolution_qr_base64: qrBase64 })
                  .neq('id', 'INVALID');
            } else if (body.data?.state === 'open' || body.instance?.state === 'open') {
               // Connection established, clear the QR code
               await supabase.from('automation_settings')
                  .update({ evolution_qr_base64: null })
                  .neq('id', 'INVALID');
            }
        }
        return NextResponse.json({ success: true, warning: 'Connection updated' });
    }

    const isMessageEvent = event.includes('message') || event.includes('upsert') || body.data?.message || body.message;

    if (isMessageEvent) {
      const data = body.data || body;
      if (!data) return NextResponse.json({ success: true, warning: 'No data' });
      
      const key = data.key || data.message?.key || data.messages?.[0]?.key;
      const content = data.message?.message || data.messages?.[0]?.message || data.message || data;
      
      if (!key) {
        console.log('Missing key in data');
        return NextResponse.json({ success: true, warning: 'Missing key' });
      }

      const remoteJid = key.remoteJid || data.remoteJid || data.messages?.[0]?.key?.remoteJid;
      if (!remoteJid) {
         console.log('Missing remoteJid');
         return NextResponse.json({ success: true });
      }

      if (remoteJid.includes('@g.us') || remoteJid.includes('status@broadcast')) {
         return NextResponse.json({ success: true, warning: 'Group or status message ignored' });
      }

      const phoneRaw = remoteJid.split('@')[0];
      const isFromMe = key.fromMe || false;
      
      let text = '';
      let mediaUrl = null;
      let mediaType = null;

      // Extract text from various possible fields
      if (content.conversation) {
        text = content.conversation;
      } else if (content.extendedTextMessage?.text) {
        text = content.extendedTextMessage.text;
      } else if (content.imageMessage) {
        text = content.imageMessage.caption || '';
        mediaType = 'image';
      } else if (content.audioMessage) {
        mediaType = 'audio';
      } else if (content.videoMessage) {
        text = content.videoMessage.caption || '';
        mediaType = 'video';
      } else if (content.stickerMessage) {
        mediaType = 'sticker';
      } else if (content.documentMessage) {
        text = content.documentMessage.caption || content.documentMessage.title || '';
        mediaType = 'document';
      } else if (content.documentWithCaptionMessage?.message?.documentMessage) {
        text = content.documentWithCaptionMessage.message.documentMessage.caption || '';
        mediaType = 'document';
      } else if (typeof content.text === 'string') {
        text = content.text;
      } else if (data.messageValues?.text) {
        text = data.messageValues.text;
      } else if (data.messages?.[0]?.message?.extendedTextMessage?.text) {
        text = data.messages[0].message.extendedTextMessage.text;
      } else if (data.messages?.[0]?.message?.conversation) {
        text = data.messages[0].message.conversation;
      }

      // Helper to recursively find base64 string in payload
      const findBase64 = (obj: any): string | null => {
         if (!obj || typeof obj !== 'object') return null;
         if (obj.base64 && typeof obj.base64 === 'string' && obj.base64.length > 50) return obj.base64;
         for (const key of Object.keys(obj)) {
             const res = findBase64(obj[key]);
             if (res) return res;
         }
         return null;
      };

      // Extraction of media URL
      const foundBase64 = findBase64(data) || data.base64 || data.message?.base64;
      if (foundBase64) {
        mediaUrl = foundBase64;
      } else if (content.imageMessage?.url || content.audioMessage?.url || content.videoMessage?.url || content.documentMessage?.url) {
        mediaUrl = content.imageMessage?.url || content.audioMessage?.url || content.videoMessage?.url || content.documentMessage?.url;
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      // If we only have the encrypted URL, try to fetch base64 from the API manually
      if (mediaType && mediaUrl && mediaUrl.startsWith('http') && supabaseUrl && supabaseKey) {
          try {
              const supabaseBase64 = createClient(supabaseUrl, supabaseKey);
              const { data: settings } = await supabaseBase64.from('automation_settings')
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
                          message: {
                             key: key,
                             message: content
                          }
                      })
                  });

                  if (base64Res.ok) {
                      const resData = await base64Res.json();
                      if (resData && resData.base64) {
                          mediaUrl = resData.base64;
                      }
                  } else {
                      console.log('Failed to fetch base64 manually', base64Res.status, await base64Res.text());
                  }
              }
          } catch (e) {
              console.error('Error fetching base64 manually', e);
          }
      }

      // Ensure base64 can be rendered in the frontend
      if (mediaUrl && !mediaUrl.startsWith('http') && !mediaUrl.startsWith('data:')) {
         if (mediaUrl.length > 100) {
           let type = 'application/octet-stream';
           if (mediaType === 'image') type = 'image/jpeg';
           else if (mediaType === 'audio') type = 'audio/ogg'; // WhatsApp sends OGG
           else if (mediaType === 'video') type = 'video/mp4';
           else if (mediaType === 'document') type = 'application/pdf';
           mediaUrl = `data:${type};base64,${mediaUrl}`;
         } else {
           mediaUrl = null; // likely weird data
         }
      }

      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);

        await supabase.from('test_logs').insert([{ log_data: data }]);

        const cleanPhone = phoneRaw.replace(/\D/g, '');
        // Try to find athlete
        let athleteId = null;
        let athleteName = "Atleta";
        
        if (cleanPhone && cleanPhone.length >= 8) {
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
        }

        // Check if message already exists (de-duplication)
        let dedupeQuery = supabase
          .from('whatsapp_messages')
          .select('id')
          .eq('direction', isFromMe ? 'outbound' : 'inbound')
          .ilike('phone_number', `%${cleanPhone.slice(-8)}`)
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

          // AUTO-AI RESPONSE (BACKGROUND)
          if (!isFromMe && process.env.GEMINI_API_KEY && athleteId && (text || mediaType === 'audio')) {
            const runAi = async () => {
              try {
                const { data: settings } = await supabase
                  .from('automation_settings')
                  .select('whatsapp_auto_ears, evolution_api_url, evolution_api_key, evolution_instance_id')
                  .single();

                if (settings?.whatsapp_auto_ears) {
                   console.log(`[AI] Attempting auto-reply for ${athleteName}`);
                   
                   const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
                   const systemPrompt = `Você é o Ears, um assistente inteligente de performance esportiva. Você está conversando com o atleta ${athleteName}. Seu objetivo é ajudar sem rodeios. Suas respostas devem ser curtas (estilo WhatsApp). Sempre incentive o atleta.`;
                   
                   // Fetch last 10 messages for context
                   const { data: historyData } = await supabase
                     .from('whatsapp_messages')
                     .select('direction, text')
                     .eq('athlete_id', athleteId)
                     .order('created_at', { ascending: false })
                     .limit(8);

                   let contents = [{ role: 'user', parts: [{ text: "SYSTEM INSTRUCTIONS: " + systemPrompt }] }, { role: 'model', parts: [{ text: "Entendido." }] }];
                   
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
                      if (text || historyData.length === 0) {
                          contents.push({ role: 'user', parts: [{ text: text || '(enviou um arquivo)' }] });
                      }
                   }

                   const aiResult = await ai.models.generateContent({
                      model: "gemini-1.5-flash",
                      contents: contents as any,
                      config: { maxOutputTokens: 250, temperature: 0.7 }
                   });

                   const aiReply = aiResult.text || "Continue focado no seu treino!";
                   console.log(`[AI] Response generated:`, aiReply);

                   if (aiReply && settings.evolution_api_url) {
                      const sendProtocol = req.url.split('/api/')[0];
                      await fetch(`${sendProtocol}/api/whatsapp/send`, {
                         method: 'POST',
                         headers: { 'Content-Type': 'application/json' },
                         body: JSON.stringify({
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
            };

            // Run in background to prevent webhook timeout
            runAi();
          }
        }
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Webhook evolution root error', error);
    // Always return 200 to Evolution to prevent instance restarts / webhook loops
    return NextResponse.json({ success: true, error: error.message }, { status: 200 });
  }
}
