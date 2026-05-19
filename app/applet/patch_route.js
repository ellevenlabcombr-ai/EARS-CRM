const fs = require('fs');
let content = fs.readFileSync('app/api/webhooks/evolution/route.ts', 'utf8');

if (content.length < 1000) {
    console.log('File is small, trying to read from root');
    try {
        content = fs.readFileSync('/app/api/webhooks/evolution/route.ts', 'utf8');
        console.log('Read from root successfully', content.length);
    } catch(e) {
        console.log('Failed to read from root', e.message);
    }
}

const anchor1 = 'const foundBase64 = findBase64(data)';
const anchor2 = 'if (supabaseUrl && supabaseKey) {';

const idx1 = content.indexOf(anchor1);
const idx2 = content.indexOf(anchor2, idx1);

if (idx1 > -1 && idx2 > -1) {
  const before = content.substring(0, idx1);
  const after = content.substring(idx2);
  
  const mid = `const foundBase64 = findBase64(data) || data.base64 || data.message?.base64;
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
                  
                  const base64Res = await fetch(\`\${baseUrl}/chat/getBase64FromMediaMessage/\${settings.evolution_instance_id}\`, {
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
           else if (mediaType === 'audio') type = 'audio/mpeg';
           else if (mediaType === 'video') type = 'video/mp4';
           else if (mediaType === 'document') type = 'application/pdf';
           mediaUrl = \`data:\${type};base64,\${mediaUrl}\`;
         } else {
           mediaUrl = null; // likely weird data
         }
      }

      `;

  fs.writeFileSync('app/api/webhooks/evolution/route.ts', before + mid + after);
  console.log('Replaced successfully');
} else {
  console.log('didnt find anchors');
}
