const fs = require('fs'); 
let code = fs.readFileSync('/app/applet/components/MainDashboard.tsx', 'utf8'); 

code = code.replace(/\| 'finance';/g, "| 'finance' | 'whatsapp';");

if (!code.includes("{ id: 'whatsapp'")) {
    const newMenuItem = "    { id: 'whatsapp', label: 'Mensagens', emoji: '💬' },\n";
    code = code.replace(/(id: 'settings'.*,)/, newMenuItem + "$1");
}

code = code.replace(/case 'finance': return "Financeiro";/, "case 'finance': return \"Financeiro\";\n      case 'whatsapp': return \"Mensagens\";");

if (!code.includes('import { WhatsAppDashboard }')) {
    code = code.replace('import { FinanceDashboard }', "import { WhatsAppDashboard } from './WhatsAppDashboard';\nimport { FinanceDashboard }");
}

code = code.replace(/case 'finance':(.*?)return([^;]+;)/s, "case 'finance':$1return$2\n            case 'whatsapp':\n              return <WhatsAppDashboard />;\n");

fs.writeFileSync('/app/applet/components/MainDashboard.tsx', code);
console.log('MainDashboard patched successfully');
