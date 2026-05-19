import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(url, key);

async function check() {
  const body = {
    "event": "messages.upsert",
    "instance": "test",
    "data": {
      "key": {
        "remoteJid": "551199999999@s.whatsapp.net",
        "fromMe": false,
        "id": "12345"
      },
      "message": {
        "conversation": "Mensagem de teste do webhook script!"
      }
    }
  };

    const event = body.event?.toLowerCase() || '';
    const isMessageEvent = event.includes('message') || event.includes('upsert') || body.data?.message || body.message;

    if (isMessageEvent) {
      const data = body.data || body;
      const keyObj = data.key || data.message?.key || data.messages?.[0]?.key;
      const content = data.message?.message || data.messages?.[0]?.message || data.message || data;
      
      console.log('keyObj:', keyObj);
      console.log('content:', content);

      const remoteJid = keyObj?.remoteJid || data.remoteJid || data.messages?.[0]?.key?.remoteJid;
      console.log('remoteJid:', remoteJid);

      const phoneRaw = remoteJid.split('@')[0];
      const isFromMe = keyObj?.fromMe || false;
      const cleanPhone = phoneRaw.replace(/\D/g, '');
      console.log('cleanPhone:', cleanPhone);

      let text = '';
      if (content.conversation) text = content.conversation;
      console.log('text:', text);

      const { data: existing } = await supabase
          .from('whatsapp_messages')
          .select('id')
          .eq('direction', isFromMe ? 'outbound' : 'inbound')
          .eq('phone_number', cleanPhone)
          .eq('text', text || '')
          .gte('created_at', new Date(Date.now() - 5000000).toISOString())
          .limit(1);

      console.log('existing:', existing);

      if (!existing || existing.length === 0) {
          let insertData = {
            athlete_id: null,
            phone_number: cleanPhone,
            direction: isFromMe ? 'outbound' : 'inbound',
            text: text,
            media_url: null,
            media_type: null,
            status: isFromMe ? 'sent' : 'received'
          };
          
          const { error: insertError, data: insertRet } = await supabase.from('whatsapp_messages').insert(insertData).select('*');
          console.log('insertError:', insertError);
          console.log('insertRet:', insertRet);
      }
    }
}

check();
