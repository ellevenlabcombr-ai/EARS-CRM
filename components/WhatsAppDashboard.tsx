"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { ChatBox } from './ChatBox';
import { MessageSquare, MessageSquarePlus, Users, Loader2, Phone, Archive, ArchiveRestore, QrCode, X, Search, Wifi, WifiOff, RefreshCw, Filter, Megaphone, Send, Check, Bot, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

function playNotificationSound() {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {}
}

const removeAccents = (str: string) => {
  if (!str) return '';
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

const cleanDigits = (str: string) => {
  return str.replace(/\D/g, '');
};

interface Chat {
  id: string; // unique contact string like athlete-uuid or guardian-uuid
  athleteId: string; // actual athlete id
  name: string;
  phone: string;
  role: string;
  avatarUrl?: string; // Add avatarUrl
  modalidade: string;
  category: string;
  lastMessageText: string;
  lastMessageTime: string | null;
  unreadCount: number;
}

export function WhatsAppDashboard() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [archivedIds, setArchivedIds] = useState<string[]>([]);
  const [snoozedIds, setSnoozedIds] = useState<string[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [connectionStatus, setConnectionStatus] = useState<string>('loading');
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const [isFetchingQr, setIsFetchingQr] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [showAthleteProfile, setShowAthleteProfile] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [autoResponderEnabled, setAutoResponderEnabled] = useState(false);
  const [autoResponderMessage, setAutoResponderMessage] = useState('Olá! Você falou com a academia EARS. Nosso horário de atendimento é das 08h às 18h. Responderemos em breve.');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [selectedBroadcastChats, setSelectedBroadcastChats] = useState<string[]>([]);
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);
  const [contactSearchQuery, setContactSearchQuery] = useState('');
  
  const channelRef = useRef<any>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load archived
    try {
      const stored = localStorage.getItem('wa_archived');
      if (stored) setArchivedIds(JSON.parse(stored));
      const snoozed = localStorage.getItem('wa_snoozed');
      if (snoozed) setSnoozedIds(JSON.parse(snoozed));
      const autoRes = localStorage.getItem('wa_autoresponder_enabled');
      if (autoRes) setAutoResponderEnabled(autoRes === 'true');
      const autoResMsg = localStorage.getItem('wa_autoresponder_msg');
      if (autoResMsg) setAutoResponderMessage(autoResMsg);
    } catch(e) {}
  }, []);

  const saveArchived = (ids: string[]) => {
    setArchivedIds(ids);
    localStorage.setItem('wa_archived', JSON.stringify(ids));
  };
  
  const saveSnoozed = (ids: string[]) => {
    setSnoozedIds(ids);
    localStorage.setItem('wa_snoozed', JSON.stringify(ids));
  };

  const toggleArchive = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (archivedIds.includes(id)) {
      saveArchived(archivedIds.filter(aid => aid !== id));
    } else {
      saveArchived([...archivedIds, id]);
    }
  };
  
  const toggleSnooze = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (snoozedIds.includes(id)) {
      saveSnoozed(snoozedIds.filter(sid => sid !== id));
    } else {
      saveSnoozed([...snoozedIds, id]);
    }
  };

  const checkConnection = async () => {
    try {
      const res = await fetch('/api/whatsapp/status');
      const data = await res.json();
      setConnectionStatus(data?.status || 'disconnected');
    } catch (e) {
      setConnectionStatus('error');
    }
  };

  const fetchQR = async (retryCount = 0, isRefresh = false) => {
    if (retryCount === 0) {
      setIsFetchingQr(true);
      setQrCodeBase64(null);
      setQrError(null);
    }
    try {
      const res = await fetch('/api/whatsapp/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: isRefresh }),
      });
      const data = await res.json();
      if (data?.qrcode?.base64) {
        let b64 = data.qrcode.base64;
        if (!b64.startsWith('data:image')) {
            b64 = 'data:image/png;base64,' + b64.replace(/^data:image\/[a-z]+;base64,/, ""); 
        }
        setQrCodeBase64(b64);
        setIsFetchingQr(false);
      } else if (typeof data?.qrcode === 'string') {
        let b64 = data.qrcode;
        if (b64.length > 50 && !b64.startsWith('data:image')) {
            b64 = 'data:image/png;base64,' + b64.replace(/^data:image\/[a-z]+;base64,/, ""); 
        }
        setQrCodeBase64(b64);
        setIsFetchingQr(false);
      } else if (data?.qrcode?.count === 0 || (typeof data?.qrcode === 'object' && Object.keys(data.qrcode).includes('count'))) {
        if (retryCount < 8) {
          // Evolution API keeps connection pending while awaiting QR
          setTimeout(() => fetchQR(retryCount + 1), 2500);
        } else {
          setQrError('A API está conectando, mas o QR Code não foi recebido. Verifique o REDIS e Logs. Retorno da API: ' + JSON.stringify(data).substring(0, 100));
          setIsFetchingQr(false);
        }
      } else if (data?.qrcode?.instance?.state === 'open' || data?.instance?.state === 'open' || data?.qrcode?.state === 'open') {
        checkConnection();
        setIsFetchingQr(false);
      } else if (data?.error) {
        const errorDetail = data.details?.message || JSON.stringify(data.details || '');
        if (errorDetail.toLowerCase().includes('application not found')) {
           setQrError('Sua API Evolution (Render) retornou "Application not found". Isso significa que o servidor pode estar offline, suspenso ou a URL configurada está incorreta.');
        } else {
           setQrError(`${data.error} ${errorDetail ? `(${errorDetail})` : ''}`);
        }
        setIsFetchingQr(false);
      } else {
        setQrError('Resposta inválida do servidor.');
        setIsFetchingQr(false);
      }
    } catch(e: any) {
      console.error('Failed to fetch QR:', e);
      setQrError('Erro na requisição. Verifique sua conexão.');
      setIsFetchingQr(false);
    }
  };

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  const markAsRead = (athleteId: string) => {
    try {
      const stored = JSON.parse(localStorage.getItem('wa_last_read') || '{}');
      stored[athleteId] = new Date().toISOString();
      localStorage.setItem('wa_last_read', JSON.stringify(stored));
      
      setChats(prev => prev.map(c => c.id === athleteId ? { ...c, unreadCount: 0 } : c));
    } catch(e) {}
  };

  useEffect(() => {
    if (selectedAthlete) {
      markAsRead(selectedAthlete.id);
    }
  }, [selectedAthlete]);

  const handleBroadcastSend = async () => {
    if (!broadcastMessage.trim() || selectedBroadcastChats.length === 0) return;
    setIsSendingBroadcast(true);
    
    let sentCount = 0;
    for (const chatId of selectedBroadcastChats) {
      const chat = chats.find(c => c.id === chatId);
      if (!chat) continue;
      
      try {
        await fetch('/api/ears/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{ text: broadcastMessage, direction: 'outbound' }],
            athleteName: chat.name,
            broadcast: true
          }),
        });
        
        await supabase.from('whatsapp_messages').insert({
          athlete_id: chat.athleteId,
          phone_number: chat.phone,
          text: broadcastMessage,
          direction: 'outbound',
        });
        sentCount++;
      } catch (e) {
        console.error('Error sending broadcast to', chat.name, e);
      }
    }
    
    setIsSendingBroadcast(false);
    setShowBroadcastModal(false);
    setBroadcastMessage('');
    setSelectedBroadcastChats([]);
    alert(`Transmissão enviada para ${sentCount} contato(s).`);
  };

  const loadData = async () => {
    setIsLoading(true);
    
    // 1. Fetch athletes
    const { data: athletesData } = await supabase.from('athletes').select('id, name, phone, modalidade, category, guardian_name, guardian_phone, avatar_url');
    
    // 2. Fetch last 1500 messages to build conversation list
    const { data: msgsData } = await supabase.from('whatsapp_messages').select('athlete_id, phone_number, text, media_type, direction, created_at').order('created_at', { ascending: false }).limit(1500);
    
    const lastReadMap = JSON.parse(localStorage.getItem('wa_last_read') || '{}');
    
    // Process messages
    const chatMap = new Map<string, any>();
    if (athletesData) {
      for (const a of athletesData) {
        const hasPhone = !!a.phone;
        const hasGPhone = !!a.guardian_phone;

        if (hasPhone) {
          const phoneKey = a.phone.replace(/\D/g, '');
          chatMap.set(phoneKey, {
            id: `athlete-${a.id}`,
            athleteId: a.id,
            name: a.name,
            phone: a.phone,
            role: 'Atleta',
            avatarUrl: a.avatar_url,
            modalidade: a.modalidade,
            category: a.category,
            lastMessageText: '',
            lastMessageTime: null,
            unreadCount: 0
          });
        }
        if (hasGPhone) {
          const gPhoneKey = a.guardian_phone.replace(/\D/g, '');
          chatMap.set(gPhoneKey, {
            id: `guardian-${a.id}`,
            athleteId: a.id,
            name: a.guardian_name ? `${a.guardian_name} (Resp. de ${a.name})` : `Resp. de ${a.name}`,
            phone: a.guardian_phone,
            role: 'Responsável',
            avatarUrl: a.avatar_url,
            modalidade: a.modalidade,
            category: a.category,
            lastMessageText: '',
            lastMessageTime: null,
            unreadCount: 0
          });
        }
        if (!hasPhone && !hasGPhone) {
          chatMap.set(`empty-${a.id}`, {
            id: `athlete-empty-${a.id}`,
            athleteId: a.id,
            name: a.name,
            phone: '',
            role: 'Atleta',
            avatarUrl: a.avatar_url,
            modalidade: a.modalidade,
            category: a.category,
            lastMessageText: 'Telefone não cadastrado',
            lastMessageTime: null,
            unreadCount: 0
          });
        }
      }
    }

    if (msgsData) {
      for (let i = msgsData.length - 1; i >= 0; i--) { // Process ascending
        const m = msgsData[i];
        if (!m.phone_number) continue;
        
        const cleanMsgPhone = m.phone_number.replace(/\D/g, '');
        let matchedChatKey = chatMap.has(cleanMsgPhone) ? cleanMsgPhone : undefined;
        
        if (!matchedChatKey) {
            for (const key of chatMap.keys()) {
                if (cleanMsgPhone.endsWith(key.slice(-8)) || key.endsWith(cleanMsgPhone.slice(-8))) {
                     matchedChatKey = key;
                     break;
                }
            }
        }

        if (matchedChatKey) {
          const chat = chatMap.get(matchedChatKey);
          chat.lastMessageText = m.text || (m.media_type ? `[${m.media_type}]` : 'Mensagem');
          chat.lastMessageTime = m.created_at;
          
          if (m.direction === 'inbound') {
            const lastRead = lastReadMap[chat.id];
            if (!lastRead || new Date(m.created_at) > new Date(lastRead)) {
              if (selectedAthlete?.id !== chat.id) {
                chat.unreadCount++;
              }
            }
          }
        }
      }
    }

    setChats(Array.from(chatMap.values()));
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();

    // Subscribe to new messages
    const channel = supabase.channel('whatsapp_inbound_dash')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'whatsapp_messages' }, 
        (payload) => {
          const newMsg = payload.new as any;
          if (newMsg.athlete_id || newMsg.phone_number) {
            setChats(prev => {
              const cleanMsgPhone = newMsg.phone_number ? newMsg.phone_number.replace(/\D/g, '') : '';
              let matchedChat = prev.find(c => {
                 if (newMsg.athlete_id && c.athleteId === newMsg.athlete_id) {
                     if (!cleanMsgPhone || c.phone.replace(/\D/g, '').endsWith(cleanMsgPhone.slice(-8))) return true;
                 }
                 if (!cleanMsgPhone) return false;
                 const chatPhone = c.phone.replace(/\D/g, '');
                 return chatPhone === cleanMsgPhone || cleanMsgPhone.endsWith(chatPhone.slice(-8)) || chatPhone.endsWith(cleanMsgPhone.slice(-8));
              });
              
              if (!matchedChat) return prev; // If not found, ignore
              
              let updated = prev.map(c => {
                if (c.id === matchedChat.id) {
                  let text = newMsg.text || (newMsg.media_type ? `[${newMsg.media_type}]` : 'Mensagem');
                  let newUnread = c.unreadCount;
                  
                  // Play sound and increment if inbound and not selected
                  if (newMsg.direction === 'inbound') {
                    // check if is selected? since we don't have access directly without closure issues, we use setState 
                    // We increment unless manually reset downstream
                    newUnread++;
                    playNotificationSound();
                  }
                  
                  return {
                    ...c,
                    lastMessageText: text,
                    lastMessageTime: newMsg.created_at,
                    unreadCount: newUnread
                  };
                }
                return c;
              });
              return updated;
            });
          }
        }
      ).subscribe();
      
    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Make sure we unread is reset if new messages arrive while chat is open
  // This helps us avoid closure issues in the channel subscription
  useEffect(() => {
     if (selectedAthlete) {
       const chat = chats.find(c => c.id === selectedAthlete.id);
       if (chat && chat.unreadCount > 0) {
          markAsRead(selectedAthlete.id);
       }
       if (snoozedIds.includes(selectedAthlete.id)) {
          saveSnoozed(snoozedIds.filter(id => id !== selectedAthlete.id));
       }
     }
  }, [chats, selectedAthlete]);


  const filteredChats = useMemo(() => {
    let list = chats.filter(c => {
       if (showArchived) return archivedIds.includes(c.id);
       if (showUnreadOnly) return !archivedIds.includes(c.id) && (c.unreadCount > 0 || snoozedIds.includes(c.id));
       return !archivedIds.includes(c.id);
    });
    
    if (searchQuery) {
       const qNormal = removeAccents(searchQuery);
       const qDigits = cleanDigits(searchQuery);
       
       list = list.filter(c => {
         const nameNormal = removeAccents(c.name);
         const phoneDigits = cleanDigits(c.phone || '');
         
         const nameMatch = nameNormal.includes(qNormal);
         const phoneMatch = qDigits ? phoneDigits.includes(qDigits) : false;
         const categoryMatch = c.category ? removeAccents(c.category).includes(qNormal) : false;
         const modalidadeMatch = c.modalidade ? removeAccents(c.modalidade).includes(qNormal) : false;
         
         return nameMatch || phoneMatch || categoryMatch || modalidadeMatch;
       });
    }
    
    list.sort((a, b) => {
      // Unread or snoozed first
      const aNeedsAttention = a.unreadCount > 0 || snoozedIds.includes(a.id);
      const bNeedsAttention = b.unreadCount > 0 || snoozedIds.includes(b.id);
      if (aNeedsAttention && !bNeedsAttention) return -1;
      if (!aNeedsAttention && bNeedsAttention) return 1;
      
      const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
      const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
      return timeB - timeA;
    });
    
    return list;
  }, [chats, archivedIds, snoozedIds, showArchived, showUnreadOnly, searchQuery]);

  const saveAutoResponder = () => {
    localStorage.setItem('wa_autoresponder_enabled', autoResponderEnabled.toString());
    localStorage.setItem('wa_autoresponder_msg', autoResponderMessage);
    setShowSettingsModal(false);
  };


  return (
    <div className="flex flex-col w-full rounded-2xl overflow-hidden bg-[#0b141a] border border-[#222d34]" style={{ height: 'calc(100dvh - 120px)' }}>
      
      {/* Top Connection Banner */}
      {connectionStatus !== 'loading' && connectionStatus !== 'open' && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-red-500" />
            <span className="text-red-500 font-medium text-sm">WhatsApp Desconectado.</span>
            <span className="text-red-500/70 text-sm hidden md:inline">O envio automático e recepção podem falhar.</span>
          </div>
          <Button 
            size="sm" 
            className="bg-red-500 hover:bg-red-600 text-white h-7 px-3 text-xs rounded-full shadow"
            onClick={() => {
              setSelectedAthlete(null);
              fetchQR();
            }}
          >
            Conectar Agora
          </Button>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden bg-[#0b141a]">
        {/* Sidebar */}
        <div className={`border-r border-[#222d34] flex-col bg-[#111b21] shrink-0 ${
          selectedAthlete ? 'hidden md:flex md:w-[380px]' : 'flex w-full md:w-[380px]'
        }`}>
          <div className="p-4 border-b border-[#222d34] bg-[#202c33]">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-[#e9edef] flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#00a884]" />
                {showArchived ? 'Conversas Arquivadas' : 'Conversas Ears'}
              </h2>
              <div className="flex items-center gap-2">
                {connectionStatus === 'open' && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-[#00a884]/30 bg-[#00a884]/10" title="WhatsApp Conectado">
                    <Wifi className="w-3 h-3 text-[#00a884]" />
                    <span className="text-[10px] text-[#00a884] font-bold tracking-wider">ONLINE</span>
                  </div>
                )}
                <button 
                  onClick={() => setShowSettingsModal(true)}
                  className="p-1.5 rounded-md transition-colors text-[#8696a0] hover:bg-[#202c33] hover:text-[#e9edef]"
                  title="Autoatendimento"
                >
                  <Bot className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setShowBroadcastModal(true)}
                  className="p-1.5 rounded-md transition-colors text-[#8696a0] hover:bg-[#202c33] hover:text-[#e9edef]"
                  title="Nova Transmissão"
                >
                  <Megaphone className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setShowNewChatModal(true)}
                  className="p-1.5 rounded-md transition-colors text-[#8696a0] hover:bg-[#202c33] hover:text-[#e9edef]"
                  title="Nova conversa"
                >
                  <MessageSquarePlus className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setShowArchived(!showArchived)}
                  className={`p-1.5 rounded-md transition-colors ${showArchived ? 'bg-[#00a884]/20 text-[#00a884]' : 'text-[#8696a0] hover:bg-[#202c33] hover:text-[#e9edef]'}`}
                  title={showArchived ? "Voltar para principais" : "Ver arquivos"}
                >
                  <Archive className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#8696a0] absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  ref={searchInputRef}
                  type="text" 
                  placeholder="Pesquisar ou começar uma nova conversa" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && filteredChats.length > 0) {
                      setSelectedAthlete(filteredChats[0]);
                      setSearchQuery('');
                    }
                  }}
                  className="w-full bg-[#2a3942] border-none rounded-lg py-1.5 pl-9 pr-3 text-sm text-[#e9edef] placeholder-[#8696a0] focus:outline-none focus:ring-1 focus:ring-[#00a884]"
                />
              </div>
              <button
                onClick={() => setShowUnreadOnly(!showUnreadOnly)}
                className={`p-1.5 rounded-full transition-colors ${showUnreadOnly ? 'bg-[#00a884] text-white' : 'text-[#8696a0] hover:bg-[#2a3942]'}`}
                title={showUnreadOnly ? "Mostrar todas" : "Filtro de chats não lidos"}
              >
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#111b21]">
            {isLoading ? (
              <div className="p-8 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-[#8696a0]" />
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="p-8 text-center text-[#8696a0] text-sm">
                Nenhum contato encontrado.
              </div>
            ) : (
              <div className="divide-y divide-[#222d34]">
                {filteredChats.map(chat => (
                  <div
                    key={chat.id}
                    onClick={() => {
                      setSelectedAthlete(chat);
                      setSearchQuery('');
                    }}
                    className={`w-full text-left p-3 hover:bg-[#202c33] transition-colors cursor-pointer group flex gap-3 relative ${
                      selectedAthlete?.id === chat.id ? 'bg-[#2a3942]' : ''
                    }`}
                  >
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 shadow-lg relative bg-gradient-to-br from-[#00a884] to-[#047a61]">
                      {chat.avatarUrl ? (
                         <img src={chat.avatarUrl} alt={chat.name} className="w-full h-full object-cover relative z-10" />
                      ) : (
                         <div className="w-full h-full flex items-center justify-center uppercase font-bold text-white text-lg relative z-10">
                           {chat.name.charAt(0)}
                         </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <div className="flex flex-col gap-0.5 w-[75%]">
                          <span className="font-semibold text-[15px] text-[#e9edef] truncate block">{chat.name}</span>
                          {chat.role === 'Responsável' && (
                             <span className="text-[9px] font-bold uppercase tracking-wider text-[#fdcb6e] bg-[#fdcb6e]/10 px-1.5 py-0.5 rounded-sm w-max self-start border border-[#fdcb6e]/20">Responsável</span>
                          )}
                        </div>
                        {chat.lastMessageTime && (
                           <span className={`text-[11px] ml-2 shrink-0 ${chat.unreadCount > 0 || snoozedIds.includes(chat.id) ? 'text-[#00a884] font-medium' : 'text-[#8696a0]'}`}>
                             {new Date(chat.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                         <p className={`text-[13px] truncate pr-2 ${chat.unreadCount > 0 || snoozedIds.includes(chat.id) ? 'text-[#e9edef] font-medium' : 'text-[#8696a0]'}`}>
                           {chat.lastMessageText || 'Toque para iniciar a conversa'}
                         </p>
                         
                         <div className="flex items-center gap-2">
                           {snoozedIds.includes(chat.id) && (
                             <Bell className="w-4 h-4 text-[#fdcb6e] fill-[#fdcb6e]" />
                           )}
                           {chat.unreadCount > 0 && (
                             <span className="bg-[#00a884] text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold shrink-0">
                               {chat.unreadCount}
                             </span>
                           )}
                         </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5 mt-1.5">
                        {chat.category && (
                          <span className="bg-[#2a3942] text-[#8696a0] text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border border-[#222d34]">
                            {chat.category}
                          </span>
                        )}
                        {chat.modalidade && (
                          <span className="bg-[#00a884]/10 text-[#00a884] text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border border-[#00a884]/20">
                            {chat.modalidade}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={(e) => toggleArchive(e, chat.id)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-[#202c33] text-[#8696a0] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#2a3942] hover:text-[#e9edef]"
                      title={showArchived ? "Desarquivar" : "Arquivar conversa"}
                    >
                      {showArchived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className={`overflow-hidden relative ${
          selectedAthlete ? 'flex flex-1' : 'hidden md:flex md:flex-1'
        } bg-[#0b141a]`}>
          {selectedAthlete ? (
            <>
              <div className="flex-1 flex flex-col h-full bg-[#0b141a] border-r border-[#222d34]">
                <ChatBox 
                  athleteId={selectedAthlete.athleteId} 
                  athletePhone={selectedAthlete.phone} 
                  athleteName={selectedAthlete.name} 
                  athleteAvatar={selectedAthlete.avatarUrl}
                  inline={true} 
                  isArchived={archivedIds.includes(selectedAthlete.id)}
                  onToggleArchive={(e) => toggleArchive(e as any, selectedAthlete.id)}
                  isSnoozed={snoozedIds.includes(selectedAthlete.id)}
                  onToggleSnooze={(e) => toggleSnooze(e as any, selectedAthlete.id)}
                  onOpenProfile={() => setShowAthleteProfile(!showAthleteProfile)}
                  onBack={() => setSelectedAthlete(null)}
                />
              </div>
              {showAthleteProfile && (
                <div className="fixed inset-y-0 right-0 z-50 md:relative md:inset-auto w-full max-w-[320px] bg-[#111b21] flex flex-col shrink-0 overflow-y-auto border-l border-[#222d34] h-full shadow-2xl">
                  <div className="flex items-center gap-4 p-4 border-b border-[#222d34] bg-[#202c33]">
                    <button onClick={() => setShowAthleteProfile(false)} className="text-[#8696a0] hover:text-[#e9edef] transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                    <h3 className="font-semibold text-[#e9edef]">Dados do Contato</h3>
                  </div>
                  
                  <div className="flex flex-col items-center p-6 border-b border-[#222d34] bg-[#111b21] shadow-sm">
                    <div className="w-40 h-40 rounded-full overflow-hidden shadow-2xl relative mb-4 bg-gradient-to-br from-[#00a884]/20 to-[#047a61]/20 flex items-center justify-center">
                       {selectedAthlete.avatarUrl ? (
                         <img src={selectedAthlete.avatarUrl} alt={selectedAthlete.name} className="w-full h-full object-cover" />
                       ) : (
                         <span className="text-[#00a884] text-5xl font-bold uppercase">{selectedAthlete.name.charAt(0)}</span>
                       )}
                    </div>
                    <h2 className="text-xl font-medium text-[#e9edef] mt-2 text-center">{selectedAthlete.name}</h2>
                    <p className="text-[#8696a0] text-sm mt-1">{selectedAthlete.phone}</p>
                    
                    {selectedAthlete.role === 'Responsável' && (
                       <span className="mt-3 text-[10px] font-bold uppercase tracking-wider text-[#fdcb6e] bg-[#fdcb6e]/10 px-2 py-1 rounded-full border border-[#fdcb6e]/20">Responsável</span>
                    )}
                  </div>
                  
                  <div className="flex flex-col p-4 bg-[#111b21]">
                     <div className="bg-[#2a3942]/30 rounded-xl p-4 border border-[#222d34]">
                        <h4 className="text-[#00a884] text-sm font-medium mb-3">Informações do Atleta</h4>
                        
                        <div className="space-y-4">
                          <div>
                            <span className="text-xs text-[#8696a0] block mb-1">Status</span>
                            <span className="text-sm text-[#e9edef] flex items-center gap-2">
                               <div className="w-2 h-2 rounded-full bg-[#00a884]"></div>
                               Ativo
                            </span>
                          </div>
                          
                          {selectedAthlete.modalidade && (
                            <div>
                              <span className="text-xs text-[#8696a0] block mb-1">Modalidade</span>
                              <span className="text-sm text-[#e9edef] capitalize">{selectedAthlete.modalidade}</span>
                            </div>
                          )}
                          
                          {selectedAthlete.category && (
                            <div>
                              <span className="text-xs text-[#8696a0] block mb-1">Categoria</span>
                              <span className="text-sm text-[#e9edef]">{selectedAthlete.category}</span>
                            </div>
                          )}
                        </div>
                     </div>
                  </div>
                </div>
              )}
            </>
          ) : connectionStatus !== 'open' && connectionStatus !== 'loading' ? (
             <div className="flex-1 flex flex-col items-center justify-center text-[#8696a0] bg-[#111b21] bg-[url('https://i.postimg.cc/85z1DkXX/wa-bg.png')] bg-cover bg-center">
               <div className="absolute inset-0 bg-[#0b141a]/95"></div>
               <div className="relative z-10 bg-[#202c33]/90 p-8 rounded-3xl flex flex-col items-center shadow-2xl border border-[#2a3942] max-w-[420px] w-full text-center backdrop-blur-sm">
                 <div className="w-16 h-16 bg-[#00a884]/20 rounded-full flex items-center justify-center mb-6 shadow-inner">
                   <QrCode className="w-8 h-8 text-[#00a884]" />
                 </div>
                 <h2 className="text-2xl font-light text-[#e9edef] mb-3">Conecte o WhatsApp</h2>
                 <p className="text-[#8696a0] mb-8 leading-relaxed">
                   Seu dispositivo não está conectado.<br/>Pareie o WhatsApp para enviar e receber mensagens.
                 </p>
                 
                 {isFetchingQr ? (
                   <div className="flex flex-col items-center gap-3 py-4">
                     <Loader2 className="w-8 h-8 animate-spin text-[#00a884]" />
                     <p className="text-sm font-medium text-[#00a884]">Gerando QR Code e Instância...</p>
                   </div>
                 ) : qrCodeBase64 ? (
                   <div className="flex flex-col items-center w-full">
                     <div className="bg-white p-4 rounded-2xl shadow-xl mb-6 flex flex-col items-center justify-center gap-2">
                       <img src={qrCodeBase64} alt="QR Code" className="w-[200px] h-[200px]" />
                       <p className="text-[10px] text-black font-semibold text-center mt-2 leading-tight">WhatsApp &gt; Aparelhos Conectados &gt; Conectar<br/>Aponte a câmera para a tela.</p>
                     </div>
                     <div className="flex gap-3 w-full">
                       <Button 
                         onClick={() => fetchQR(0, true)}
                         variant="outline"
                         className="flex-1 bg-transparent border-[#2a3942] text-[#8696a0] hover:bg-[#2a3942] hover:text-white h-11"
                       >
                         Gerar Novo
                       </Button>
                       <Button 
                         onClick={checkConnection}
                         className="flex-1 bg-[#00a884] hover:bg-[#008f6f] text-white shadow-lg h-11"
                       >
                         <RefreshCw className="w-4 h-4 mr-2" /> Atualizar
                       </Button>
                     </div>
                   </div>
                 ) : (
                   <div className="w-full flex flex-col gap-4">
                     {qrError && (
                       <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-lg text-sm text-left">
                         <span className="font-bold flex items-center gap-2 mb-1"><X className="w-4 h-4"/> Erro ao gerar QR</span>
                         <span className="opacity-90">{qrError}</span>
                       </div>
                     )}
                     <Button 
                       onClick={() => fetchQR(0, true)}
                       className="bg-[#00a884] hover:bg-[#008f6f] text-white font-semibold py-6 w-full rounded-xl shadow-lg transition-transform hover:scale-105 text-base"
                     >
                       Tentar Novamente
                     </Button>
                   </div>
                 )}
               </div>
             </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-[#8696a0] bg-[url('https://i.postimg.cc/85z1DkXX/wa-bg.png')] bg-cover bg-center">
              <div className="absolute inset-0 bg-[#0b141a]/95"></div>
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-24 h-24 bg-[#202c33]/80 rounded-full flex items-center justify-center mb-6 shadow-xl backdrop-blur-sm border border-[#222d34]">
                  <MessageSquare className="w-12 h-12 text-[#00a884]" />
                </div>
                <h3 className="text-2xl font-light text-[#e9edef] mb-2">WhatsApp Web do Ears</h3>
                <p className="text-sm text-[#8696a0]">Selecione um contato na lista para iniciar mensagens.</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-[#111b21] border border-[#222d34] w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-[#202c33] border-b border-[#222d34]">
              <h3 className="font-semibold text-[#e9edef] text-lg">Nova Conversa</h3>
              <button 
                onClick={() => setShowNewChatModal(false)}
                className="text-[#8696a0] hover:text-[#e9edef] transition-colors p-2 rounded-full hover:bg-[#2a3942]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 border-b border-[#222d34]">
               <div className="relative">
                 <Search className="w-4 h-4 text-[#8696a0] absolute left-3 top-1/2 -translate-y-1/2" />
                 <input 
                   type="text" 
                   autoFocus
                   placeholder="Pesquisar nome do contato..." 
                   value={contactSearchQuery}
                   onChange={e => setContactSearchQuery(e.target.value)}
                   className="w-full bg-[#2a3942] border-none rounded-lg py-2 pl-9 pr-3 text-sm text-[#e9edef] placeholder-[#8696a0] focus:outline-none focus:ring-1 focus:ring-[#00a884]"
                 />
               </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
              {cleanDigits(contactSearchQuery).length >= 8 && (
                <div
                  onClick={() => {
                     const digits = cleanDigits(contactSearchQuery);
                     const namePart = contactSearchQuery.replace(/[\d\s()+-]/g, '').trim();
                     const directChat: Chat = {
                       id: `temp-${digits}`,
                       athleteId: `temp-${digits}`,
                       name: namePart || `Contato Direto (${digits})`,
                       phone: digits,
                       role: 'Manual',
                       avatarUrl: undefined,
                       modalidade: '',
                       category: '',
                       lastMessageText: 'Iniciar canal direto',
                       lastMessageTime: null,
                       unreadCount: 0
                     };
                     setSelectedAthlete(directChat);
                     setShowNewChatModal(false);
                     setContactSearchQuery('');
                  }}
                  className="w-full text-left p-3 hover:bg-[#202c33]/70 rounded-lg border border-dashed border-[#00a884]/40 transition-colors cursor-pointer flex items-center gap-3 mb-2 bg-[#00a884]/5"
                >
                  <div className="w-10 h-10 rounded-full bg-[#00a884] flex items-center justify-center shrink-0">
                    <Send className="w-4 h-4 text-white" strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col">
                    <span className="font-semibold text-[15px] text-[#00a884]">Iniciar canal com número direto</span>
                    <span className="text-[12px] text-[#8696a0] truncate">{cleanDigits(contactSearchQuery)}</span>
                  </div>
                </div>
              )}

              {chats
                 .filter(c => {
                    if (!contactSearchQuery) return true;
                    const qNormal = removeAccents(contactSearchQuery);
                    const qDigits = cleanDigits(contactSearchQuery);
                    
                    const nameNormal = removeAccents(c.name);
                    const phoneDigits = cleanDigits(c.phone || '');
                    
                    const nameMatch = nameNormal.includes(qNormal);
                    const phoneMatch = qDigits ? phoneDigits.includes(qDigits) : false;
                    const categoryMatch = c.category ? removeAccents(c.category).includes(qNormal) : false;
                    const modalidadeMatch = c.modalidade ? removeAccents(c.modalidade).includes(qNormal) : false;
                    
                    return nameMatch || phoneMatch || categoryMatch || modalidadeMatch;
                 })
                 .sort((a, b) => a.name.localeCompare(b.name))
                 .map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => {
                     setSelectedAthlete(chat);
                     setShowNewChatModal(false);
                     setContactSearchQuery('');
                  }}
                  className="w-full text-left p-3 hover:bg-[#202c33] rounded-lg transition-colors cursor-pointer group flex items-center gap-3 mb-1"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 shadow-sm relative bg-gradient-to-br from-[#00a884] to-[#047a61]">
                    {chat.avatarUrl ? (
                       <img src={chat.avatarUrl} alt={chat.name} className="w-full h-full object-cover relative z-10" />
                    ) : (
                       <div className="w-full h-full flex items-center justify-center uppercase font-bold text-white text-[15px] relative z-10">
                         {chat.name.charAt(0)}
                       </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pr-2 flex flex-col">
                    <span className="font-semibold text-[15px] text-[#e9edef] truncate">{chat.name}</span>
                    <span className="text-[12px] text-[#8696a0] truncate">{chat.phone}</span>
                  </div>
                  {chat.role === 'Responsável' && (
                     <span className="text-[9px] font-bold uppercase tracking-wider text-[#fdcb6e] bg-[#fdcb6e]/10 px-1.5 py-0.5 rounded-sm w-max shrink-0 border border-[#fdcb6e]/20">Responsável</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Broadcast Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-[#111b21] border border-[#222d34] w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-[#202c33] border-b border-[#222d34]">
              <h3 className="font-semibold text-[#e9edef] text-lg flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-[#00a884]" />
                Nova Transmissão
              </h3>
              <button 
                onClick={() => setShowBroadcastModal(false)}
                className="text-[#8696a0] hover:text-[#e9edef] transition-colors p-2 rounded-full hover:bg-[#2a3942]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex p-4 flex-col gap-4 border-b border-[#222d34]">
              <div className="w-full">
                <label className="block text-sm font-medium text-[#8696a0] mb-2">Mensagem ({broadcastMessage.length} caracteres)</label>
                <textarea
                   className="w-full bg-[#2a3942] border-[#202c33] rounded-lg p-3 text-sm text-[#e9edef] placeholder-[#8696a0] focus:ring-[#00a884] focus:border-[#00a884] resize-none h-[120px]"
                   placeholder="Digite a mensagem para enviar a todos os selecionados..."
                   value={broadcastMessage}
                   onChange={e => setBroadcastMessage(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex flex-1 overflow-hidden">
              <div className="w-full flex flex-col overflow-hidden">
                <div className="p-3 border-b border-[#222d34] flex items-center justify-between bg-[#202c33]">
                  <span className="text-sm font-medium text-[#e9edef]">
                    {selectedBroadcastChats.length} selecionados
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setSelectedBroadcastChats(chats.map(c => c.id))}
                      className="text-xs text-[#00a884] hover:underline"
                    >
                      Selecionar Todos
                    </button>
                    <span className="text-[#8696a0]">|</span>
                    <button 
                      onClick={() => setSelectedBroadcastChats([])}
                      className="text-xs text-[#8696a0] hover:underline"
                    >
                      Limpar
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {chats.map(chat => (
                      <div 
                        key={chat.id}
                        onClick={() => setSelectedBroadcastChats(prev => prev.includes(chat.id) ? prev.filter(id => id !== chat.id) : [...prev, chat.id])}
                        className={`flex items-center p-2 rounded-lg cursor-pointer transition-colors border ${selectedBroadcastChats.includes(chat.id) ? 'bg-[#00a884]/10 border-[#00a884]/30' : 'bg-[#202c33] border-transparent hover:border-[#2a3942]'}`}
                      >
                         <div className={`w-5 h-5 rounded border mr-3 flex items-center justify-center shrink-0 ${selectedBroadcastChats.includes(chat.id) ? 'bg-[#00a884] border-[#00a884]' : 'bg-[#111b21] border-[#8696a0]'}`}>
                           {selectedBroadcastChats.includes(chat.id) && <Check className="w-3 h-3 text-white" />}
                         </div>
                         <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 shadow-sm relative bg-gradient-to-br from-[#00a884] to-[#047a61] mr-3">
                          {chat.avatarUrl ? (
                             <img src={chat.avatarUrl} alt={chat.name} className="w-full h-full object-cover relative z-10" />
                          ) : (
                             <div className="w-full h-full flex items-center justify-center uppercase font-bold text-white text-[12px] relative z-10">
                               {chat.name.charAt(0)}
                             </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pr-2 flex flex-col">
                          <span className="font-medium text-[13px] text-[#e9edef] truncate">{chat.name}</span>
                          <span className="text-[11px] text-[#8696a0] truncate">{chat.role}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-[#222d34] bg-[#202c33] flex justify-end gap-3">
              <Button 
                variant="ghost" 
                onClick={() => setShowBroadcastModal(false)}
                className="text-[#e9edef] hover:bg-[#2a3942]"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleBroadcastSend}
                disabled={isSendingBroadcast || !broadcastMessage.trim() || selectedBroadcastChats.length === 0}
                className="bg-[#00a884] hover:bg-[#008f6f] text-white px-6"
              >
                {isSendingBroadcast ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Enviar Transmissão
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Auto Responder Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-[#111b21] border border-[#222d34] w-full max-w-md rounded-2xl shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-4 bg-[#202c33] border-b border-[#222d34] rounded-t-2xl">
              <h3 className="font-semibold text-[#e9edef] text-lg flex items-center gap-2">
                <Bot className="w-5 h-5 text-[#00a884]" />
                Bot de Autoatendimento
              </h3>
              <button 
                onClick={() => setShowSettingsModal(false)}
                className="text-[#8696a0] hover:text-[#e9edef] transition-colors p-2 rounded-full hover:bg-[#2a3942]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 flex flex-col gap-5">
              <div className="flex items-center justify-between border border-[#222d34] bg-[#202c33] p-4 rounded-xl">
                <div>
                  <span className="block text-[#e9edef] font-medium text-sm">Respostas Automáticas</span>
                  <span className="block text-[#8696a0] text-xs mt-1">Enviar mensagem fora do horário comercial ou pela primeira vez.</span>
                </div>
                <button 
                  onClick={() => setAutoResponderEnabled(!autoResponderEnabled)}
                  className={`w-11 h-6 rounded-full relative transition-colors ${autoResponderEnabled ? 'bg-[#00a884]' : 'bg-[#374045]'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${autoResponderEnabled ? 'translate-x-6' : 'translate-x-1'}`}></div>
                </button>
              </div>

               <div className={`transition-opacity ${autoResponderEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                 <label className="block text-sm font-medium text-[#8696a0] mb-2">Mensagem do Bot</label>
                 <textarea
                   className="w-full bg-[#2a3942] border-[#202c33] rounded-lg p-3 text-sm text-[#e9edef] placeholder-[#8696a0] focus:ring-[#00a884] focus:border-[#00a884] resize-none h-[120px]"
                   placeholder="Ex: Olá, você falou com a academia EARS! Nosso horário de atendimento é..."
                   value={autoResponderMessage}
                   onChange={e => setAutoResponderMessage(e.target.value)}
                 />
               </div>
            </div>

            <div className="p-4 border-t border-[#222d34] bg-[#202c33] flex justify-end gap-3 rounded-b-2xl">
              <Button 
                variant="ghost" 
                onClick={() => setShowSettingsModal(false)}
                className="text-[#e9edef] hover:bg-[#2a3942]"
              >
                Cancelar
              </Button>
              <Button 
                onClick={saveAutoResponder}
                className="bg-[#00a884] hover:bg-[#008f6f] text-white px-6"
              >
                <Check className="w-4 h-4 mr-2" />
                Salvar Configurações
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
