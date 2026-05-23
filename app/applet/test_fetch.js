fetch('http://localhost:3000/api/whatsapp/connect', { method: 'POST' }).then(res => res.text()).then(console.log);
