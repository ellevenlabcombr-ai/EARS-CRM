const fs = require('fs');
let f = fs.readFileSync('app/api/whatsapp/connect/route.ts', 'utf8');
f = f.replace(/error:\s*error.message/g, "error: (error.message || '').toLowerCase().includes('timeout') || (error.message || '').toLowerCase().includes('aborted') ? 'O servidor da Evolution demorou muito para responder (em plataformas de tier free, isso leva alguns minutos para acordar na primeira vez). Tente novamente em seguida.' : error.message");
fs.writeFileSync('app/api/whatsapp/connect/route.ts', f);

let f2 = fs.readFileSync('app/api/evolution/route.ts', 'utf8');
f2 = f2.replace(/error:\s*error.message/g, "error: (error.message || '').toLowerCase().includes('timeout') || (error.message || '').toLowerCase().includes('aborted') ? 'O servidor da Evolution demorou muito para responder (em plataformas de tier free, isso leva alguns minutos para acordar na primeira vez).' : error.message");
fs.writeFileSync('app/api/evolution/route.ts', f2);
