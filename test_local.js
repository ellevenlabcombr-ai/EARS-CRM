import fetch from 'node-fetch';

async function test() {
   const res = await fetch('http://localhost:3000/api/whatsapp/connect', {
       method: 'POST'
   });
   const json = await res.json();
   console.log(JSON.stringify(json, null, 2));
}
test();
