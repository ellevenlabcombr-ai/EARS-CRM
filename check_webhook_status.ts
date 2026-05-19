import fetch from 'node-fetch';

async function check() {
  const url = 'https://evolution-api-production-2b75.up.railway.app/';
  const apiKey = '7d68fb0591cabd81969a40228e984a2e6d1e7a6f96cbc6584c97328fcfd46bbb';
  const instance = 'elleven';

  const baseUrl = url.replace(/\/+$/, "");
  const endpoint = `${baseUrl}/webhook/find/${instance}`;

  const res = await fetch(endpoint, {
      headers: { apikey: apiKey }
  });
  console.log(await res.text());
}
check();
