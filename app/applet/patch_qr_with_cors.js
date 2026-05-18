const fs = require('fs');
let code = fs.readFileSync('components/AutomationSettings.tsx', 'utf8');

code = code.replace(
  /const fetchInstanceStatus = async \(\) => \{.+?finally \{\s+setIsManagingInstance\(false\);\s+\}\s+\};/s,
  `const fetchInstanceStatus = async () => {
    if (!evolutionApiUrl || !evolutionInstanceId) return;
    try {
      setIsManagingInstance(true);
      const res = await fetch('/api/evolution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: evolutionApiUrl, apiKey: evolutionApiKey, instanceId: evolutionInstanceId, action: 'status' })
      });
      const json = await res.json();
      if (res.ok && json.data) {
        setInstanceStatus(json.data?.instance?.state || 'unknown');
      } else {
        setInstanceStatus('not_found');
      }
    } catch (error) {
      console.error('Error fetching instance status:', error);
      setInstanceStatus('error');
    } finally {
      setIsManagingInstance(false);
    }
  };`
);

code = code.replace(
  /const handleCreateInstance = async \(\) => \{.+?finally \{\s+setIsManagingInstance\(false\);\s+\}\s+\};/s,
  `const handleCreateInstance = async () => {
    if (!evolutionApiUrl || !evolutionApiKey || !evolutionInstanceId) {
       setStatus('error');
       setMessage('Preencha os dados da API Evolution primeiro.');
       return;
    }
    try {
      setIsManagingInstance(true);
      setQrCodeData(null);
      const res = await fetch('/api/evolution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: evolutionApiUrl, apiKey: evolutionApiKey, instanceId: evolutionInstanceId, action: 'create' })
      });
      const json = await res.json();
      
      if (!res.ok) {
         throw new Error(json.error || 'Erro desconhecido');
      }
      
      const data = json.data;
      if (data.qrcode && data.qrcode.base64) {
         setQrCodeData(data.qrcode);
      } else if (data.hash && data.hash.base64) {
         setQrCodeData(data.hash);
      } else if (data.base64) {
         setQrCodeData({ base64: data.base64 });
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
  };`
);

code = code.replace(
  /const handleConnectInstance = async \(\) => \{.+?finally \{\s+setIsManagingInstance\(false\);\s+\}\s+\};/s,
  `const handleConnectInstance = async () => {
    if (!evolutionApiUrl || !evolutionApiKey || !evolutionInstanceId) return;
    try {
      setIsManagingInstance(true);
      const res = await fetch('/api/evolution', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: evolutionApiUrl, apiKey: evolutionApiKey, instanceId: evolutionInstanceId, action: 'connect' })
      });
      const json = await res.json();
      const data = json.data || {};
      if (data.base64) {
         setQrCodeData({ base64: data.base64 });
      }
    } catch (error) {
    } finally {
      setIsManagingInstance(false);
    }
  };`
);

code = code.replace(
  /const handleDeleteInstance = async \(\) => \{.+?finally \{\s+setIsManagingInstance\(false\);\s+\}\s+\};/s,
  `const handleDeleteInstance = async () => {
    if (!evolutionApiUrl || !evolutionApiKey || !evolutionInstanceId) return;
    try {
      setIsManagingInstance(true);
      await fetch('/api/evolution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: evolutionApiUrl, apiKey: evolutionApiKey, instanceId: evolutionInstanceId, action: 'logout' })
      });
      await fetch('/api/evolution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: evolutionApiUrl, apiKey: evolutionApiKey, instanceId: evolutionInstanceId, action: 'delete' })
      });
      setInstanceStatus('not_found');
      setQrCodeData(null);
      setStatus('success');
      setMessage('Instância desconectada e deletada.');
    } catch (error) {
    } finally {
      setIsManagingInstance(false);
    }
  };`
);

fs.writeFileSync('components/AutomationSettings.tsx', code);
