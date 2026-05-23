const fetch = require('node-fetch');

async function test() {
  const apikey = "46765821";
  const url = "https://evolution-api-latest-idzi.onrender.com/instance/fetchInstances";
  const res = await fetch(url, { headers: { apikey }});
  const data = await res.json();
  console.log(data);
}
test();
