import fetch from 'node-fetch';

async function test() {
  const url = 'https://evolution-api-production-2b75.up.railway.app/';
  const apiKey = '7d68fb0591cabd81969a40228e984a2e6d1e7a6f96cbc6584c97328fcfd46bbb';
  const instanceId = 'elleven';

  const baseUrl = url.replace(/\/+$/, "");
  let endpoint = `${baseUrl}/message/sendMedia/${instanceId}`;
  
  let body1 = {
    number: "5511999999999",
    mediaMessage: {
        mediatype: "image",
        media: "https://picsum.photos/200/300",
        caption: "Test"
    }
  };

  const options = {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": apiKey },
      body: JSON.stringify(body1),
  };

  const res = await fetch(endpoint, options);
  console.log('Testing payload with mediaMessage:', res.status, await res.text());
  
  let body2 = {
    number: "5511999999999",
    mediatype: "image",
    media: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    caption: "Test"
  };
  options.body = JSON.stringify(body2);
  const res2 = await fetch(endpoint, options);
  console.log('Testing payload with base64:', res2.status, await res2.text());
}
test();
