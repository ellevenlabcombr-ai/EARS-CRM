"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { ChatBox } from './ChatBox';
import { MessageSquare, Users, Loader2, Phone, Archive, ArchiveRestore, QrCode, X, Search, Wifi, WifiOff, RefreshCw } from 'lucide-react';
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

interface Chat {
  id: string; // athlete id
  name: string;
  phone: string;
  modalidade: string;
  category: string;
  lastMessageText: string;
  lastMessageTime: string | null;
  unreadCount: number;
}

export function WhatsAppDashboard() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [archivedIds, setArchivedIds] = useState<string[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [connectionStatus, setConnectionStatus] = useState<string>('loading');
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);
  const [isFetchingQr, setIsFetchingQr] = useState(false);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    // Load archived
    try {
      const stored = localStorage.getItem('wa_archived');
      if (stored) setArchivedIds(JSON.parse(stored));
    } catch(e) {}
  }, []);

  const saveArchived = (ids: string[]) => {
    setArchivedIds(ids);
    localStorage.setItem('wa_archived', JSON.stringify(ids));
  };

  const toggleArchive = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (archivedIds.includes(id)) {
      saveArchived(archivedIds.filter(aid => aid !== id));
    } else {
      saveArchived([...archivedIds, id]);
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

  const fetchQR = async () => {
    setIsFetchingQr(true);
    setQrCodeBase64(null);
    try {
      const res = await fetch('/api/whatsapp/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data?.qrcode?.base64) {
        setQrCodeBase64(data.qrcode.base64);
      } else if (data?.qrcode) {
        setQrCodeBase64(data.qrcode);
      }
    } catch(e) {
      console.error('Failed to fetch QR:', e);
    }
    setIsFetchingQr(false);
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

  const loadData = async () => {
    setIsLoading(true);
    
    // 1. Fetch athletes
    const { data: athletesData } = await supabase.from('athletes').select('id, name, phone, modalidade, category').not('phone', 'is', null);
    
    // 2. Fetch last 1500 messages to build conversation list
    const { data: msgsData } = await supabase.from('whatsapp_messages').select('athlete_id, text, media_type, direction, created_at').order('created_at', { ascending: false }).limit(1500);
    
    const lastReadMap = JSON.parse(localStorage.getItem('wa_last_read') || '{}');
    
    // Process messages
    const chatMap = new Map<string, any>();
    if (athletesData) {
      for (const a of athletesData) {
        chatMap.set(a.id, {
          id: a.id,
          name: a.name,
          phone: a.phone,
          modalidade: a.modalidade,
          category: a.category,
          lastMessageText: '',
          lastMessageTime: null,
          unreadCount: 0
        });
      }
    }

    if (msgsData) {
      for (let i = msgsData.length - 1; i >= 0; i--) { // Process ascending
        const m = msgsData[i];
        if (!m.athlete_id) continue;
        const chat = chatMap.get(m.athlete_id);
        if (chat) {
          const isLatest = true; // since ascending, latest will overwrite
          chat.lastMessageText = m.text || (m.media_type ? `[${m.media_type}]` : 'Mensagem');
          chat.lastMessageTime = m.created_at;
          
          if (m.direction === 'inbound') {
            const lastRead = lastReadMap[m.athlete_id];
            if (!lastRead || new Date(m.created_at) > new Date(lastRead)) {
              if (selectedAthlete?.id !== m.athlete_id) {
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
          if (newMsg.athlete_id) {
            setChats(prev => {
              const chatExists = prev.find(c => c.id === newMsg.athlete_id);
              if (!chatExists) return prev; // If athlete not found, ignore
              
              let updated = prev.map(c => {
                if (c.id === newMsg.athlete_id) {
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
     }
  }, [chats, selectedAthlete]);


  const filteredChats = useMemo(() => {
    let list = chats.filter(c => {
       if (showArchived) return archivedIds.includes(c.id);
       return !archivedIds.includes(c.id);
    });
    
    if (searchQuery) {
       const q = searchQuery.toLowerCase();
       list = list.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q));
    }
    
    // Sort by latest message first
    list.sort((a, b) => {
      const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
      const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
      return timeB - timeA;
    });
    
    return list;
  }, [chats, archivedIds, showArchived, searchQuery]);


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

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-[380px] border-r border-[#222d34] flex flex-col bg-[#111b21] shrink-0">
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
                  onClick={() => setShowArchived(!showArchived)}
                  className={`p-1.5 rounded-md transition-colors ${showArchived ? 'bg-[#00a884]/20 text-[#00a884]' : 'text-[#8696a0] hover:bg-[#202c33]'}`}
                  title={showArchived ? "Voltar para principais" : "Ver arquivos"}
                >
                  <Archive className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="relative">
              <Search className="w-4 h-4 text-[#8696a0] absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Pesquisar conversa..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#2a3942] border-none rounded-lg py-1.5 pl-9 pr-3 text-sm text-[#e9edef] placeholder-[#8696a0] focus:outline-none focus:ring-1 focus:ring-[#00a884]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#111b21]">
            {isLoading ? (
              <div className="p-8 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-[#8696a0]" />
              </div>
            ) : filteredChats.length === 0 ? (
              <div className="p-8 text-center text-[#8696a0] text-sm">
                Nenhuma conversa encontrada.
              </div>
            ) : (
              <div className="divide-y divide-[#222d34]">
                {filteredChats.map(chat => (
                  <div
                    key={chat.id}
                    onClick={() => setSelectedAthlete(chat)}
                    className={`w-full text-left p-3 hover:bg-[#202c33] transition-colors cursor-pointer group flex gap-3 relative ${
                      selectedAthlete?.id === chat.id ? 'bg-[#2a3942]' : ''
                    }`}
                  >
                    {/* Avatar placeholder */}
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#00a884] to-[#047a61] shrink-0 flex items-center justify-center shadow-lg uppercase font-bold text-white text-lg">
                      {chat.name.charAt(0)}
                    </div>
                    
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <span className="font-semibold text-[15px] text-[#e9edef] truncate block">{chat.name}</span>
                        {chat.lastMessageTime && (
                           <span className={`text-[11px] ml-2 shrink-0 ${chat.unreadCount > 0 ? 'text-[#00a884] font-medium' : 'text-[#8696a0]'}`}>
                             {new Date(chat.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                         <p className={`text-[13px] truncate pr-2 ${chat.unreadCount > 0 ? 'text-[#e9edef] font-medium' : 'text-[#8696a0]'}`}>
                           {chat.lastMessageText || 'Nenhuma mensagem recente'}
                         </p>
                         
                         <div className="flex items-center gap-2">
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
        <div className="flex-1 flex flex-col bg-[#0b141a] overflow-hidden relative">
          {selectedAthlete ? (
            <ChatBox 
              athleteId={selectedAthlete.id} 
              athletePhone={selectedAthlete.phone} 
              athleteName={selectedAthlete.name} 
              inline={true} 
            />
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
                         onClick={fetchQR}
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
                   <Button 
                     onClick={fetchQR}
                     className="bg-[#00a884] hover:bg-[#008f6f] text-white font-semibold py-6 w-full rounded-xl shadow-lg transition-transform hover:scale-105 text-base"
                   >
                     Gerar QR Code Agora
                   </Button>
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
    </div>
  );
}
