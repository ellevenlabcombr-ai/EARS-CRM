const fs = require('fs');
let code = fs.readFileSync('components/AthleteHealthProfile.tsx', 'utf8');

const oldFunc = `const handleSendWhatsapp = (phone: string, text: string) => {
    const cleaned = phone.replace(/\\D/g, '');
    const encoded = encodeURIComponent(text);
    window.open(\`https://wa.me/55\${cleaned}?text=\${encoded}\`, '_blank');
  };`;

const newFunc = `const handleSendWhatsapp = async (phone: string, text: string) => {
    const cleaned = phone.replace(/\\D/g, '');
    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleaned, message: text })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro na API');
      alert('Mensagem enviada com sucesso!');
    } catch (err: any) {
      alert('Erro ao enviar via automação: ' + err.message);
    }
  };`;

code = code.replace(oldFunc, newFunc);
fs.writeFileSync('components/AthleteHealthProfile.tsx', code);
