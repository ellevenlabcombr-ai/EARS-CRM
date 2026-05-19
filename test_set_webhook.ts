import fetch from 'node-fetch';

async function check() {
  const url = 'https://evolution-api-production-2b75.up.railway.app/';
  const apiKey = '7d68fb0591cabd81969a40228e984a2e6d1e7a6f96cbc6584c97328fcfd46bbb';
  const instanceId = 'elleven';
  
  const baseUrl = url.replace(/\/+$/, "");
  
  const options = {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "apikey": apiKey
    },
    body: JSON.stringify({
      webhook: {
        enabled: true,
        url: "https://google.com/",
        byEvents: false,
        base64: false,
        events: ["MESSAGES_UPSERT", "SEND_MESSAGE", "MESSAGES_UPDATE"]
      }
    })
  };

  const res = await fetch(`${baseUrl}/webhook/set/${instanceId}`, options);
  console.log(res.status, await res.text());
}
check();
