"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { MessageCircle, Smartphone, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AutomationSettings() {
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderTemplate, setReminderTemplate] = useState('Olá {nome}! Seu atendimento está marcado para {data} às {hora}.');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    if (!supabase) return;
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('agenda_settings')
        .select('*')
        .maybeSingle();
      
      if (error) {
        if (error.message?.includes('relation "agenda_settings" does not exist')) {
          return;
        } else {
          throw error;
        }
      }
      
      if (data) {
        if (data.reminder_enabled !== undefined) setReminderEnabled(data.reminder_enabled);
        if (data.reminder_template) setReminderTemplate(data.reminder_template);
      }
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setMessage(`Erro ao carregar: ${err.message || String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!supabase) return;
    setIsSaving(true);
    setStatus('idle');

    try {
      const { data: existing, error: selectError } = await supabase
        .from('agenda_settings')
        .select('id')
        .maybeSingle();

      if (selectError) throw selectError;

      const payload = {
        reminder_enabled: reminderEnabled,
        reminder_template: reminderTemplate,
        updated_at: new Date().toISOString()
      };

      let error;
      if (existing) {
        const { error: updateError } = await supabase
          .from('agenda_settings')
          .update(payload)
          .eq('id', existing.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('agenda_settings')
          .insert([payload]);
        error = insertError;
      }

      if (error) throw error;

      setStatus('success');
      setMessage('Automações sincronizadas ao núcleo operacional.');
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setMessage(`Erro: ${err.message || String(err)}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-8">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Carregando automações...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 pb-32">
      <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl space-y-6">
        <div className="flex items-center gap-3 md:gap-4 mb-2">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-cyan-500/10 text-cyan-400 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0">
            <MessageCircle className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm md:text-base font-black text-white uppercase tracking-tight">Automação de Comunicação</h3>
            <p className="text-[10px] md:text-xs text-slate-500 font-medium">Lembretes proativos (WhatsApp)</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={reminderEnabled}
              onChange={(e) => setReminderEnabled(e.target.checked)}
            />
            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
          </label>
        </div>
        
        <div className={`flex flex-col gap-8 pt-6 border-t border-slate-800/50 transition-opacity duration-300 ${reminderEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
          <div className="space-y-4">
            <label className="text-[10px] md:text-xs font-black text-cyan-500 uppercase tracking-widest pl-1">Template da Mensagem</label>
            <textarea 
              value={reminderTemplate}
              onChange={(e) => setReminderTemplate(e.target.value)}
              rows={4}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-white focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 outline-none transition-all text-sm font-medium resize-none"
            />
            <div className="flex flex-col gap-2">
              <span className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Variáveis Suportadas:</span>
              <div className="flex flex-wrap gap-2 text-xs font-mono">
                <span className="text-cyan-400 bg-cyan-500/10 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-cyan-500/20 hover:text-cyan-300 transition-colors border border-cyan-500/20" onClick={() => setReminderTemplate(prev => prev + '{nome}')}>{`{nome}`}</span>
                <span className="text-cyan-400 bg-cyan-500/10 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-cyan-500/20 hover:text-cyan-300 transition-colors border border-cyan-500/20" onClick={() => setReminderTemplate(prev => prev + '{data}')}>{`{data}`}</span>
                <span className="text-cyan-400 bg-cyan-500/10 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-cyan-500/20 hover:text-cyan-300 transition-colors border border-cyan-500/20" onClick={() => setReminderTemplate(prev => prev + '{hora}')}>{`{hora}`}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] md:text-xs font-black text-emerald-500 uppercase tracking-widest pl-1">Preview em Tempo Real</label>
            <div className="bg-[#0b141a] rounded-2xl p-4 md:p-6 border border-[#202c33] shadow-xl flex flex-col gap-4 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full px-4 py-2 bg-[#202c33] border-b border-[#2a3942] flex items-center justify-center gap-2 z-10 shadow-md">
                <Smartphone className="w-4 h-4 text-emerald-500" />
                <span className="text-[10px] font-bold text-[#e9edef] uppercase tracking-widest">Simulação WhatsApp</span>
              </div>
              
              {/* Background Pattern fake for WhatsApp */}
              <div className="absolute inset-0 opacity-[0.03] bg-[url('https://static.whatsapp.net/rsrc.php/v3/yl/r/rrotdy92T1_.png')] pointer-events-none"></div>

              <div className="mt-8 bg-[#005c4b] text-[#e9edef] p-3 md:p-4 rounded-xl rounded-tr-none self-end w-full sm:max-w-[80%] md:max-w-[70%] shadow-lg shadow-black/20 relative">
                <div className="text-sm md:text-base whitespace-pre-wrap font-medium leading-relaxed">
                  {reminderTemplate
                    .replace('{nome}', 'Mariana')
                    .replace('{data}', new Date().toLocaleDateString('pt-BR'))
                    .replace('{hora}', '15:00')}
                </div>
                <div className="absolute top-0 right-[-10px] w-0 h-0 border-[10px] border-transparent border-t-[#005c4b] border-l-[#005c4b]"></div>
                <div className="text-[10px] md:text-xs text-[#e9edef]/70 text-right mt-2 flex justify-end items-center gap-1 font-sans">
                  {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} 
                  <span className="text-[#53bdeb] tracking-tighter ml-1">✓✓</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#050B14]/80 backdrop-blur-xl border-t border-slate-800 p-4 md:p-6 lg:pl-72 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1 w-full max-w-2xl">
          {status !== 'idle' && (
            <div className={`p-3 md:p-4 rounded-xl border flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 ${
              status === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}>
              {status === 'success' ? <CheckCircle size={18} className="shrink-0" /> : <AlertCircle size={18} className="shrink-0" />}
              <span className="text-[10px] md:text-sm font-black uppercase tracking-wider leading-tight">{message}</span>
            </div>
          )}
        </div>

        <Button 
          onClick={handleSave}
          disabled={isSaving}
          className="w-full md:w-auto bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 disabled:text-slate-500 text-[#050B14] font-black uppercase tracking-widest px-8 md:px-12 py-6 rounded-xl md:rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all active:scale-95 text-xs md:text-sm whitespace-nowrap"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-3" />
              Sincronizando...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5 mr-3" />
              Sincronizar Automações
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
