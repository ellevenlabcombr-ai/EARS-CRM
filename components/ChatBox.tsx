"use client";

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Send, X, MessageSquare, Loader2, Phone, Smile, Paperclip, Mic, Check, CheckCheck, Brain, Reply, User } from 'lucide-react';

interface ChatBoxProps {
  athleteId: string;
  athletePhone: string;
  athleteName: string;
  inline?: boolean;
}

export function ChatBox({ athleteId, athletePhone, athleteName, inline = false }: ChatBoxProps) {
  const [isOpen, setIsOpen] = useState(inline ? true : false);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (inline) {
      setIsOpen(true);
    }
  }, [inline, athleteId]);

  const cleanPhone = athletePhone ? athletePhone.replace(/\D/g, '') : '';
  const suffix = cleanPhone.slice(-8);

  useEffect(() => {
    if (!isOpen || !cleanPhone || cleanPhone.length < 8) return;

    const fetchMessages = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .or(`athlete_id.eq.${athleteId},phone_number.like.%${suffix}%`)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(data);
      }
      setIsLoading(false);
      scrollToBottom();
    };

    fetchMessages();

    const subscription = supabase
      .channel('public:whatsapp_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'whatsapp_messages',
        },
        (payload) => {
          const newMsg = payload.new;
          if (newMsg.athlete_id === athleteId || (newMsg.phone_number && newMsg.phone_number.includes(suffix))) {
            setMessages((prev) => {
               if (prev.find(m => m.id === newMsg.id)) return prev;
               return [...prev, newMsg];
            });
            setTimeout(scrollToBottom, 100);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [isOpen, athleteId, suffix, cleanPhone]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !athletePhone) return;

    setSending(true);
    try {
      const tempMsg = {
        id: 'temp-' + Date.now(),
        athlete_id: athleteId,
        phone_number: cleanPhone,
        direction: 'outbound',
        text: newMessage,
        status: 'sending',
        created_at: new Date().toISOString(),
        reply_to_id: replyingTo?.id || null,
        reply_to_text: replyingTo?.text || null
      };
      setMessages((prev) => [...prev, tempMsg]);
      setTimeout(scrollToBottom, 100);

      const msgToSend = newMessage;
      setNewMessage('');
      setReplyingTo(null);

      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: cleanPhone, message: msgToSend }),
      });

      if (!response.ok) {
        throw new Error('Falha ao enviar mensagem');
      }

      await supabase.from('whatsapp_messages').insert({
        athlete_id: athleteId,
        phone_number: cleanPhone,
        direction: 'outbound',
        text: msgToSend,
        status: 'sent'
      });

    } catch (error) {
       console.error("Error sending", error);
    } finally {
      setSending(false);
    }
  };

  const handleAIResponse = async () => {
    if (messages.length === 0) {
      setNewMessage("Ears: Aguarde o atleta enviar uma mensagem primeiro.");
      return;
    }
    setNewMessage("Pensando como Ears...");
    setTimeout(() => {
      setNewMessage(`Oi! Sim, sugiro fazer compressa de gelo por 15 minutos e descansar hoje.`);
    }, 1500);
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

  const handleEmoji = () => {
    setNewMessage(prev => prev + "😀");
  };

  const handleAttachment = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,application/pdf';
    input.onchange = () => {
      setNewMessage(prev => prev + " [Arquivo anexado]");
    };
    input.click();
  };

  const handleMic = () => {
    if (isRecording) {
      setIsRecording(false);
      setNewMessage(prev => prev + " [Áudio gravado 0:05]");
    } else {
      setIsRecording(true);
    }
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
        <div className="flex items-center space-x-3">
           <div className="bg-[#00a884]/20 p-2 rounded-full cursor-pointer hover:bg-[#00a884]/30 transition-colors">
             <Phone className="w-4 h-4 text-[#00a884]" />
           </div>
           <div>
              <h3 className="font-semibold text-sm text-[#e9edef] cursor-pointer hover:underline">{athleteName}</h3>
              <p className="text-xs text-[#8696a0]">{athletePhone}</p>
           </div>
        </div>
        <div className="flex items-center gap-2">
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
            const isSending = msg.status === 'sending';
            return (
              <div key={msg.id} className={`flex flex-col ${isOutbound ? 'items-end' : 'items-start'} group`}>
                <div
                  className={`flex items-center gap-2 max-w-[85%]`}
                >
                  {!isOutbound && (
                    <button 
                      onClick={() => setReplyingTo(msg)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-[#8696a0] hover:text-[#e9edef] bg-[#202c33] rounded-full shrink-0"
                    >
                      <Reply className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <div
                    className={`relative p-2 px-3 rounded-xl text-sm shadow-sm ${
                      isOutbound
                        ? 'bg-[#005c4b] text-[#e9edef] rounded-tr-none'
                        : 'bg-[#202c33] text-[#e9edef] rounded-tl-none'
                    }`}
                  >
                    {(msg.reply_to_id || msg.reply_to_text) && (
                      <div className="mb-1 p-2 rounded bg-black/20 border-l-4 border-[#00a884] text-xs max-h-16 overflow-hidden text-ellipsis opacity-80">
                        {msg.reply_to_text || 'Mensagem'}
                      </div>
                    )}
                    <p className="break-words whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                    <div className={`flex items-center justify-end gap-1 text-[10px] mt-1 ${isOutbound ? 'text-white/70' : 'text-[#8696a0]'}`}>
                      <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {isOutbound && (
                        isSending ? <Check className="w-3 h-3 opacity-70" /> : <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                      )}
                    </div>
                  </div>
                  {isOutbound && (
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

      <div className={`p-3 flex items-center gap-2 shrink-0 bg-[#202c33] border-transparent`}>
        <div className="flex gap-1 shrink-0">
          <button onClick={handleEmoji} className="p-2 text-[#8696a0] hover:text-[#e9edef] rounded-md transition-colors cursor-pointer">
            <Smile className="w-6 h-6" />
          </button>
          <button onClick={handleAttachment} className="p-2 text-[#8696a0] hover:text-[#e9edef] rounded-md transition-colors cursor-pointer">
            <Paperclip className="w-5 h-5" />
          </button>
        </div>
        
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Mensagem"
          className={`flex-1 border-0 rounded-lg px-4 py-2.5 text-sm focus:outline-none resize-none min-h-[44px] max-h-[120px] bg-[#2a3942] text-[#e9edef] placeholder-[#8696a0] leading-snug`}
          rows={1}
        />
        
        {newMessage.trim() ? (
          <Button
            onClick={handleSend}
            disabled={sending}
            size="icon"
            className="rounded-full bg-[#00a884] hover:bg-[#06cf9c] text-white w-10 h-10 shrink-0 cursor-pointer border-none"
          >
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-1" />}
          </Button>
        ) : (
          <button onClick={handleMic} className={`p-3 text-white rounded-full transition-colors cursor-pointer shrink-0 w-10 h-10 flex items-center justify-center ${isRecording ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-[#00a884] hover:bg-[#06cf9c]'}`}>
            <Mic className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
