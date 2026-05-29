const fs = require('fs');
let f = fs.readFileSync('components/WhatsAppDashboard.tsx', 'utf8');

const regex = /A API está conectando, mas o QR Code não foi recebido\.[^']+/g;
const replacement = "O servidor está inicializando a instância na Evolution (Tier Free pode levar até 2-3 minutos). Aguarde a recepção do Webhook ou clique em 'Tentar Novamente'.";
f = f.replace(regex, replacement);

fs.writeFileSync('components/WhatsAppDashboard.tsx', f);
console.log('Patched WhatsAppDashboard');

let f2 = fs.readFileSync('components/AutomationSettings.tsx', 'utf8');
const regex2 = /Ação pendente: Evolution não enviou QR Code pelo Webhook\.[^']+/g;
const replacement2 = "O servidor está inicializando a instância. O Webhook pode demorar até 2-3 minutos para chegar. Clique em 'Tentar Novamente' se não conectar.";
f2 = f2.replace(regex2, replacement2);

fs.writeFileSync('components/AutomationSettings.tsx', f2);
console.log('Patched AutomationSettings');
