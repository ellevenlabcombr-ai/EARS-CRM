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
  const [whatsappReminderTiming, setWhatsappReminderTiming] = useState<string[]>(['24h']);
  const [whatsappFollowupTiming, setWhatsappFollowupTiming] = useState<string[]>(['24h']);
  const [whatsappBirthdayEnabled, setWhatsappBirthdayEnabled] = useState(false);
  const [whatsappBirthdayTemplate, setWhatsappBirthdayTemplate] = useState('Parabéns {nome}! Toda a nossa equipe deseja um feliz aniversário!');
  const [whatsappAbsenceEnabled, setWhatsappAbsenceEnabled] = useState(false);
  const [whatsappAbsenceTemplate, setWhatsappAbsenceTemplate] = useState('Olá {nome}, sentimos sua falta! Faz tempo desde sua última sessão, que tal agendar um retorno?');
  
  const [financeReminderEnabled, setFinanceReminderEnabled] = useState(false);
  const [financeReminderTemplate, setFinanceReminderTemplate] = useState('Olá {nome}! Lembramos que seu pacote/mensalidade vence no dia {data}.');
  const [financeReceiptEnabled, setFinanceReceiptEnabled] = useState(false);
  const [financeReceiptTemplate, setFinanceReceiptTemplate] = useState('Olá {nome}! Confirmamos o recebimento do seu pagamento no valor de R$ {valor}. Obrigado!');
  
  const [profMorningResumeEnabled, setProfMorningResumeEnabled] = useState(false);
  const [profMorningResumeTime, setProfMorningResumeTime] = useState('07:00');
  const [profNewAppointmentEnabled, setProfNewAppointmentEnabled] = useState(false);
  
  const [prepInstructionsEnabled, setPrepInstructionsEnabled] = useState(false);
  const [prepInstructionsTemplate, setPrepInstructionsTemplate] = useState('Olá {nome}! Aqui estão algumas orientações importantes antes da sua primeira avaliação com a gente.');

  const [emailEnabled, setEmailEnabled] = useState(false);
  const [resendApiKey, setResendApiKey] = useState('');
  const [emailReminderTemplate, setEmailReminderTemplate] = useState('Seu atendimento está marcado para {data} às {hora}.');
  
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [isSimulatingEmail, setIsSimulatingEmail] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [isSimulatingWpp, setIsSimulatingWpp] = useState(false);

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
        if (error.message?.includes('relation "automation_settings" does not exist') || error.message?.includes('SCHEMA CACHE') || error.message?.includes('column')) {
           const autoFixSql = `
            DO $$ 
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_settings' AND column_name = 'email_enabled') THEN
                    ALTER TABLE public.automation_settings ADD COLUMN email_enabled BOOLEAN DEFAULT false;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_settings' AND column_name = 'email_reminder_template') THEN
                    ALTER TABLE public.automation_settings ADD COLUMN email_reminder_template TEXT DEFAULT 'Seu atendimento está marcado para {data} às {hora}.';
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_settings' AND column_name = 'resend_api_key') THEN
                    ALTER TABLE public.automation_settings ADD COLUMN resend_api_key TEXT;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_settings' AND column_name = 'whatsapp_enabled') THEN
                    ALTER TABLE public.automation_settings ADD COLUMN whatsapp_enabled BOOLEAN DEFAULT true;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_settings' AND column_name = 'whatsapp_reminder_template') THEN
                    ALTER TABLE public.automation_settings ADD COLUMN whatsapp_reminder_template TEXT DEFAULT 'Olá {nome}! Seu atendimento está marcado para {data} às {hora}.';
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_settings' AND column_name = 'whatsapp_followup_template') THEN
                    ALTER TABLE public.automation_settings ADD COLUMN whatsapp_followup_template TEXT DEFAULT 'Olá {nome}! Como você está se sentindo após o nosso atendimento?';
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_settings' AND column_name = 'whatsapp_provider') THEN
                    ALTER TABLE public.automation_settings ADD COLUMN whatsapp_provider TEXT DEFAULT 'evolution';
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_settings' AND column_name = 'whatsapp_followup_timing') THEN
                    ALTER TABLE public.automation_settings ADD COLUMN whatsapp_followup_timing TEXT[] DEFAULT ARRAY['24h']::TEXT[];
                END IF;
            END $$;
            NOTIFY pgrst, 'reload schema';
           `;
           await supabase.rpc('exec_sql', { sql: autoFixSql });
           
           setStatus('error');
           setMessage('A estrutura do banco estava desatualizada, mas foi corrigida automaticamente. Recarregue a página em 5 segundos!');
           
           setTimeout(() => {
             fetchSettings();
           }, 5000);
           
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
        if (data.whatsapp_reminder_timing) setWhatsappReminderTiming(data.whatsapp_reminder_timing);
        if (data.whatsapp_followup_timing) setWhatsappFollowupTiming(data.whatsapp_followup_timing);
        if (data.whatsapp_birthday_enabled !== undefined) setWhatsappBirthdayEnabled(data.whatsapp_birthday_enabled);
        if (data.whatsapp_birthday_template) setWhatsappBirthdayTemplate(data.whatsapp_birthday_template);
        if (data.whatsapp_absence_enabled !== undefined) setWhatsappAbsenceEnabled(data.whatsapp_absence_enabled);
        if (data.whatsapp_absence_template) setWhatsappAbsenceTemplate(data.whatsapp_absence_template);
        if (data.finance_reminder_enabled !== undefined) setFinanceReminderEnabled(data.finance_reminder_enabled);
        if (data.finance_reminder_template) setFinanceReminderTemplate(data.finance_reminder_template);
        if (data.finance_receipt_enabled !== undefined) setFinanceReceiptEnabled(data.finance_receipt_enabled);
        if (data.finance_receipt_template) setFinanceReceiptTemplate(data.finance_receipt_template);
        if (data.prof_morning_resume_enabled !== undefined) setProfMorningResumeEnabled(data.prof_morning_resume_enabled);
        if (data.prof_morning_resume_time) setProfMorningResumeTime(data.prof_morning_resume_time);
        if (data.prof_new_appointment_enabled !== undefined) setProfNewAppointmentEnabled(data.prof_new_appointment_enabled);
        if (data.prep_instructions_enabled !== undefined) setPrepInstructionsEnabled(data.prep_instructions_enabled);
        if (data.prep_instructions_template) setPrepInstructionsTemplate(data.prep_instructions_template);
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
        whatsapp_reminder_timing: whatsappReminderTiming,
        whatsapp_followup_timing: whatsappFollowupTiming,
        whatsapp_birthday_enabled: whatsappBirthdayEnabled,
        whatsapp_birthday_template: whatsappBirthdayTemplate,
        whatsapp_absence_enabled: whatsappAbsenceEnabled,
        whatsapp_absence_template: whatsappAbsenceTemplate,
        finance_reminder_enabled: financeReminderEnabled,
        finance_reminder_template: financeReminderTemplate,
        finance_receipt_enabled: financeReceiptEnabled,
        finance_receipt_template: financeReceiptTemplate,
        prof_morning_resume_enabled: profMorningResumeEnabled,
        prof_morning_resume_time: profMorningResumeTime,
        prof_new_appointment_enabled: profNewAppointmentEnabled,
        prep_instructions_enabled: prepInstructionsEnabled,
        prep_instructions_template: prepInstructionsTemplate,
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

      if (error) {
        if (error.message?.includes('SCHEMA CACHE') || error.message?.includes('column')) {
           const autoFixSql = `
            DO $$ 
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_settings' AND column_name = 'email_enabled') THEN
                    ALTER TABLE public.automation_settings ADD COLUMN email_enabled BOOLEAN DEFAULT false;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_settings' AND column_name = 'email_reminder_template') THEN
                    ALTER TABLE public.automation_settings ADD COLUMN email_reminder_template TEXT DEFAULT 'Seu atendimento está marcado para {data} às {hora}.';
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_settings' AND column_name = 'resend_api_key') THEN
                    ALTER TABLE public.automation_settings ADD COLUMN resend_api_key TEXT;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_settings' AND column_name = 'whatsapp_enabled') THEN
                    ALTER TABLE public.automation_settings ADD COLUMN whatsapp_enabled BOOLEAN DEFAULT true;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_settings' AND column_name = 'whatsapp_reminder_template') THEN
                    ALTER TABLE public.automation_settings ADD COLUMN whatsapp_reminder_template TEXT DEFAULT 'Olá {nome}! Seu atendimento está marcado para {data} às {hora}.';
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_settings' AND column_name = 'whatsapp_followup_template') THEN
                    ALTER TABLE public.automation_settings ADD COLUMN whatsapp_followup_template TEXT DEFAULT 'Olá {nome}! Como você está se sentindo após o nosso atendimento?';
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_settings' AND column_name = 'whatsapp_provider') THEN
                    ALTER TABLE public.automation_settings ADD COLUMN whatsapp_provider TEXT DEFAULT 'evolution';
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_settings' AND column_name = 'whatsapp_followup_timing') THEN
                    ALTER TABLE public.automation_settings ADD COLUMN whatsapp_followup_timing TEXT[] DEFAULT ARRAY['24h']::TEXT[];
                END IF;
            END $$;
            NOTIFY pgrst, 'reload schema';
           `;
           await supabase.rpc('exec_sql', { sql: autoFixSql });
           throw new Error('As tabelas do banco de dados foram atualizadas automaticamente para incluir o EMAIL_ENABLED. Por favor, tente salvar as configurações novamente agora ou recarregue a página.');
        }
        throw error;
      }

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

  const handleSimulateWpp = async () => {
    if (!evolutionApiUrl || !evolutionInstanceId || !testPhone) {
      setStatus('error');
      setMessage('Preencha a URL da Evolution, o Nome da Instância e o Telefone de Destino para testar o WhatsApp.');
      return;
    }

    try {
      setIsSimulatingWpp(true);
      const res = await fetch('/api/simulate-whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: evolutionApiUrl,
          apiKey: evolutionApiKey,
          instanceId: evolutionInstanceId,
          phone: testPhone,
          message: whatsappReminderTemplate.replace('{nome}', 'Usuário Teste').replace('{apelido}', 'Teste').replace('{data}', new Date().toLocaleDateString('pt-BR')).replace('{hora}', '15:00')
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao simular');
      setStatus('success');
      setMessage('Mensagem de teste enviada para WhatsApp com sucesso!');
    } catch (err: any) {
      setStatus('error');
      setMessage(`Erro ao testar WhatsApp: ${err.message}`);
    } finally {
      setIsSimulatingWpp(false);
    }
  };

  const handleSimulateEmail = async () => {
    if (!resendApiKey || !testEmailAddress) {
      setStatus('error');
      setMessage('Preencha a API Key do Resend e o Email de Destino para testar.');
      return;
    }

    try {
      setIsSimulatingEmail(true);
      const res = await fetch('/api/simulate-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          apiKey: resendApiKey,
          to: testEmailAddress,
          subject: 'Lembrete de Agendamento (Teste)',
          html: `<div style="font-family:sans-serif;padding:20px;"><h2>Olá Usuário Teste,</h2><p>${emailReminderTemplate.replace(/{nome}/g, 'Usuário Teste').replace(/{apelido}/g, 'Teste').replace(/{data}/g, new Date().toLocaleDateString('pt-BR')).replace(/{hora}/g, '15:00').replace(/{valor}/g, '250,00').replace(/{link_anexo}/g, 'https://elleven.app/...')}</p></div>`
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao simular email');
      setStatus('success');
      setMessage('E-mail de teste enviado com sucesso!');
    } catch (err: any) {
      setStatus('error');
      setMessage(`Erro ao testar Email: ${err.message}`);
    } finally {
      setIsSimulatingEmail(false);
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
                
                <div className="flex gap-2 pb-2">
                  {['24h', '2h', '1h'].map((time) => (
                    <label key={time} className={`cursor-pointer px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${whatsappReminderTiming.includes(time) ? 'bg-[#25D366]/20 border-[#25D366] text-[#25D366]' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600'}`}>
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={whatsappReminderTiming.includes(time)}
                        onChange={(e) => {
                          if (e.target.checked) setWhatsappReminderTiming([...whatsappReminderTiming, time]);
                          else setWhatsappReminderTiming(whatsappReminderTiming.filter(t => t !== time));
                        }}
                      />
                      {time} Antes
                    </label>
                  ))}
                </div>

                <textarea 
                  value={whatsappReminderTemplate}
                  onChange={(e) => setWhatsappReminderTemplate(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-white focus:border-[#25D366]/50 focus:ring-2 focus:ring-[#25D366]/10 outline-none transition-all text-sm font-medium resize-none"
                />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] md:text-xs font-black text-[#25D366] uppercase tracking-widest pl-1">Template: Follow-up Pós-consulta</label>
                
                <div className="flex gap-2 pb-2">
                  {['1h', '2h', '24h', '48h'].map((time) => (
                    <label key={time} className={`cursor-pointer px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${whatsappFollowupTiming.includes(time) ? 'bg-[#25D366]/20 border-[#25D366] text-[#25D366]' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-600'}`}>
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={whatsappFollowupTiming.includes(time)}
                        onChange={(e) => {
                          if (e.target.checked) setWhatsappFollowupTiming([...whatsappFollowupTiming, time]);
                          else setWhatsappFollowupTiming(whatsappFollowupTiming.filter(t => t !== time));
                        }}
                      />
                      {time} Depois
                    </label>
                  ))}
                </div>

                <textarea 
                  value={whatsappFollowupTemplate}
                  onChange={(e) => setWhatsappFollowupTemplate(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-white focus:border-[#25D366]/50 focus:ring-2 focus:ring-[#25D366]/10 outline-none transition-all text-sm font-medium resize-none"
                />
              </div>

              {/* Birthday automation */}
              <div className="space-y-4 pt-4 border-t border-slate-800/50">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] md:text-xs font-black text-[#25D366] uppercase tracking-widest pl-1">Mensagem de Aniversário</label>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 scale-90">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={whatsappBirthdayEnabled}
                      onChange={(e) => setWhatsappBirthdayEnabled(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#25D366]"></div>
                  </label>
                </div>
                {whatsappBirthdayEnabled && (
                  <textarea 
                    value={whatsappBirthdayTemplate}
                    onChange={(e) => setWhatsappBirthdayTemplate(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-white focus:border-[#25D366]/50 focus:ring-2 focus:ring-[#25D366]/10 outline-none transition-all text-sm font-medium resize-none"
                  />
                )}
              </div>

              {/* Absence automation */}
              <div className="space-y-4 pt-4 border-t border-slate-800/50">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] md:text-xs font-black text-[#25D366] uppercase tracking-widest pl-1">Lembrete de Inatividade (30 dias)</label>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 scale-90">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={whatsappAbsenceEnabled}
                      onChange={(e) => setWhatsappAbsenceEnabled(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#25D366]"></div>
                  </label>
                </div>
                {whatsappAbsenceEnabled && (
                  <textarea 
                    value={whatsappAbsenceTemplate}
                    onChange={(e) => setWhatsappAbsenceTemplate(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-white focus:border-[#25D366]/50 focus:ring-2 focus:ring-[#25D366]/10 outline-none transition-all text-sm font-medium resize-none"
                  />
                )}
              </div>

              {/* Finance Reminder */}
              <div className="space-y-4 pt-4 border-t border-slate-800/50">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] md:text-xs font-black text-[#25D366] uppercase tracking-widest pl-1">Lembrete Financeiro de Vencimento</label>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 scale-90">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={financeReminderEnabled}
                      onChange={(e) => setFinanceReminderEnabled(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#25D366]"></div>
                  </label>
                </div>
                {financeReminderEnabled && (
                  <textarea 
                    value={financeReminderTemplate}
                    onChange={(e) => setFinanceReminderTemplate(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-white focus:border-[#25D366]/50 focus:ring-2 focus:ring-[#25D366]/10 outline-none transition-all text-sm font-medium resize-none"
                    placeholder="Olá {nome}! Lembramos que seu pacote/mensalidade vence no dia {data}."
                  />
                )}
              </div>

              {/* Finance Receipt */}
              <div className="space-y-4 pt-4 border-t border-slate-800/50">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] md:text-xs font-black text-[#25D366] uppercase tracking-widest pl-1">Agradecimento de Pagamento (Recibo)</label>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 scale-90">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={financeReceiptEnabled}
                      onChange={(e) => setFinanceReceiptEnabled(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#25D366]"></div>
                  </label>
                </div>
                {financeReceiptEnabled && (
                  <textarea 
                    value={financeReceiptTemplate}
                    onChange={(e) => setFinanceReceiptTemplate(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-white focus:border-[#25D366]/50 focus:ring-2 focus:ring-[#25D366]/10 outline-none transition-all text-sm font-medium resize-none"
                    placeholder="Olá {nome}! Confirmamos o recebimento do seu pagamento no valor de R$ {valor}. Obrigado!"
                  />
                )}
              </div>

              {/* Pre assessment instructions */}
              <div className="space-y-4 pt-4 border-t border-slate-800/50">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] md:text-xs font-black text-[#25D366] uppercase tracking-widest pl-1">Envio de Anexos/Orientações (Primeira Consulta)</label>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 scale-90">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={prepInstructionsEnabled}
                      onChange={(e) => setPrepInstructionsEnabled(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#25D366]"></div>
                  </label>
                </div>
                {prepInstructionsEnabled && (
                  <textarea 
                    value={prepInstructionsTemplate}
                    onChange={(e) => setPrepInstructionsTemplate(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-white focus:border-[#25D366]/50 focus:ring-2 focus:ring-[#25D366]/10 outline-none transition-all text-sm font-medium resize-none"
                    placeholder="Aqui estão algumas orientações importantes antes da sua primeira avaliação com a gente."
                  />
                )}
              </div>

              {/* Professional Morning Resumo */}
              <div className="space-y-4 pt-4 border-t border-slate-800/50">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] md:text-xs font-black text-[#25D366] uppercase tracking-widest pl-1">Resumo Matinal para Profissional (Para Mim)</label>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0 scale-90">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={profMorningResumeEnabled}
                        onChange={(e) => setProfMorningResumeEnabled(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#25D366]"></div>
                    </label>
                  </div>
                  {profMorningResumeEnabled && (
                    <div className="flex items-center gap-4 px-1">
                      <label className="text-xs text-slate-400 font-medium">Horário do disparo:</label>
                      <input
                        type="time"
                        value={profMorningResumeTime}
                        onChange={(e) => setProfMorningResumeTime(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-[#25D366]/50 outline-none"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Professional New Appointment Alert */}
              <div className="space-y-4 pt-4 border-t border-slate-800/50 pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <label className="text-[10px] md:text-xs font-black text-[#25D366] uppercase tracking-widest pl-1">Alerta: Novo Agendamento (Para Mim)</label>
                    <span className="text-[10px] text-slate-500 pl-1 mt-1 font-medium">Você será notificado imediatamente ao receber novos agendamentos no futuro.</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0 scale-90">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={profNewAppointmentEnabled}
                      onChange={(e) => setProfNewAppointmentEnabled(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#25D366]"></div>
                  </label>
                </div>
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
                  <span className="text-[#25D366] bg-[#25D366]/10 px-2 py-1.5 rounded-lg border border-[#25D366]/20">{`{apelido}`}</span>
                  <span className="text-[#25D366] bg-[#25D366]/10 px-2 py-1.5 rounded-lg border border-[#25D366]/20">{`{nome}`}</span>
                  <span className="text-[#25D366] bg-[#25D366]/10 px-2 py-1.5 rounded-lg border border-[#25D366]/20">{`{data}`}</span>
                  <span className="text-[#25D366] bg-[#25D366]/10 px-2 py-1.5 rounded-lg border border-[#25D366]/20">{`{hora}`}</span>
                  <span className="text-[#25D366] bg-[#25D366]/10 px-2 py-1.5 rounded-lg border border-[#25D366]/20" title="Valor do Financeiro">{`{valor}`}</span>
                  <span className="text-[#25D366] bg-[#25D366]/10 px-2 py-1.5 rounded-lg border border-[#25D366]/20" title="Link da Orientacao">{`{link_anexo}`}</span>
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
                        .replace(/{nome}/g, 'Mariana')
                        .replace(/{apelido}/g, 'Mari')
                        .replace(/{data}/g, new Date().toLocaleDateString('pt-BR'))
                        .replace(/{hora}/g, '15:00')
                        .replace(/{valor}/g, '250,00')
                        .replace(/{link_anexo}/g, 'https://elleven.app/...')}
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
                        .replace(/{nome}/g, 'Mariana')
                        .replace(/{apelido}/g, 'Mari')
                        .replace(/{data}/g, new Date().toLocaleDateString('pt-BR'))
                        .replace(/{hora}/g, '15:00')
                        .replace(/{valor}/g, '250,00')
                        .replace(/{link_anexo}/g, 'https://elleven.app/...')}
                    </div>
                    <div className="absolute top-0 right-[-10px] w-0 h-0 border-[10px] border-transparent border-t-[#005c4b] border-l-[#005c4b]"></div>
                    <div className="text-[10px] md:text-xs text-[#e9edef]/70 text-right mt-2 flex justify-end items-center gap-1 font-sans">
                      +{whatsappFollowupTiming[0] || '24h'} <span className="text-[#53bdeb] tracking-tighter ml-1">✓✓</span>
                    </div>
                  </div>

                  {whatsappBirthdayEnabled && (
                    <div className="bg-[#005c4b] text-[#e9edef] p-3 md:p-4 rounded-xl rounded-tr-none self-end w-full sm:max-w-[80%] md:max-w-[70%] shadow-lg shadow-black/20 relative opacity-90 mt-4">
                      <div className="text-sm md:text-base whitespace-pre-wrap font-medium leading-relaxed">
                        {whatsappBirthdayTemplate
                          .replace(/{nome}/g, 'Mariana')
                          .replace(/{apelido}/g, 'Mari')
                          .replace(/{data}/g, new Date().toLocaleDateString('pt-BR'))
                          .replace(/{hora}/g, '15:00')
                          .replace(/{valor}/g, '250,00')
                          .replace(/{link_anexo}/g, 'https://elleven.app/...')}
                      </div>
                      <div className="absolute top-0 right-[-10px] w-0 h-0 border-[10px] border-transparent border-t-[#005c4b] border-l-[#005c4b]"></div>
                      <div className="text-[10px] md:text-xs text-[#e9edef]/70 text-right mt-2 flex justify-end items-center gap-1 font-sans">
                        Aniversário <span className="text-[#53bdeb] tracking-tighter ml-1">✓✓</span>
                      </div>
                    </div>
                  )}

                  {whatsappAbsenceEnabled && (
                    <div className="bg-[#005c4b] text-[#e9edef] p-3 md:p-4 rounded-xl rounded-tr-none self-end w-full sm:max-w-[80%] md:max-w-[70%] shadow-lg shadow-black/20 relative opacity-90 mt-4">
                      <div className="text-sm md:text-base whitespace-pre-wrap font-medium leading-relaxed">
                        {whatsappAbsenceTemplate
                          .replace(/{nome}/g, 'Mariana')
                          .replace(/{apelido}/g, 'Mari')
                          .replace(/{data}/g, new Date().toLocaleDateString('pt-BR'))
                          .replace(/{hora}/g, '15:00')
                          .replace(/{valor}/g, '250,00')
                          .replace(/{link_anexo}/g, 'https://elleven.app/...')}
                      </div>
                      <div className="absolute top-0 right-[-10px] w-0 h-0 border-[10px] border-transparent border-t-[#005c4b] border-l-[#005c4b]"></div>
                      <div className="text-[10px] md:text-xs text-[#e9edef]/70 text-right mt-2 flex justify-end items-center gap-1 font-sans">
                        +30 dias inativa <span className="text-[#53bdeb] tracking-tighter ml-1">✓✓</span>
                      </div>
                    </div>
                  )}

                  {financeReminderEnabled && (
                    <div className="bg-[#005c4b] text-[#e9edef] p-3 md:p-4 rounded-xl rounded-tr-none self-end w-full sm:max-w-[80%] md:max-w-[70%] shadow-lg shadow-black/20 relative opacity-90 mt-4">
                      <div className="text-sm md:text-base whitespace-pre-wrap font-medium leading-relaxed">
                        {financeReminderTemplate
                          .replace(/{nome}/g, 'Mariana')
                          .replace(/{apelido}/g, 'Mari')
                          .replace(/{data}/g, new Date(Date.now() + 86400000 * 2).toLocaleDateString('pt-BR'))
                          .replace(/{hora}/g, '15:00')
                          .replace(/{valor}/g, '250,00')
                          .replace(/{link_anexo}/g, 'https://elleven.app/...')}
                      </div>
                      <div className="absolute top-0 right-[-10px] w-0 h-0 border-[10px] border-transparent border-t-[#005c4b] border-l-[#005c4b]"></div>
                      <div className="text-[10px] md:text-xs text-[#e9edef]/70 text-right mt-2 flex justify-end items-center gap-1 font-sans">
                        Fin. Lembrete <span className="text-[#53bdeb] tracking-tighter ml-1">✓✓</span>
                      </div>
                    </div>
                  )}

                  {financeReceiptEnabled && (
                    <div className="bg-[#005c4b] text-[#e9edef] p-3 md:p-4 rounded-xl rounded-tr-none self-end w-full sm:max-w-[80%] md:max-w-[70%] shadow-lg shadow-black/20 relative opacity-90 mt-4">
                      <div className="text-sm md:text-base whitespace-pre-wrap font-medium leading-relaxed">
                        {financeReceiptTemplate
                          .replace(/{nome}/g, 'Mariana')
                          .replace(/{apelido}/g, 'Mari')
                          .replace(/{data}/g, new Date().toLocaleDateString('pt-BR'))
                          .replace(/{valor}/g, '250,00')
                          .replace(/{hora}/g, '15:00')
                          .replace(/{link_anexo}/g, 'https://elleven.app/...')}
                      </div>
                      <div className="absolute top-0 right-[-10px] w-0 h-0 border-[10px] border-transparent border-t-[#005c4b] border-l-[#005c4b]"></div>
                      <div className="text-[10px] md:text-xs text-[#e9edef]/70 text-right mt-2 flex justify-end items-center gap-1 font-sans">
                        Fin. Pagamento <span className="text-[#53bdeb] tracking-tighter ml-1">✓✓</span>
                      </div>
                    </div>
                  )}

                  {prepInstructionsEnabled && (
                    <div className="bg-[#005c4b] text-[#e9edef] p-3 md:p-4 rounded-xl rounded-tr-none self-end w-full sm:max-w-[80%] md:max-w-[70%] shadow-lg shadow-black/20 relative opacity-90 mt-4">
                      <div className="text-sm md:text-base whitespace-pre-wrap font-medium leading-relaxed">
                        {prepInstructionsTemplate
                          .replace(/{nome}/g, 'Mariana')
                          .replace(/{apelido}/g, 'Mari')
                          .replace(/{data}/g, new Date().toLocaleDateString('pt-BR'))
                          .replace(/{hora}/g, '15:00')
                          .replace(/{valor}/g, '250,00')
                          .replace(/{link_anexo}/g, 'https://elleven.app/...')}
                      </div>
                      <div className="mt-3 p-3 bg-slate-900/50 rounded-lg text-xs text-[#e9edef]/90 flex items-center gap-2 border border-slate-700/50">
                        <svg className="w-4 h-4 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                        <span className="truncate">orientacoes_primeira_consulta.pdf</span>
                      </div>
                      <div className="absolute top-0 right-[-10px] w-0 h-0 border-[10px] border-transparent border-t-[#005c4b] border-l-[#005c4b]"></div>
                      <div className="text-[10px] md:text-xs text-[#e9edef]/70 text-right mt-2 flex justify-end items-center gap-1 font-sans">
                        Instruções (1ª vez) <span className="text-[#53bdeb] tracking-tighter ml-1">✓✓</span>
                      </div>
                    </div>
                  )}

                  {profMorningResumeEnabled && (
                    <div className="bg-[#202c33] text-[#e9edef] p-3 md:p-4 rounded-xl rounded-tl-none self-start w-full sm:max-w-[80%] md:max-w-[70%] shadow-lg shadow-black/20 relative opacity-90 mt-4 border border-slate-700/50">
                      <div className="text-sm md:text-base whitespace-pre-wrap font-medium leading-relaxed">
                        Bom dia! Aqui está sua agenda de hoje ({new Date().toLocaleDateString('pt-BR')}):<br/><br/>
                        - 08:00 - João Silva (Avaliação)<br/>
                        - 09:30 - Mariana Souza (Tratamento)
                      </div>
                      <div className="absolute top-0 left-[-10px] w-0 h-0 border-[10px] border-transparent border-t-[#202c33] border-r-[#202c33]"></div>
                      <div className="text-[10px] md:text-xs text-[#e9edef]/70 text-right mt-2 flex justify-end items-center gap-1 font-sans">
                         Notificação Interna (Para Mim) <span className="text-[#53bdeb] tracking-tighter ml-1">✓✓</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-8 space-y-3">
                  <input
                    type="text"
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value)}
                    placeholder="Número para Teste (ex: 5511999999999)"
                    className="w-full bg-[#202c33] border border-[#2a3942] rounded-xl px-4 py-3 text-[#e9edef] focus:border-[#25D366]/50 focus:ring-2 focus:ring-[#25D366]/10 outline-none text-sm transition-all"
                  />
                  <Button
                    onClick={handleSimulateWpp}
                    disabled={isSimulatingWpp}
                    className="w-full bg-slate-800 hover:bg-[#25D366] text-white font-black uppercase tracking-widest transition-colors py-6 rounded-2xl text-xs md:text-sm shadow-xl"
                  >
                    {isSimulatingWpp ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
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

          <div className="max-w-xs space-y-3">
            <input
              type="email"
              value={testEmailAddress}
              onChange={(e) => setTestEmailAddress(e.target.value)}
              placeholder="Email para Teste"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-sky-500/50 focus:ring-2 focus:ring-sky-500/10 outline-none text-sm transition-all"
            />
            <Button
              onClick={handleSimulateEmail}
              disabled={isSimulatingEmail}
              className="w-full bg-slate-800 hover:bg-sky-500 text-white font-black uppercase tracking-widest transition-colors py-6 rounded-2xl text-xs md:text-sm shadow-xl"
            >
              {isSimulatingEmail ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
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

