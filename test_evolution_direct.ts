import fetch from 'node-fetch';

async function test() {
  const url = 'https://evolution-api-production-2b75.up.railway.app/';
  const apiKey = '7d68fb0591cabd81969a40228e984a2e6d1e7a6f96cbc6584c97328fcfd46bbb';
  const instanceId = 'elleven';

  const baseUrl = url.replace(/\/+$/, "");
  let endpoint = `${baseUrl}/message/sendMedia/${instanceId}`;
  
  const base64Str = 'iBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

  let body3 = {
    number: "5511999999999",
    mediaMessage: {
        mediatype: "image",
        media: base64Str,
        caption: "Test"
    }
  };
  let body4 = {
    number: "5511999999999",
    mediatype: "image",
    media: base64Str,
    caption: "Test"
  };
  
  const res1 = await fetch(endpoint, {
      method: 'POST',
      headers: { "Content-Type": "application/json", "apikey": apiKey },
      body: JSON.stringify(body3)
  });
  console.log('Test body3:', res1.status, await res1.text());

  const res2 = await fetch(endpoint, {
      method: 'POST',
      headers: { "Content-Type": "application/json", "apikey": apiKey },
      body: JSON.stringify(body4)
  });
  console.log('Test body4:', res2.status, await res2.text());
}
test();
