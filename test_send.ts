import fetch from 'node-fetch';

async function test() {
  const url = 'https://evolution-api-production-2b75.up.railway.app/';
  const apiKey = '7d68fb0591cabd81969a40228e984a2e6d1e7a6f96cbc6584c97328fcfd46bbb';
  const instanceId = 'elleven';
  const phone = '551199999999';

  const baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  let endpoint = `${baseUrl}/message/sendText/${instanceId}`;
  let body = {
    number: phone,
    text: "Mensagem de teste",
    options: {
      delay: 1200,
      presence: "composing",
    }
  };

  const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": apiKey,
      },
      body: JSON.stringify(body),
  };

  const res = await fetch(endpoint, options);
  const text = await res.text();
  console.log(res.status, text);
}
test();
