const fs = require('fs');
let code = fs.readFileSync('components/AutomationSettings.tsx', 'utf8');

// Insert State
const qrState = `
  const [qrCodeData, setQrCodeData] = useState<{ qrcode?: string, base64?: string } | null>(null);
  const [instanceStatus, setInstanceStatus] = useState<string>('');
  const [isManagingInstance, setIsManagingInstance] = useState(false);

  const fetchInstanceStatus = async () => {
    if (!evolutionApiUrl || !evolutionApiKey || !evolutionInstanceId) return;
    try {
      setIsManagingInstance(true);
      const res = await fetch(\`\${evolutionApiUrl}/instance/connectionState/\${evolutionInstanceId}\`, {
        headers: { 'apikey': evolutionApiKey }
      });
      if (res.ok) {
        const data = await res.json();
        setInstanceStatus(data?.instance?.state || 'unknown');
      } else {
        setInstanceStatus('not_found');
      }
    } catch (error) {
      console.error('Error fetching instance status:', error);
      setInstanceStatus('error');
    } finally {
      setIsManagingInstance(false);
    }
  };

  const handleCreateInstance = async () => {
    if (!evolutionApiUrl || !evolutionApiKey || !evolutionInstanceId) {
       setStatus('error');
       setMessage('Preencha os dados da API Evolution primeiro.');
       return;
    }
    try {
      setIsManagingInstance(true);
      setQrCodeData(null);
      const res = await fetch(\`\${evolutionApiUrl}/instance/create\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionApiKey
        },
        body: JSON.stringify({
          instanceName: evolutionInstanceId,
          number: '',
          qrcode: true
        })
      });
      const data = await res.json();
      
      if (data.qrcode && data.qrcode.base64) {
         setQrCodeData(data.qrcode);
      } else if (data.hash && data.hash.base64) {
         setQrCodeData(data.hash);
      } else if (data.base64) {
         setQrCodeData(data);
      } else if (data?.instance?.state === 'open') {
         setInstanceStatus('open');
      }
      
      setTimeout(fetchInstanceStatus, 3000);
      
      setStatus('success');
      setMessage('Ação finalizada. Leia o QR Code ou verifique o estado da instância.');
    } catch (error) {
      console.error(error);
      setStatus('error');
      setMessage('Erro ao criar instância: ' + String(error));
    } finally {
      setIsManagingInstance(false);
    }
  };

  const handleConnectInstance = async () => {
    if (!evolutionApiUrl || !evolutionApiKey || !evolutionInstanceId) return;
    try {
      setIsManagingInstance(true);
      const res = await fetch(\`\${evolutionApiUrl}/instance/connect/\${evolutionInstanceId}\`, {
        headers: { 'apikey': evolutionApiKey }
      });
      const data = await res.json();
      if (data.base64) {
         setQrCodeData({ base64: data.base64 });
      }
    } catch (error) {
    } finally {
      setIsManagingInstance(false);
    }
  };

  const handleDeleteInstance = async () => {
    if (!evolutionApiUrl || !evolutionApiKey || !evolutionInstanceId) return;
    try {
      setIsManagingInstance(true);
      await fetch(\`\${evolutionApiUrl}/instance/logout/\${evolutionInstanceId}\`, {
        method: 'DELETE',
        headers: { 'apikey': evolutionApiKey }
      });
      await fetch(\`\${evolutionApiUrl}/instance/delete/\${evolutionInstanceId}\`, {
        method: 'DELETE',
        headers: { 'apikey': evolutionApiKey }
      });
      setInstanceStatus('not_found');
      setQrCodeData(null);
      setStatus('success');
      setMessage('Instância desconectada e deletada.');
    } catch (error) {
    } finally {
      setIsManagingInstance(false);
    }
  };
`;

code = code.replace("const [message, setMessage] = useState('');", "const [message, setMessage] = useState('');\n" + qrState);

