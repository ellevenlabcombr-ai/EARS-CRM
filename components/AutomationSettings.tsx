"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { MessageCircle, Smartphone, CheckCircle, AlertCircle, Loader2, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AutomationSettings() {
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);
  const [whatsappProvider, setWhatsappProvider] = useState('evolution');
  const [evolutionApiUrl, setEvolutionApiUrl] = useState('');
  const [evolutionApiKey, setEvolutionApiKey] = useState('');
  const [evolutionInstanceId, setEvolutionInstanceId] = useState('');
  const [whatsappReminderTemplate, setWhatsappReminderTemplate] = useState('Olá {nome}! Seu atendimento está marcado para {data} às {hora}.');
  const [whatsappFollowupTemplate, setWhatsappFollowupTemplate] = useState('Olá {nome}! Como você está se sentindo após o nosso atendimento?');
  
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [resendApiKey, setResendApiKey] = useState('');
  const [emailReminderTemplate, setEmailReminderTemplate] = useState('Seu atendimento está marcado para {data} às {hora}.');
  
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
        .from('automation_settings')
        .select('*')
        .maybeSingle();
      
      if (error) {
        if (error.message?.includes('relation "automation_settings" does not exist')) {
          return;
        } else {
          throw error;
        }
      }
      
      if (data) {
        if (data.whatsapp_enabled !== undefined) setWhatsappEnabled(data.whatsapp_enabled);
        if (data.whatsapp_provider) setWhatsappProvider(data.whatsapp_provider);
        if (data.evolution_api_url) setEvolutionApiUrl(data.evolution_api_url);
        if (data.evolution_api_key) setEvolutionApiKey(data.evolution_api_key);
        if (data.evolution_instance_id) setEvolutionInstanceId(data.evolution_instance_id);
        if (data.whatsapp_reminder_template) setWhatsappReminderTemplate(data.whatsapp_reminder_template);
        if (data.whatsapp_followup_template) setWhatsappFollowupTemplate(data.whatsapp_followup_template);
        if (data.email_enabled !== undefined) setEmailEnabled(data.email_enabled);
        if (data.resend_api_key) setResendApiKey(data.resend_api_key);
        if (data.email_reminder_template) setEmailReminderTemplate(data.email_reminder_template);
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
        .from('automation_settings')
        .select('id')
        .maybeSingle();

      if (selectError && !selectError.message?.includes('relation "automation_settings" does not exist')) {
        throw selectError;
      }

      const payload = {
        whatsapp_enabled: whatsappEnabled,
        whatsapp_provider: whatsappProvider,
        evolution_api_url: evolutionApiUrl,
        evolution_api_key: evolutionApiKey,
        evolution_instance_id: evolutionInstanceId,
        whatsapp_reminder_template: whatsappReminderTemplate,
        whatsapp_followup_template: whatsappFollowupTemplate,
        email_enabled: emailEnabled,
        resend_api_key: resendApiKey,
        email_reminder_template: emailReminderTemplate,
        updated_at: new Date().toISOString()
      };

      let error;
      if (existing) {
        const { error: updateError } = await supabase
          .from('automation_settings')
          .update(payload)
          .eq('id', existing.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('automation_settings')
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
      {/* WhatsApp Automation Section */}
      <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl space-y-6">
        <div className="flex items-center gap-3 md:gap-4 mb-2">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-[#25D366]/10 text-[#25D366] rounded-xl md:rounded-2xl flex items-center justify-center shrink-0">
            <MessageCircle className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm md:text-base font-black text-white uppercase tracking-tight">Automação WhatsApp</h3>
            <p className="text-[10px] md:text-xs text-slate-500 font-medium">Lembretes e acompanhamento via WhatsApp</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={whatsappEnabled}
              onChange={(e) => setWhatsappEnabled(e.target.checked)}
            />
            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#25D366]"></div>
          </label>
        </div>
        
        <div className={`flex flex-col gap-8 pt-6 border-t border-slate-800/50 transition-opacity duration-300 ${whatsappEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-4">
                <label className="text-[10px] md:text-xs font-black text-[#25D366] uppercase tracking-widest pl-1">Template: Lembrete de Agendamento</label>
                <textarea 
                  value={whatsappReminderTemplate}
                  onChange={(e) => setWhatsappReminderTemplate(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-white focus:border-[#25D366]/50 focus:ring-2 focus:ring-[#25D366]/10 outline-none transition-all text-sm font-medium resize-none"
                />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] md:text-xs font-black text-[#25D366] uppercase tracking-widest pl-1">Template: Follow-up Pós-consulta</label>
                <textarea 
                  value={whatsappFollowupTemplate}
                  onChange={(e) => setWhatsappFollowupTemplate(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-white focus:border-[#25D366]/50 focus:ring-2 focus:ring-[#25D366]/10 outline-none transition-all text-sm font-medium resize-none"
                />
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Configuração da API (Evolution)</span>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={evolutionApiUrl}
                    onChange={(e) => setEvolutionApiUrl(e.target.value)}
                    placeholder="URL da Evolution API"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-[#25D366]/50 focus:ring-2 focus:ring-[#25D366]/10 outline-none text-sm transition-all"
                  />
                  <input
                    type="password"
                    value={evolutionApiKey}
                    onChange={(e) => setEvolutionApiKey(e.target.value)}
                    placeholder="Global API Key"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-[#25D366]/50 focus:ring-2 focus:ring-[#25D366]/10 outline-none text-sm transition-all"
                  />
                  <input
                    type="text"
                    value={evolutionInstanceId}
                    onChange={(e) => setEvolutionInstanceId(e.target.value)}
                    placeholder="Nome da Instância"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-[#25D366]/50 focus:ring-2 focus:ring-[#25D366]/10 outline-none text-sm transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Variáveis Suportadas:</span>
                <div className="flex flex-wrap gap-2 text-xs font-mono">
                  <span className="text-[#25D366] bg-[#25D366]/10 px-2 py-1.5 rounded-lg border border-[#25D366]/20">{`{nome}`}</span>
                  <span className="text-[#25D366] bg-[#25D366]/10 px-2 py-1.5 rounded-lg border border-[#25D366]/20">{`{data}`}</span>
                  <span className="text-[#25D366] bg-[#25D366]/10 px-2 py-1.5 rounded-lg border border-[#25D366]/20">{`{hora}`}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] md:text-xs font-black text-slate-400 border-b border-slate-800 pb-2 uppercase tracking-widest pl-1 flex items-center justify-between">
                <span>Preview em Tempo Real</span>
                <Smartphone className="w-3 h-3 md:w-4 md:h-4" />
              </label>
              <div className="bg-[#0b141a] rounded-2xl p-4 md:p-6 border border-[#202c33] shadow-xl flex flex-col gap-4 relative overflow-hidden h-full min-h-[300px]">
                <div className="absolute top-0 left-0 w-full px-4 py-2 bg-[#202c33] border-b border-[#2a3942] flex items-center justify-center gap-2 z-10 shadow-md">
                  <span className="text-[10px] font-bold text-[#e9edef] uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#25D366]"></span> WhatsApp
                  </span>
                </div>
                
                {/* Background Pattern fake for WhatsApp */}
                <div className="absolute inset-0 opacity-[0.03] bg-[url('https://static.whatsapp.net/rsrc.php/v3/yl/r/rrotdy92T1_.png')] pointer-events-none"></div>

                <div className="mt-8 flex flex-col gap-4">
                  <div className="bg-[#005c4b] text-[#e9edef] p-3 md:p-4 rounded-xl rounded-tr-none self-end w-full sm:max-w-[80%] md:max-w-[70%] shadow-lg shadow-black/20 relative">
                    <div className="text-sm md:text-base whitespace-pre-wrap font-medium leading-relaxed">
                      {whatsappReminderTemplate
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

                  <div className="bg-[#005c4b] text-[#e9edef] p-3 md:p-4 rounded-xl rounded-tr-none self-end w-full sm:max-w-[80%] md:max-w-[70%] shadow-lg shadow-black/20 relative opacity-80 mt-4">
                    <div className="text-sm md:text-base whitespace-pre-wrap font-medium leading-relaxed">
                      {whatsappFollowupTemplate
                        .replace('{nome}', 'Mariana')
                        .replace('{data}', new Date().toLocaleDateString('pt-BR'))
                        .replace('{hora}', '15:00')}
                    </div>
                    <div className="absolute top-0 right-[-10px] w-0 h-0 border-[10px] border-transparent border-t-[#005c4b] border-l-[#005c4b]"></div>
                    <div className="text-[10px] md:text-xs text-[#e9edef]/70 text-right mt-2 flex justify-end items-center gap-1 font-sans">
                      +1 dia <span className="text-[#53bdeb] tracking-tighter ml-1">✓✓</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <Button
                    onClick={() => {
                        alert("Simulação Iniciada!\nNa versão final, iremos buscar um agendamento real e disparar o webhook/API para a Evolution.")
                    }}
                    className="w-full bg-slate-800 hover:bg-[#25D366] text-white font-black uppercase tracking-widest transition-colors py-6 rounded-2xl text-xs md:text-sm shadow-xl"
                  >
                    Simular Disparo
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Email Automation Section */}
      <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl space-y-6">
        <div className="flex items-center gap-3 md:gap-4 mb-2">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-sky-500/10 text-sky-400 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0">
            <Mail className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm md:text-base font-black text-white uppercase tracking-tight">Automação de Email</h3>
            <p className="text-[10px] md:text-xs text-slate-500 font-medium">Lembretes proativos e atualizações via Email</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={emailEnabled}
              onChange={(e) => setEmailEnabled(e.target.checked)}
            />
            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
          </label>
        </div>
        
        <div className={`flex flex-col gap-8 pt-6 border-t border-slate-800/50 transition-opacity duration-300 ${emailEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-[10px] md:text-xs font-black text-sky-500 uppercase tracking-widest pl-1">API do Resend</label>
              <input
                type="password"
                value={resendApiKey}
                onChange={(e) => setResendApiKey(e.target.value)}
                placeholder="re_xxxxxxxxxxxxxx"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/10 outline-none text-sm transition-all"
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <label className="text-[10px] md:text-xs font-black text-sky-500 uppercase tracking-widest pl-1">Template de Lembrete</label>
            <textarea 
              value={emailReminderTemplate}
              onChange={(e) => setEmailReminderTemplate(e.target.value)}
              rows={4}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-white focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/10 outline-none transition-all text-sm font-medium resize-none"
            />
          </div>

          <div className="max-w-xs">
            <Button
              onClick={() => {
                  alert("Simulação Iniciada!\nNa versão final, enviaremos um e-mail de teste usando a chave do Resend configurada.")
              }}
              className="w-full bg-slate-800 hover:bg-sky-500 text-white font-black uppercase tracking-widest transition-colors py-6 rounded-2xl text-xs md:text-sm shadow-xl"
            >
              Simular Envio
            </Button>
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

