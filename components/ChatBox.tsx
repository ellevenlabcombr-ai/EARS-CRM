"use client";

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Send, X, MessageSquare, Loader2, Phone, Smile, Paperclip, Mic, Check, CheckCheck, Brain, Reply, User, Image as ImageIcon, FileText, Play, Music, LayoutDashboard, RefreshCw, StickyNote, ImagePlus, Archive, ArchiveRestore, Zap, Clock, CalendarClock, Bell, BellOff, ArrowLeft } from 'lucide-react';
import EmojiPicker, { Theme } from 'emoji-picker-react';

const QUICK_REPLIES = [
  "O treino começará às 18h no ginásio principal.",
  "Segue o nosso Pix para mensalidade: ears@pix.com.br",
  "O uniforme deve ser retirado na secretaria.",
  "O jogo do final de semana foi cancelado.",
  "Estaremos em recesso durante o feriado."
];

interface ChatBoxProps {
  athleteId: string;
  athletePhone: string;
  athleteName: string;
  athleteAvatar?: string;
  inline?: boolean;
  isArchived?: boolean;
  onToggleArchive?: (e: React.MouseEvent) => void;
  isSnoozed?: boolean;
  onToggleSnooze?: (e: React.MouseEvent) => void;
  onOpenProfile?: () => void;
  onBack?: () => void;
}