const uiToInsert = `
              {evolutionApiUrl && evolutionApiKey && evolutionInstanceId && (
                <div className="mt-4 p-4 bg-slate-900 border border-slate-800 rounded-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-white uppercase tracking-widest">WhatsApp Web / QR Code</h4>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={fetchInstanceStatus}
                      disabled={isManagingInstance}
                      className="border-slate-700 hover:bg-slate-800 text-xs text-slate-300 h-8"
                    >
                      {isManagingInstance ? <Loader2 className="animate-spin w-3 h-3 mr-2" /> : <Smartphone className="w-3 h-3 mr-2" />}
                      Verificar Status
                    </Button>
                  </div>
                  
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                       <span className="text-xs text-slate-400">Status atual:</span>
                       {instanceStatus === 'open' ? (
                          <span className="text-xs font-bold text-[#25D366] bg-[#25D366]/10 px-2 py-1 rounded">Conectado (open)</span>
                       ) : instanceStatus === 'connecting' ? (
                          <span className="text-xs font-bold text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded">Conectando...</span>
                       ) : instanceStatus === 'close' ? (
                          <span className="text-xs font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded">Desconectado</span>
                       ) : instanceStatus === 'not_found' ? (
                          <span className="text-xs font-bold text-slate-400 bg-slate-800 px-2 py-1 rounded">Instância não existe</span>
                       ) : (
                          <span className="text-xs font-bold text-slate-400 bg-slate-800 px-2 py-1 rounded">{instanceStatus || 'Desconhecido'}</span>
                       )}
                    </div>

                    {qrCodeData?.base64 && instanceStatus !== 'open' && (
                       <div className="flex flex-col items-center p-4 bg-white rounded-xl w-max self-center border-4 border-[#25D366]">
                          <img src={qrCodeData.base64} alt="QR Code WhatsApp" className="w-48 h-48" />
                          <p className="text-xs text-slate-800 font-bold mt-2 text-center">Escaneie com o WhatsApp<br/>(Para Linkar Dispositivo)</p>
                       </div>
                    )}

                    <div className="flex gap-2 mt-2 flex-wrap">
                      {instanceStatus === 'not_found' || instanceStatus === 'error' || instanceStatus === '' ? (
                         <Button onClick={handleCreateInstance} disabled={isManagingInstance} className="bg-[#25D366] text-black hover:bg-[#20bd5a] text-xs font-bold h-8">
                           Criar Instância & Gerar QR Code
                         </Button>
                      ) : null}
                      
                      {instanceStatus === 'close' || instanceStatus === 'connecting' || (instanceStatus !== 'not_found' && !qrCodeData?.base64 && instanceStatus !== 'open' && instanceStatus !== '') ? (
                         <Button onClick={handleConnectInstance} disabled={isManagingInstance} className="bg-[#25D366] text-black hover:bg-[#20bd5a] text-xs font-bold h-8">
                           Gerar QR Code
                         </Button>
                      ) : null}

                      {instanceStatus !== 'not_found' && instanceStatus !== 'error' && instanceStatus !== '' && (
                         <Button onClick={handleDeleteInstance} disabled={isManagingInstance} variant="destructive" className="opacity-80 hover:opacity-100 text-xs font-bold h-8">
                           Desconectar / Deletar Instância
                         </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}`;

code = code.replace(
  `                  <input
                    type="text"
                    value={evolutionInstanceId}
                    onChange={(e) => setEvolutionInstanceId(e.target.value)}
                    placeholder="Nome da Instância"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-[#25D366]/50 focus:ring-2 focus:ring-[#25D366]/10 outline-none text-sm transition-all"
                  />
                </div>
              </div>`,
  `                  <input
                    type="text"
                    value={evolutionInstanceId}
                    onChange={(e) => setEvolutionInstanceId(e.target.value)}
                    placeholder="Nome da Instância"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-[#25D366]/50 focus:ring-2 focus:ring-[#25D366]/10 outline-none text-sm transition-all"
                  />
                </div>
              </div>
` + uiToInsert
);

fs.writeFileSync('components/AutomationSettings.tsx', code);
