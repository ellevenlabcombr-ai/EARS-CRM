const fs = require('fs');
let code = fs.readFileSync('/app/applet/app/api/simulate-whatsapp/route.ts', 'utf8');

code = code.replace(
  'const endpoint = `${url}/message/sendText/${instanceId}`;',
  'const baseUrl = url.replace(/\\/+\$/, "");\n    const endpoint = `${baseUrl}/message/sendText/${instanceId}`;'
);

fs.writeFileSync('/app/applet/app/api/simulate-whatsapp/route.ts', code);
