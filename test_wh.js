async function testWebhook() {
  const payload = {
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

  const res = await fetch('http://localhost:3000/api/webhooks/evolution', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  console.log(res.status);
  const json = await res.json();
  console.log(json);
}

testWebhook();
