import fetch from 'node-fetch';

async function check() {
    const res = await fetch('http://localhost:3000/api/whatsapp/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: false })
    });
    console.log(await res.text());
}
check();