export function ChatBox({ athleteId, athletePhone, athleteName, athleteAvatar, inline = false, isArchived, onToggleArchive, isSnoozed, onToggleSnooze, onOpenProfile, onBack }: ChatBoxProps) {
  const [isOpen, setIsOpen] = useState(inline ? true : false);
  const [messages, setMessages] = useState<any[]>([]);
  const [activePhone, setActivePhone] = useState(athletePhone);
  const [tempPhoneInput, setTempPhoneInput] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);

  useEffect(() => {
    setActivePhone(athletePhone);
    setTempPhoneInput('');
  }, [athletePhone, athleteId]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showScheduleMenu, setShowScheduleMenu] = useState(false);
  const [snoozed, setSnoozed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const quickRepliesRef = useRef<HTMLDivElement>(null);
  const scheduleMenuRef = useRef<HTMLDivElement>(null);
  const attachMenuRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (inline) {
      setIsOpen(true);
    }
  }, [inline, athleteId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
      if (quickRepliesRef.current && !quickRepliesRef.current.contains(event.target as Node)) {
        setShowQuickReplies(false);
      }
      if (scheduleMenuRef.current && !scheduleMenuRef.current.contains(event.target as Node)) {
        setShowScheduleMenu(false);
      }
      if (attachMenuRef.current && !attachMenuRef.current.contains(event.target as Node)) {
        setShowAttachMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const cleanPhone = activePhone ? activePhone.replace(/\D/g, '') : '';
  const suffix8 = cleanPhone.length >= 8 ? cleanPhone.slice(-8) : '';

  const fetchMessages = async (silent = false) => {
    if (!silent) setIsLoading(true);
    const { data, error } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('athlete_id', athleteId)
      .ilike('phone_number', `%${suffix8}%`)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data);
    }
    if (!silent) {
       setIsLoading(false);
       setTimeout(scrollToBottom, 300);
    }
  };

  useEffect(() => {
    if (!isOpen || !athleteId) return;

    fetchMessages();

    // Unique channel to avoid conflicts
    const channelId = `chat-${athleteId}-${Math.random().toString(36).substr(2, 9)}`;
    const subscription = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'whatsapp_messages',
        },
        (payload) => {
          const newMsg = payload.new;
          const isRelevant = 
            newMsg.athlete_id === athleteId && 
            (!suffix8 || (newMsg.phone_number && newMsg.phone_number.includes(suffix8)));

          if (isRelevant) {
            setMessages((prev) => {
               // Robust de-duplication: check ID or identical text/timestamp
               const exists = prev.some(m => m.id === newMsg.id || (m.text === newMsg.text && Math.abs(new Date(m.created_at).getTime() - new Date(newMsg.created_at).getTime()) < 2000));
               if (exists) return prev;
               const next = [...prev, newMsg];
               return next.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            });
            setTimeout(scrollToBottom, 200);
          }
        }
      )
      .subscribe();

    // Fallback polling every 3 seconds if realtime is flaky
    const pollInterval = setInterval(() => {
      fetchMessages(true);
    }, 3000);

    return () => {
      supabase.removeChannel(subscription);
      clearInterval(pollInterval);
    };
  }, [isOpen, athleteId, suffix8]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScheduleSend = async (dateLabel: string) => {
    if (!newMessage.trim() || !activePhone) return;

    setSending(true);
    try {
      const isInternal = isInternalNote;
      const msgToSend = `[Agendado: ${dateLabel}]\n${newMessage}`;
      
      const tempMsg = {
        id: 'temp-' + Date.now(),
        athlete_id: athleteId,
        phone_number: cleanPhone,
        direction: isInternal ? 'internal' : 'outbound',
        text: msgToSend,
        status: 'scheduled',
        created_at: new Date().toISOString(),
        reply_to_id: replyingTo?.id || null,
        reply_to_text: replyingTo?.text || null
      };
      setMessages((prev) => [...prev, tempMsg]);
      setTimeout(scrollToBottom, 100);

      setNewMessage('');
      setReplyingTo(null);
      setIsInternalNote(false);
      setShowScheduleMenu(false);

      await supabase.from('whatsapp_messages').insert({
        athlete_id: athleteId,
        phone_number: cleanPhone,
        direction: isInternal ? 'internal' : 'outbound',
        text: msgToSend,
        status: 'scheduled'
      });
    } catch (error) {
       console.error("Error scheduling", error);
    } finally {
      setSending(false);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !activePhone) return;

    setSending(true);
    try {
      const isInternal = isInternalNote;
      const tempMsg = {
        id: 'temp-' + Date.now(),
        athlete_id: athleteId,
        phone_number: cleanPhone,
        direction: isInternal ? 'internal' : 'outbound',
        text: newMessage,
        status: isInternal ? 'sent' : 'sending',
        created_at: new Date().toISOString(),
        reply_to_id: replyingTo?.id || null,
        reply_to_text: replyingTo?.text || null
      };
      setMessages((prev) => [...prev, tempMsg]);
      setTimeout(scrollToBottom, 100);

      const msgToSend = newMessage;
      const { data: insertedMsg, error: insertError } = await supabase.from('whatsapp_messages').insert({
        athlete_id: athleteId,
        phone_number: cleanPhone,
        direction: isInternal ? 'internal' : 'outbound',
        text: msgToSend,
        status: isInternal ? 'sent' : 'sending',
        created_at: new Date().toISOString()
      }).select().single();

      if (insertError) {
         console.error('Error saving message locally', insertError);
      }

      setNewMessage('');
      setReplyingTo(null);
      setIsInternalNote(false);

      if (!isInternal) {
        try {
          const response = await fetch('/api/whatsapp/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ phone: cleanPhone, message: msgToSend }),
          });

          if (!response.ok) {
            throw new Error('Falha ao enviar mensagem via Evolution');
          }
          
          if (insertedMsg) {
             await supabase.from('whatsapp_messages').update({ status: 'sent' }).eq('id', insertedMsg.id);
          }
        } catch (e) {
          console.error("Evolution sending error:", e);
          if (insertedMsg) {
             await supabase.from('whatsapp_messages').update({ status: 'failed', text: msgToSend + '\n[Falhou, mas salvo no app]' }).eq('id', insertedMsg.id);
          }
        }
      }

    } catch (error) {
       console.error("Error sending", error);
    } finally {
      setSending(false);
    }
  };

  const handleSavePhone = async () => {
    if (!tempPhoneInput.trim()) return;
    setSavingPhone(true);
    try {
      const formatted = tempPhoneInput.trim();
      
      // Update the athlete phone number
      const { error } = await supabase
        .from('athletes')
        .update({ phone: formatted })
        .eq('id', athleteId);
      
      if (error) throw error;
      
      setActivePhone(formatted);
      setTempPhoneInput('');
    } catch (e) {
      console.error('Error saving phone', e);
      alert('Erro ao salvar telefone. Verifique a conexão e tente novamente.');
    } finally {
      setSavingPhone(false);
    }
  };

  const handleAIResponse = async () => {
    if (messages.length === 0) {
      setNewMessage("Ears: Aguarde o atleta enviar uma mensagem primeiro.");
      return;
    }
    
    setSending(true);
    try {
      const response = await fetch('/api/ears/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: messages.slice(-5), 
          athleteName 
        }),
      });
      
      const data = await response.json();
      
      if (!data.text && !process.env.GEMINI_API_KEY) {
        setNewMessage("⚠️ Chave Gemini API não configurada. Configure no menu Settings (GEMINI_API_KEY).");
      } else {
        setNewMessage(data.text);
      }
    } catch (error) {
      console.error(error);
      setNewMessage("Oi! No momento estou recarregando minhas energias, mas continue focado!");
    } finally {
      setSending(false);
    }
  };

  const uploadFile = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `whatsapp-media/${fileName}`;

    const { data, error } = await supabase.storage
      .from('media') // bucket name
      .upload(filePath, file);

    if (error) {
      console.error('Storage upload error:', error);
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleAttachment = (type: 'image' | 'document') => {
    setShowAttachMenu(false);
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = type === 'image' ? 'image/*,video/*' : 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain';
    const toBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        if (file.type.startsWith('image/')) {
           const reader = new FileReader();
           reader.onload = (e) => {
             const img = new Image();
             img.onload = () => {
               const canvas = document.createElement('canvas');
               let w = img.width;
               let h = img.height;
               const maxDim = 1200;
               if (w > maxDim || h > maxDim) {
                 if (w > h) { h = Math.round((h * maxDim) / w); w = maxDim; }
                 else { w = Math.round((w * maxDim) / h); h = maxDim; }
               }
               canvas.width = w;
               canvas.height = h;
               const ctx = canvas.getContext('2d');
               if (ctx) {
                 ctx.drawImage(img, 0, 0, w, h);
                 resolve(canvas.toDataURL('image/jpeg', 0.8));
               } else {
                 resolve(e.target?.result as string);
               }
             };
             img.onerror = () => resolve(e.target?.result as string);
             img.src = e.target?.result as string;
           };
           reader.onerror = reject;
           reader.readAsDataURL(file);
        } else {
           const reader = new FileReader();
           reader.readAsDataURL(file);
           reader.onload = () => resolve(reader.result as string);
           reader.onerror = reject;
        }
      });
    };

    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const mediaType = isImage ? 'image' : (isVideo ? 'video' : 'document');
      
      setSending(true);
      try {
        let mediaUrl = await toBase64(file);
        
        // Try real upload if configured, fallback to base64 which evolution supports
        try {
          const uploadedUrl = await uploadFile(file);
          if (uploadedUrl && uploadedUrl.startsWith('http')) mediaUrl = uploadedUrl;
        } catch (err) {
          console.warn("Upload failed, using base64 fallback", err);
        }

        const msgText = isImage ? (newMessage || '') : file.name;

          const { data: insertedMsg } = await supabase.from('whatsapp_messages').insert({
            athlete_id: athleteId,
            phone_number: cleanPhone,
            direction: 'outbound',
            text: msgText,
            media_url: mediaUrl,
            media_type: mediaType,
            status: 'sending'
          }).select().single();

          setNewMessage('');
          setReplyingTo(null);

        // Send via Evolution API
        try {
          const response = await fetch('/api/whatsapp/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              phone: cleanPhone, 
              message: msgText,
              mediaUrl: mediaUrl,
              mediaType: mediaType,
              fileName: file.name
            }),
          });

          if (response.ok) {
            if (insertedMsg) await supabase.from('whatsapp_messages').update({ status: 'sent' }).eq('id', insertedMsg.id);
          } else {
             if (insertedMsg) await supabase.from('whatsapp_messages').update({ status: 'failed', text: msgText + '\n[Falhou, mas salvo no app]' }).eq('id', insertedMsg.id);
          }
        } catch (e) {
             if (insertedMsg) await supabase.from('whatsapp_messages').update({ status: 'failed', text: msgText + '\n[Falhou, mas salvo no app]' }).eq('id', insertedMsg.id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setSending(false);
      }
    };
    input.click();
  };

  const handleMic = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        mediaRecorder.onstop = async () => {
          if (audioChunksRef.current.length === 0) {
            stream.getTracks().forEach(track => track.stop());
            setSending(false);
            alert("Não foi possível capturar o áudio. Se estiver no preview, por favor clique no botão de 'Abrir numa nova guia' (no canto superior direito) para testar o microfone.");
            return;
          }

          const mimeType = mediaRecorder.mimeType || 'audio/webm';
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          // Stop all microphone tracks to release the hardware
          stream.getTracks().forEach(track => track.stop());

          setSending(true);
          try {
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = async () => {
              const base64Audio = reader.result as string;

              const { data: insertedMsg } = await supabase.from('whatsapp_messages').insert({
                athlete_id: athleteId,
                phone_number: cleanPhone,
                direction: 'outbound',
                text: '',
                media_type: 'audio',
                media_url: base64Audio,
                status: 'sending'
              }).select().single();

              try {
                const response = await fetch('/api/whatsapp/send', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    phone: cleanPhone, 
                    message: "", 
                    mediaType: 'audio',
                    mediaUrl: base64Audio
                  }),
                });

                if (response.ok) {
                  if (insertedMsg) await supabase.from('whatsapp_messages').update({ status: 'sent' }).eq('id', insertedMsg.id);
                } else {
                  if (insertedMsg) await supabase.from('whatsapp_messages').update({ status: 'failed' }).eq('id', insertedMsg.id);
                }
              } catch (e) {
                if (insertedMsg) await supabase.from('whatsapp_messages').update({ status: 'failed' }).eq('id', insertedMsg.id);
              }
              setSending(false);
            };
          } catch (e) {
            console.error("Failed processing audio", e);
            setSending(false);
          }
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Microphone error", err);
        alert("Erro ao acessar o microfone. Verifique as permissões de gravação. Se estiver em um celular ou no preview, clique no botão superior direito para abrir o app em uma NOVA GUIA e tente novamente.");
      }
    }
  };

  const handleSimulateAthleteResponse = async () => {
    try {
      await supabase.from('whatsapp_messages').insert({
        athlete_id: athleteId,
        phone_number: cleanPhone,
        direction: 'inbound',
        text: 'Oi! Tudo bem? Estou com uma dorzinha no joelho... o que faço?',
        status: 'received'
      });
    } catch (e) {
      console.error(e);
    }
  };

  const onEmojiClick = (emojiObject: any) => {
    setNewMessage(prev => prev + emojiObject.emoji);
  };

  const handleEmoji = () => {
    setShowEmojiPicker(!showEmojiPicker);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 rounded-full bg-[#00a884] hover:bg-[#06cf9c] text-white shadow-lg transition-transform hover:scale-105 z-50 flex items-center justify-center cursor-pointer"
      >
        <MessageSquare className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className={inline ? "w-full h-full flex flex-col overflow-hidden bg-[#0b141a]" : "fixed bottom-6 right-6 w-full max-w-[350px] h-[500px] bg-[#0b141a] border border-[#222d34] rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden"}>
      <div className={`flex items-center justify-between p-4 shrink-0 ${inline ? 'bg-[#202c33]' : 'bg-[#202c33] text-[#e9edef]'}`}>
        <div className="flex items-center space-x-3" onClick={() => onOpenProfile && onOpenProfile()}>
           {onBack && (
             <button
               onClick={(e) => {
                 e.stopPropagation();
                 onBack();
               }}
               className="md:hidden p-1.5 -ml-1 text-[#8696a0] hover:text-[#e9edef] rounded-full hover:bg-[#2a3942] transition-colors cursor-pointer mr-1 shrink-0"
               title="Voltar"
             >
               <ArrowLeft className="w-6 h-6" />
             </button>
           )}
           <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 shadow-sm relative bg-gradient-to-br from-[#00a884] to-[#047a61] flex items-center justify-center text-white font-bold uppercase cursor-pointer hover:opacity-80 transition-opacity">
              {athleteAvatar ? (
                 <img src={athleteAvatar} alt={athleteName} className="w-full h-full object-cover relative z-10" />
              ) : (
                 <span className="relative z-10">{athleteName.charAt(0)}</span>
              )}
           </div>
           <div>
              <h3 className="font-semibold text-sm text-[#e9edef] cursor-pointer hover:underline">{athleteName}</h3>
              <p className="text-xs text-[#8696a0]">{activePhone || 'Telefone não cadastrado'}</p>
           </div>
        </div>
        <div className="flex items-center gap-2">
          {onToggleSnooze && (
            <button 
              onClick={onToggleSnooze} 
              title={isSnoozed ? "Lembrete Ativo (Marcar como lido)" : "Lembrar-me Mais Tarde"} 
              className={`p-2 rounded-md transition-colors cursor-pointer ${isSnoozed ? 'text-[#fdcb6e] bg-[#fdcb6e]/10' : 'text-[#8696a0] hover:text-[#e9edef]'}`}
            >
              {isSnoozed ? <Bell className="w-5 h-5 fill-current" /> : <BellOff className="w-5 h-5" />}
            </button>
          )}
          {onToggleArchive && (
            <button 
              onClick={onToggleArchive} 
              title={isArchived ? "Desarquivar" : "Arquivar"} 
              className="text-[#8696a0] hover:text-[#e9edef] p-2 rounded-md transition-colors cursor-pointer"
            >
              {isArchived ? <ArchiveRestore className="w-5 h-5" /> : <Archive className="w-5 h-5" />}
            </button>
          )}
          <button 
            onClick={() => fetchMessages()} 
            title="Sincronizar Mensagens" 
            className={`text-[#8696a0] hover:text-[#e9edef] p-2 rounded-md transition-colors cursor-pointer ${isLoading ? 'animate-spin text-[#00a884]' : ''}`}
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button 
            onClick={() => window.location.href = '/?view=home'} 
            title="Voltar para Dashboard" 
            className="text-[#8696a0] hover:text-[#e9edef] p-2 rounded-md transition-colors cursor-pointer"
          >
            <LayoutDashboard className="w-5 h-5" />
          </button>
          <button onClick={handleSimulateAthleteResponse} title="Simular Atleta Respondendo" className="text-[#8696a0] hover:text-[#e9edef] p-2 rounded-md transition-colors cursor-pointer">
            <User className="w-5 h-5" />
          </button>
          <button onClick={handleAIResponse} title="Responder com Ears (IA)" className="text-[#8696a0] hover:text-[#00a884] p-2 rounded-md transition-colors cursor-pointer mr-1">
            <Brain className="w-5 h-5" />
          </button>
          {!inline && (
            <button onClick={() => setIsOpen(false)} className="text-[#8696a0] hover:text-[#e9edef] p-1 rounded-md transition-colors cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0b141a] custom-scrollbar relative">
        {/* WhatsApp Background Pattern */}
        <div 
          className="absolute inset-0 z-0 opacity-[0.06] pointer-events-none mix-blend-overlay" 
          style={{ 
            backgroundImage: `url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")`, 
            backgroundRepeat: 'repeat',
            backgroundSize: '400px' 
          }} 
        />
        
        {isLoading && (
          <div className="flex justify-center p-4 relative z-10">
             <Loader2 className="w-6 h-6 animate-spin text-[#8696a0]" />
          </div>
        )}
        <div className="relative z-10 flex flex-col space-y-3">
          {messages.map((msg) => {
            const isOutbound = msg.direction === 'outbound';
            const isInternal = msg.direction === 'internal';
            const isSending = msg.status === 'sending';
            return (
              <div key={msg.id} className={`flex flex-col ${isOutbound || isInternal ? 'items-end' : 'items-start'} group`}>
                <div
                  className={`flex items-center gap-2 max-w-[85%]`}
                >
                  {!isOutbound && !isInternal && (
                    <button 
                      onClick={() => setReplyingTo(msg)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-[#8696a0] hover:text-[#e9edef] bg-[#202c33] rounded-full shrink-0"
                    >
                      <Reply className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <div
                    className={`relative p-2 px-3 rounded-xl text-sm shadow-sm ${
                      isInternal
                        ? 'bg-[#ffeaa7] text-[#2d3436] border border-[#fdcb6e]'
                        : isOutbound
                        ? 'bg-[#005c4b] text-[#e9edef] rounded-tr-none'
                        : 'bg-[#202c33] text-[#e9edef] rounded-tl-none'
                    }`}
                  >
                    {isInternal && (
                       <div className="flex items-center gap-1 mb-1 opacity-70">
                         <StickyNote className="w-3 h-3" />
                         <span className="text-[10px] font-bold uppercase tracking-wider">Nota Interna</span>
                       </div>
                    )}
                    {(msg.reply_to_id || msg.reply_to_text) && (
                      <div className="mb-1 p-2 rounded bg-black/20 border-l-4 border-[#00a884] text-xs max-h-16 overflow-hidden text-ellipsis opacity-80">
                        {msg.reply_to_text || 'Mensagem'}
                      </div>
                    )}
                    <p className="break-words whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                    
                    {msg.media_type === 'image' && (
                      <div className="mt-2 rounded-lg overflow-hidden border border-white/10 group relative">
                        {msg.media_url ? (
                          <img 
                            src={msg.media_url} 
                            alt="Media" 
                            className="max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity" 
                            onClick={() => window.open(msg.media_url, '_blank')}
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="bg-black/20 p-8 flex flex-col items-center justify-center gap-2">
                            <ImageIcon className="w-8 h-8 text-[#8696a0]" />
                            <span className="text-[10px] text-[#8696a0]">Imagem (Carregando...)</span>
                          </div>
                        )}
                      </div>
                    )}

                    {msg.media_type === 'audio' && (
                      <div className="mt-2 min-w-[240px]">
                        {msg.media_url ? (
                          <audio controls className="w-full h-8 accent-[#00a884]">
                            <source src={msg.media_url} />
                            Seu navegador não suporta áudio.
                          </audio>
                        ) : (
                          <div className="flex items-center gap-3 bg-black/10 p-2 rounded-lg">
                            <Music className="w-4 h-4 text-[#8696a0]" />
                            <span className="text-[10px] text-[#8696a0]">Áudio recebido</span>
                          </div>
                        )}
                      </div>
                    )}

                    {msg.media_type === 'video' && (
                      <div className="mt-2 aspect-video bg-black/40 rounded-lg flex items-center justify-center border border-white/10 px-4">
                        <Play className="w-10 h-10 text-white/50" />
                      </div>
                    )}

                    {msg.media_type === 'document' && (
                      <div className="mt-2 flex items-center gap-3 bg-black/20 p-3 rounded-lg border border-white/5">
                        <FileText className="w-6 h-6 text-[#53bdeb]" />
                        <div className="flex-1 overflow-hidden">
                          <p className="text-xs font-medium truncate">Documento.pdf</p>
                          <p className="text-[10px] text-[#8696a0]">1.2 MB • PDF</p>
                        </div>
                      </div>
                    )}
                    <div className={`flex items-center justify-end gap-1 text-[10px] mt-1 ${isInternal ? 'text-[#2d3436]/70' : isOutbound ? 'text-white/70' : 'text-[#8696a0]'}`}>
                      <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {isOutbound && !isInternal && (
                        isSending ? <Check className="w-3 h-3 opacity-70" /> : <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                      )}
                    </div>
                  </div>
                  {isOutbound && !isInternal && (
                    <button 
                      onClick={() => setReplyingTo(msg)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-[#8696a0] hover:text-[#e9edef] bg-[#202c33] rounded-full shrink-0"
                    >
                      <Reply className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {replyingTo && (
        <div className="px-4 py-2 bg-[#202c33] border-t border-[#222d34] flex items-center justify-between">
          <div className="flex-1 bg-black/20 border-l-4 border-[#00a884] rounded p-2 mr-3">
            <p className="text-xs text-[#00a884] font-medium mb-0.5">
              {replyingTo.direction === 'outbound' ? 'Você' : athleteName}
            </p>
            <p className="text-xs text-[#8696a0] truncate">{replyingTo.text}</p>
          </div>
          <button onClick={() => setReplyingTo(null)} className="text-[#8696a0] hover:text-[#e9edef]">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {!activePhone ? (
        <div className="p-5 bg-[#202c33] border-t border-[#222d34] flex flex-col items-center justify-center text-center gap-3">
          <div className="p-3 bg-red-400/10 rounded-full text-[#ed4c67]">
            <Phone className="w-6 h-6 animate-pulse" />
          </div>
          <div className="max-w-md">
            <p className="text-[#e9edef] text-sm font-semibold">Telefone não cadastrado para {athleteName}</p>
            <p className="text-[#8696a0] text-xs mt-1">
              Não é possível enviar mensagens via WhatsApp sem um número de celular. Insira o contato abaixo para cadastrá-lo diretamente:
            </p>
          </div>
          <div className="flex w-full max-w-sm gap-2 mt-1">
            <input
              type="text"
              placeholder="Ex: (11) 99999-9999"
              value={tempPhoneInput}
              onChange={(e) => setTempPhoneInput(e.target.value)}
              className="flex-1 bg-[#2a3942] border border-[#222d34] rounded-lg px-3 py-1.5 text-sm text-[#e9edef] placeholder-[#8696a0] focus:ring-1 focus:ring-[#00a884] focus:outline-none"
            />
            <Button
              onClick={handleSavePhone}
              disabled={savingPhone || !tempPhoneInput.trim()}
              className="bg-[#00a884] hover:bg-[#06cf9c] text-white rounded-lg px-4 text-xs font-semibold shrink-0 cursor-pointer"
            >
              {savingPhone ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar e Iniciar'}
            </Button>
          </div>
        </div>
      ) : (
        <div className={`p-3 flex items-center gap-2 shrink-0 ${isInternalNote ? 'bg-[#fdcb6e]/10' : 'bg-[#202c33]'} border-t border-[#222d34] transition-colors duration-300`}>
          <div className="flex gap-1 shrink-0 relative">
            <button onClick={handleEmoji} className={`p-2 rounded-md transition-colors cursor-pointer ${showEmojiPicker ? 'text-[#00a884] bg-[#00a884]/10' : 'text-[#8696a0] hover:text-[#e9edef]'}`}>
              <Smile className="w-6 h-6" />
            </button>
            
            <div ref={quickRepliesRef} className="relative">
              <button onClick={() => setShowQuickReplies(!showQuickReplies)} className={`p-2 rounded-md transition-colors cursor-pointer ${showQuickReplies ? 'text-[#00a884] bg-[#00a884]/10' : 'text-[#8696a0] hover:text-[#e9edef]'}`} title="Respostas Rápidas">
                <Zap className="w-5 h-5 fill-current" />
              </button>
              {showQuickReplies && (
                <div className="absolute bottom-12 left-0 bg-[#2a3942] border border-[#222d34] rounded-2xl shadow-xl w-72 p-2 z-50 flex flex-col gap-1 max-h-60 overflow-y-auto custom-scrollbar">
                  <span className="text-xs font-bold text-[#8696a0] px-2 py-1 uppercase tracking-wider">Respostas Rápidas</span>
                  {QUICK_REPLIES.map((reply, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => {
                        setNewMessage(newMessage + (newMessage ? ' ' : '') + reply);
                        setShowQuickReplies(false);
                      }}
                      className="text-left p-2 hover:bg-[#202c33] rounded-xl text-[#e9edef] transition-colors text-sm"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            {showEmojiPicker && (
              <div ref={emojiPickerRef} className="absolute bottom-12 left-0 z-50">
                <EmojiPicker 
                  onEmojiClick={onEmojiClick} 
                  theme={Theme.DARK}
                  width={300}
                  height={400}
                  lazyLoadEmojis={true}
                />
              </div>
            )}

            <div ref={attachMenuRef} className="relative">
              <button onClick={() => setShowAttachMenu(!showAttachMenu)} className={`p-2 rounded-md transition-colors cursor-pointer ${showAttachMenu ? 'text-[#00a884] bg-[#00a884]/10' : 'text-[#8696a0] hover:text-[#e9edef]'}`}>
                <Paperclip className="w-5 h-5" />
              </button>
              {showAttachMenu && (
                <div className="absolute bottom-14 left-0 bg-[#2a3942] border border-[#222d34] rounded-2xl shadow-xl w-56 p-2 z-50 flex flex-col gap-1">
                  <button onClick={() => handleAttachment('image')} className="flex items-center gap-3 w-full p-3 hover:bg-[#202c33] rounded-xl text-[#e9edef] transition-colors text-sm font-medium">
                    <div className="bg-blue-500/20 p-2 rounded-full text-blue-400 shrink-0"><ImagePlus className="w-5 h-5"/></div>
                    Fotos e Vídeos
                  </button>
                  <button onClick={() => handleAttachment('document')} className="flex items-center gap-3 w-full p-3 hover:bg-[#202c33] rounded-xl text-[#e9edef] transition-colors text-sm font-medium">
                    <div className="bg-purple-500/20 p-2 rounded-full text-purple-400 shrink-0"><FileText className="w-5 h-5"/></div>
                    Documento / PDF
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {isRecording ? (
            <div className="flex-1 flex items-center justify-between px-4 h-[44px] rounded-full bg-red-500/10 border border-red-500/50 animate-pulse">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-bounce" />
                <span className="text-red-500 font-medium text-sm">Gravando...</span>
              </div>
              <span className="text-xs text-red-500 font-bold ml-2">Toque em X para enviar</span>
            </div>
          ) : (
            <div className="relative flex-1 flex items-center">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={isInternalNote ? "Adicionar nota interna..." : "Mensagem"}
                className={`w-full border-0 rounded-lg pl-4 pr-12 py-2.5 text-sm focus:outline-none resize-none min-h-[44px] max-h-[120px] transition-colors duration-300 leading-snug ${isInternalNote ? 'bg-[#fdcb6e]/20 text-[#ffeaa7] placeholder-[#ffeaa7]/50 focus:ring-1 focus:ring-[#fdcb6e]/50' : 'bg-[#2a3942] text-[#e9edef] placeholder-[#8696a0]'}`}
                rows={1}
              />
              <button 
                onClick={() => setIsInternalNote(!isInternalNote)}
                title="Alternar para Nota Interna"
                className={`absolute right-2 p-1.5 rounded-md transition-colors ${isInternalNote ? 'text-[#fdcb6e] bg-[#fdcb6e]/20' : 'text-[#8696a0] hover:bg-[#202c33]'}`}
              >
                <StickyNote className="w-4 h-4" />
              </button>
            </div>
          )}
          
          <div className="flex gap-2 shrink-0 relative items-center">
            {newMessage.trim() && !isRecording && (
              <div ref={scheduleMenuRef} className="relative">
                <button onClick={() => setShowScheduleMenu(!showScheduleMenu)} className="p-2.5 rounded-full bg-[#202c33] text-[#8696a0] hover:text-[#e9edef] transition-colors cursor-pointer" title="Agendar Mensagem">
                  <CalendarClock className="w-5 h-5" />
                </button>
                {showScheduleMenu && (
                  <div className="absolute bottom-12 right-0 bg-[#2a3942] border border-[#222d34] rounded-2xl shadow-xl w-64 p-2 z-50 flex flex-col gap-1">
                    <span className="text-xs font-bold text-[#8696a0] px-2 py-1 uppercase tracking-wider">Agendar para...</span>
                    <button onClick={() => handleScheduleSend('Amanhã às 08h')} className="text-left p-2 hover:bg-[#202c33] rounded-xl text-[#e9edef] transition-colors text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#00a884]" /> Amanhã às 08:00
                    </button>
                    <button onClick={() => handleScheduleSend('Hoje às 18h')} className="text-left p-2 hover:bg-[#202c33] rounded-xl text-[#e9edef] transition-colors text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#00a884]" /> Hoje às 18:00
                    </button>
                  </div>
                )}
              </div>
            )}
            {newMessage.trim() && !isRecording ? (
              <Button
                onClick={handleSend}
                disabled={sending}
                size="icon"
                className={`rounded-full shadow-lg text-white w-10 h-10 shrink-0 cursor-pointer border-none transition-colors duration-300 ${isInternalNote ? 'bg-[#fdcb6e] hover:bg-[#eccc68] text-black' : 'bg-[#00a884] hover:bg-[#06cf9c]'}`}
              >
                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-1" />}
              </Button>
            ) : (
              <button onClick={handleMic} className={`p-3 text-white rounded-full transition-colors cursor-pointer shrink-0 w-10 h-10 flex items-center justify-center shadow-lg ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-[#00a884] hover:bg-[#06cf9c]'}`}>
                {isRecording ? <X className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
