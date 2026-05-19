"use client";

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Send, X, MessageSquare, Loader2, Phone } from 'lucide-react';

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
      };
      setMessages((prev) => [...prev, tempMsg]);
      setTimeout(scrollToBottom, 100);

      const msgToSend = newMessage;
      setNewMessage('');

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

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg transition-transform hover:scale-105 z-50 flex items-center justify-center cursor-pointer"
      >
        <MessageSquare className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className={inline ? "w-full h-full flex flex-col overflow-hidden bg-[#050B14]" : "fixed bottom-6 right-6 w-full max-w-[350px] h-[500px] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden"}>
      <div className="flex items-center justify-between p-4 bg-green-500 text-white shrink-0">
        <div className="flex items-center space-x-3">
           <div className="bg-white/20 p-2 rounded-full">
             <Phone className="w-4 h-4 text-white" />
           </div>
           <div>
              <h3 className="font-semibold text-sm">{athleteName}</h3>
              <p className="text-xs text-green-100">{athletePhone}</p>
           </div>
        </div>
        {!inline && (
          <button onClick={() => setIsOpen(false)} className="text-white hover:bg-green-600 p-1 rounded-md transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#050B14] custom-scrollbar">
        {isLoading && (
          <div className="flex justify-center p-4">
             <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        )}
        {messages.map((msg) => {
          const isOutbound = msg.direction === 'outbound';
          return (
            <div key={msg.id} className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                  isOutbound
                    ? 'bg-green-500 text-white rounded-tr-none'
                    : 'bg-slate-800 text-slate-200 border border-slate-700/50 rounded-tl-none shadow-sm'
                }`}
              >
                <p className="break-words whitespace-pre-wrap">{msg.text}</p>
                <div className="text-[10px] text-right mt-1 opacity-70">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className={`p-3 border-t flex items-center gap-2 shrink-0 ${inline ? 'bg-[#0A1120] border-slate-800/50' : 'bg-slate-900 border-slate-800'}`}>
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Mensagem..."
          className={`flex-1 border-0 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-green-500 resize-none min-h-[40px] max-h-[100px] outline-none ${inline ? 'bg-slate-900/50 text-white' : 'bg-slate-800 text-white'}`}
          rows={1}
        />
        <Button
          onClick={handleSend}
          disabled={sending || !newMessage.trim()}
          size="icon"
          className="rounded-full bg-green-500 hover:bg-green-600 text-white w-10 h-10 shrink-0 cursor-pointer"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}
