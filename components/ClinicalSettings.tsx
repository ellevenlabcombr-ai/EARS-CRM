"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Activity, 
  AlertTriangle, 
  MessageSquare, 
  CheckCircle, 
  Loader2, 
  AlertCircle,
  HeartPulse,
  Lock,
  Bell,
  CalendarClock,
  FileCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ClinicalSettings() {
  // Critical Thresholds
  const [criticalReadiness, setCriticalReadiness] = useState(50);
  const [criticalPain, setCriticalPain] = useState(7);

  // Attention Range
  const [attentionReadinessMin, setAttentionReadinessMin] = useState(50);
  const [attentionReadinessMax, setAttentionReadinessMax] = useState(75);
  const [attentionPainMin, setAttentionPainMin] = useState(4);
  const [attentionPainMax, setAttentionPainMax] = useState(6);

  // Messages
  const [riskMessage, setRiskMessage] = useState('Atleta em risco crítico. Avaliação médica e fisioterapêutica imediata necessária.');
  const [attentionMessage, setAttentionMessage] = useState('Atleta em estado de atenção. Monitorar carga de treino e recuperação.');

  // Safety Locks
  const [blockSchedulingOnCritical, setBlockSchedulingOnCritical] = useState(false);
  const [requireClearanceMedical, setRequireClearanceMedical] = useState(false);
  const [requireWaiverOnPainLevel, setRequireWaiverOnPainLevel] = useState(0);

  // Alert Routing
  const [notifyPhysioOnCritical, setNotifyPhysioOnCritical] = useState(false);

  // Recall Clínico
  const [alertAbandonDays, setAlertAbandonDays] = useState(0);
  const [inactiveAfterDays, setInactiveAfterDays] = useState(0);

  // Compliance de Prontuário
  const [requireEvolutionHours, setRequireEvolutionHours] = useState(0);
  const [blockFinanceWithoutEvolution, setBlockFinanceWithoutEvolution] = useState(false);
  
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
        .from('clinical_settings')
        .select('*')
        .maybeSingle();
      
      if (error) {
        console.error("CLINICAL SETTINGS FETCH ERROR:", {
          message: error?.message,
          code: error?.code,
          details: error?.details,
          hint: error?.hint,
          full: error
        });

        const isTableMissing = error.message?.includes('relation "clinical_settings" does not exist') || 
                               error.message?.includes('schema cache') ||
                               error.details?.includes('schema cache');

        if (isTableMissing) {
          console.warn('Clinical settings table not found. Please run the database seeder.');
          setStatus('error');
          setMessage('A tabela "clinical_settings" não foi encontrada. Por favor, vá em Configurações > Desenvolvimento e clique em "Otimizar Banco (Auto-Fix)".');
          return; // Exit early, use default state
        } else {
          throw error;
        }
      }
      
      if (data) {
        setCriticalReadiness(data.critical_readiness_threshold ?? 50);
        setCriticalPain(data.critical_pain_threshold ?? 7);
        setAttentionReadinessMin(data.attention_readiness_min ?? 50);
        setAttentionReadinessMax(data.attention_readiness_max ?? 75);
        setAttentionPainMin(data.attention_pain_min ?? 4);
        setAttentionPainMax(data.attention_pain_max ?? 6);
        setRiskMessage(data.risk_message || 'Atleta em risco crítico. Avaliação médica e fisioterapêutica imediata necessária.');
        setAttentionMessage(data.attention_message || 'Atleta em estado de atenção. Monitorar carga de treino e recuperação.');
        setBlockSchedulingOnCritical(data.block_scheduling_on_critical ?? false);
        setRequireClearanceMedical(data.require_clearance_medical ?? false);
        setRequireWaiverOnPainLevel(data.require_waiver_on_pain_level ?? 0);
        setNotifyPhysioOnCritical(data.notify_physio_on_critical ?? false);
        setAlertAbandonDays(data.alert_abandon_days ?? 0);
        setInactiveAfterDays(data.inactive_after_days ?? 0);
        setRequireEvolutionHours(data.require_evolution_hours ?? 0);
        setBlockFinanceWithoutEvolution(data.block_finance_without_evolution ?? false);
      }
    } catch (err: any) {
      console.error("CLINICAL SETTINGS CATCH ERROR:", {
        message: err?.message,
        code: err?.code,
        details: err?.details,
        hint: err?.hint,
        full: err
      });
      setStatus('error');
      setMessage(`Erro ao carregar: ${err.message || 'Erro desconhecido'}`);
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
        .from('clinical_settings')
        .select('id')
        .maybeSingle();

      if (selectError) {
        console.error("CLINICAL SETTINGS SAVE SELECT ERROR:", {
          message: selectError?.message,
          code: selectError?.code,
          details: selectError?.details,
          hint: selectError?.hint,
          full: selectError
        });

        const isTableMissing = selectError.message?.includes('relation "clinical_settings" does not exist') || 
                               selectError.message?.includes('schema cache') ||
                               selectError.details?.includes('schema cache');

        if (isTableMissing) {
          throw new Error('A tabela "clinical_settings" não foi encontrada. Por favor, vá em Configurações > Desenvolvimento e clique em "Otimizar Banco (Auto-Fix)".');
        }
        throw selectError;
      }

      const payload = {
        critical_readiness_threshold: criticalReadiness,
        critical_pain_threshold: criticalPain,
        attention_readiness_min: attentionReadinessMin,
        attention_readiness_max: attentionReadinessMax,
        attention_pain_min: attentionPainMin,
        attention_pain_max: attentionPainMax,
        risk_message: riskMessage,
        attention_message: attentionMessage,
        block_scheduling_on_critical: blockSchedulingOnCritical,
        require_clearance_medical: requireClearanceMedical,
        require_waiver_on_pain_level: requireWaiverOnPainLevel,
        notify_physio_on_critical: notifyPhysioOnCritical,
        alert_abandon_days: alertAbandonDays,
        inactive_after_days: inactiveAfterDays,
        require_evolution_hours: requireEvolutionHours,
        block_finance_without_evolution: blockFinanceWithoutEvolution,
        updated_at: new Date().toISOString()
      };

      let error;
      if (existing) {
        const { error: updateError } = await supabase
          .from('clinical_settings')
          .update(payload)
          .eq('id', existing.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('clinical_settings')
          .insert([payload]);
        error = insertError;
      }

      if (error) {
        console.error("CLINICAL SETTINGS SAVE OPERATION ERROR:", {
          message: error?.message,
          code: error?.code,
          details: error?.details,
          hint: error?.hint,
          full: error
        });
        throw error;
      }

      setStatus('success');
      setMessage('Regras clínicas salvas com sucesso!');
    } catch (err: any) {
      console.error("CLINICAL SETTINGS SAVE CATCH ERROR:", {
        message: err?.message,
        code: err?.code,
        details: err?.details,
        hint: err?.hint,
        full: err
      });
      setStatus('error');
      const errorMessage = err.message || (typeof err === 'object' ? JSON.stringify(err) : String(err));
      setMessage(`Erro ao salvar: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-12 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Carregando regras clínicas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 pb-10">
      {/* HEADER AND MANUAL BANNER */}
      <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-rose-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-700 ease-out" />
        <div className="relative z-10 flex-1">
          <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <Activity className="text-rose-500" size={28} /> Regras Clínicas e Alertas
          </h2>
          <p className="text-xs md:text-sm text-slate-400 mt-2 font-medium leading-relaxed max-w-2xl">
            Configure os parâmetros automáticos do motor de inteligência. O sistema usará esses limites para classificar o nível de risco de cada paciente e recomendar ações imediatas na triagem.
          </p>
        </div>
        <div className="relative z-10 shrink-0">
          <button
             onClick={() => {
               const newWindow = window.open('', '_blank');
               if (newWindow) {
                 newWindow.document.write(`
                  <html>
                  <head>
                    <title>Manual de Regras Clínicas</title>
                    <style>
                      body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #e2e8f0; line-height: 1.6; padding: 2rem; max-w: 800px; margin: 0 auto; }
                      h1 { color: #fff; font-size: 2rem; border-bottom: 2px solid #334155; padding-bottom: 1rem; margin-bottom: 2rem; }
                      h2 { color: #f43f5e; margin-top: 2.5rem; border-bottom: 1px dashed #334155; padding-bottom: 0.5rem; }
                      p, li { color: #94a3b8; }
                      strong { color: #e2e8f0; }
                    </style>
                  </head>
                  <body>
                    <h1>Manual do Motor de Regras</h1>

                    <h2>1. Limites Críticos (Risco Alto)</h2>
                    <p><b>O que é:</b> São os limiares onde o sistema dispara o alerta vermelho. Se a prontidão cair abaixo do valor configurado ou a dor ficar acima da taxa estipulada, o sistema marca o acompanhamento como urgente.</p>
                    <p>Dica: O padrão recomendado para esportistas e atletas costuma ser Dor >= 7 e Prontidão < 50%.</p>

                    <h2>2. Faixa de Atenção (Alerta Leve)</h2>
                    <p><b>O que é:</b> Um limite intermediário que categoriza o alerta amarelo de atenção.</p>
                    <p>Como funciona: É usado para identificar casos em que há risco potencial, servindo de 'esteira de triagem' para evitar que as dores virem lesões críticas.</p>
                    
                    <h2>3. Mensagens Padrão Automáticas</h2>
                    <p><b>O que é:</b> Textos que são automaticamente sugeridos nas avaliações e no prontuário do paciente quando um alerta é disparado pelas faixas acima. Padroniza e agiliza a comunicação da equipe.</p>
                    
                    <h2>4. Bloqueios Preventivos e de Segurança (Safety Locks)</h2>
                    <p><b>O que é:</b> Travas operacionais para segurança clínica.</p>
                    <p><b>Travar Agendamentos e Treinos:</b> Impede a recepção/técnicos de marcarem novos treinos ou check-ins na academia se o atleta estiver na faixa de Risco Crítico, até que um Fisioterapeuta ou Médico clique em "Aprovar Liberação (Clearance)".</p>
                    <p><b>Assinatura de Termos:</b> Dispara a exigência de um "Termo de Responsabilidade" automático se o paciente assinalar dor acima de X, mas insistir em treinar.</p>
                    
                    <h2>5. Gatilhos de Notificações Internas (Alert Routing)</h2>
                    <p><b>O que é:</b> Avisos cruzados para a equipe. Ex: Enviar notificação imediata para o Fisioterapeuta Chefe e Preparador Físico se um atleta entrar em risco crítico.</p>
                    
                    <h2>6. Automação de Retorno e Acompanhamento (Recall Clínico)</h2>
                    <p><b>O que é:</b> Prevenção de abandono (Follow-up) e manutenção de status. Alerta quando um paciente em tratamento agudo passar mais de "X" dias sem agendar retorno, ou inativa pacientes após um tempo ocioso.</p>
                    
                    <h2>7. Rigor de Evolução Obrigatória (Compliance de Prontuário)</h2>
                    <p><b>O que é:</b> Travas para os profissionais de saúde não esquecerem os protocolos e atualizações. Define um tempo limite para criar a evolução ou bloqueia o repasse financeiro de sessões não evoluídas.</p>
                    
                    <hr style="margin-top: 3rem; border-color: #334155;" />
                    <p style="text-align: center; font-size: 0.8rem; margin-top: 2rem;">Pode fechar esta janela para retornar ao sistema.</p>
                  </body>
                  </html>
                 `);
               }
             }}
             className="px-6 py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <AlertCircle size={18} />
            Ler Manual
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        
        {/* Limites Críticos */}
        <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl space-y-6">
          <div className="flex items-center gap-3 md:gap-4 mb-2">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-rose-500/10 text-rose-500 rounded-xl md:rounded-2xl flex items-center justify-center">
              <HeartPulse className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-black text-white uppercase tracking-tight">Limites Críticos</h3>
              <p className="text-[10px] md:text-xs text-slate-500 font-medium">Define estado de risco</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Prontidão menor que</label>
              <div className="relative">
                <input 
                  type="number" 
                  value={criticalReadiness}
                  onChange={(e) => setCriticalReadiness(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-rose-500/50 focus:ring-2 focus:ring-rose-500/10 outline-none transition-all text-sm md:text-base font-medium"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] md:text-xs font-black text-slate-600">%</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Dor maior ou igual a</label>
              <input 
                type="number" 
                value={criticalPain}
                onChange={(e) => setCriticalPain(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-rose-500/50 focus:ring-2 focus:ring-rose-500/10 outline-none transition-all text-sm md:text-base font-medium"
                min="0"
                max="10"
              />
            </div>
          </div>
        </div>

        {/* Faixa de Atenção */}
        <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl space-y-6">
          <div className="flex items-center gap-3 md:gap-4 mb-2">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-500/10 text-amber-500 rounded-xl md:rounded-2xl flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-black text-white uppercase tracking-tight">Faixa de Atenção</h3>
              <p className="text-[10px] md:text-xs text-slate-500 font-medium">Define estado de alerta leve</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Prontidão</label>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  value={attentionReadinessMin}
                  onChange={(e) => setAttentionReadinessMin(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-3 text-white focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 outline-none transition-all text-center text-sm md:text-base font-medium"
                />
                <span className="text-slate-600 font-bold">-</span>
                <input 
                  type="number" 
                  value={attentionReadinessMax}
                  onChange={(e) => setAttentionReadinessMax(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-3 text-white focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 outline-none transition-all text-center text-sm md:text-base font-medium"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Dor</label>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  value={attentionPainMin}
                  onChange={(e) => setAttentionPainMin(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-3 text-white focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 outline-none transition-all text-center text-sm md:text-base font-medium"
                  min="0" max="10"
                />
                <span className="text-slate-600 font-bold">-</span>
                <input 
                  type="number" 
                  value={attentionPainMax}
                  onChange={(e) => setAttentionPainMax(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-3 text-white focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 outline-none transition-all text-center text-sm md:text-base font-medium"
                  min="0" max="10"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mensagens Padrão */}
      <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl space-y-6">
        <div className="flex items-center gap-3 md:gap-4 mb-2">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-cyan-500/10 text-cyan-400 rounded-xl md:rounded-2xl flex items-center justify-center">
            <MessageSquare className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <h3 className="text-sm md:text-base font-black text-white uppercase tracking-tight">Mensagens Padrão</h3>
            <p className="text-[10px] md:text-xs text-slate-500 font-medium">Textos automáticos na avaliação</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] md:text-xs font-black text-rose-400 uppercase tracking-widest pl-1">Mensagem de Risco</label>
            <textarea 
              value={riskMessage}
              onChange={(e) => setRiskMessage(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-rose-500/50 focus:ring-2 focus:ring-rose-500/10 outline-none transition-all resize-none h-24 text-sm md:text-base font-medium placeholder:text-slate-600"
              placeholder="Ex: Atleta em risco crítico..."
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] md:text-xs font-black text-amber-400 uppercase tracking-widest pl-1">Mensagem de Atenção</label>
            <textarea 
              value={attentionMessage}
              onChange={(e) => setAttentionMessage(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 outline-none transition-all resize-none h-24 text-sm md:text-base font-medium placeholder:text-slate-600"
              placeholder="Ex: Atleta em estado de atenção..."
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        {/* Bloqueios Preventivos e de Segurança */}
        <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl space-y-6">
          <div className="flex items-center gap-3 md:gap-4 mb-2 border-b border-slate-800/50 pb-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-red-500/10 text-red-500 rounded-xl md:rounded-2xl flex items-center justify-center">
              <Lock className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-black text-white uppercase tracking-tight">Bloqueios Preventivos</h3>
              <p className="text-[10px] md:text-xs text-slate-500 font-medium">Safety locks em agendamentos</p>
            </div>
          </div>
          <div className="space-y-6">
            <label className="flex items-start gap-4 cursor-pointer group">
              <div className="relative flex items-start">
                <input 
                  type="checkbox" 
                  checked={blockSchedulingOnCritical}
                  onChange={(e) => setBlockSchedulingOnCritical(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="w-5 h-5 md:w-6 md:h-6 border-2 border-slate-700 rounded bg-slate-950 peer-checked:bg-red-500 peer-checked:border-red-500 transition-colors flex items-center justify-center mt-0.5">
                  <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-xs md:text-sm font-bold text-white uppercase tracking-widest group-hover:text-red-400 transition-colors">
                  Travar Agendamentos e Treinos (Risco Crítico)
                </p>
                <p className="text-[10px] md:text-xs text-slate-400 mt-1">Impede check-in na clínica até aprovação ('Clearance')</p>
              </div>
            </label>

            <label className="flex items-start gap-4 cursor-pointer group">
              <div className="relative flex items-start">
                <input 
                  type="checkbox" 
                  checked={requireClearanceMedical}
                  onChange={(e) => setRequireClearanceMedical(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="w-5 h-5 md:w-6 md:h-6 border-2 border-slate-700 rounded bg-slate-950 peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-colors flex items-center justify-center mt-0.5">
                  <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-xs md:text-sm font-bold text-white uppercase tracking-widest group-hover:text-emerald-400 transition-colors">
                  Exigir Aprovação Médica (Clearance)
                </p>
                <p className="text-[10px] md:text-xs text-slate-400 mt-1">Requer 'Approval' de Especialista para destravar</p>
              </div>
            </label>

            <div className="space-y-2">
              <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Exigir Termo de Responsabilidade se Dor {'>='}</label>
              <input 
                type="number" 
                value={requireWaiverOnPainLevel}
                onChange={(e) => setRequireWaiverOnPainLevel(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-red-500/50 focus:ring-2 focus:ring-red-500/10 outline-none transition-all text-sm md:text-base font-medium"
                min="0" max="10"
              />
            </div>
          </div>
        </div>

        {/* Gatilhos de Notificações Internas */}
        <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl space-y-6">
          <div className="flex items-center gap-3 md:gap-4 mb-2 border-b border-slate-800/50 pb-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-500/10 text-orange-500 rounded-xl md:rounded-2xl flex items-center justify-center">
              <Bell className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-black text-white uppercase tracking-tight">Notificações da Equipe</h3>
              <p className="text-[10px] md:text-xs text-slate-500 font-medium">Alert Routing (Equipe)</p>
            </div>
          </div>
          <div className="space-y-6">
            <label className="flex items-start gap-4 cursor-pointer group">
              <div className="relative flex items-start">
                <input 
                  type="checkbox" 
                  checked={notifyPhysioOnCritical}
                  onChange={(e) => setNotifyPhysioOnCritical(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="w-5 h-5 md:w-6 md:h-6 border-2 border-slate-700 rounded bg-slate-950 peer-checked:bg-orange-500 peer-checked:border-orange-500 transition-colors flex items-center justify-center mt-0.5">
                  <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-xs md:text-sm font-bold text-white uppercase tracking-widest group-hover:text-orange-400 transition-colors">
                  Avisos Cruzados Imediatos
                </p>
                <p className="text-[10px] md:text-xs text-slate-400 mt-1">Notificar Fisioterapeuta e Preparador Físico se paciente atingir risco crítico</p>
              </div>
            </label>
          </div>
        </div>

        {/* Automação de Retorno e Acompanhamento */}
        <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl space-y-6">
          <div className="flex items-center gap-3 md:gap-4 mb-2 border-b border-slate-800/50 pb-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-500/10 text-blue-500 rounded-xl md:rounded-2xl flex items-center justify-center">
              <CalendarClock className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-black text-white uppercase tracking-tight">Acompanhamento (Recall)</h3>
              <p className="text-[10px] md:text-xs text-slate-500 font-medium">Ciclo de vida do tratamento</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Alerta Abandono (Dias sem volta)</label>
              <input 
                type="number" 
                value={alertAbandonDays}
                onChange={(e) => setAlertAbandonDays(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all text-sm md:text-base font-medium"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Inativo Auto (Dias sem atividade)</label>
              <input 
                type="number" 
                value={inactiveAfterDays}
                onChange={(e) => setInactiveAfterDays(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 outline-none transition-all text-sm md:text-base font-medium"
              />
            </div>
          </div>
        </div>

        {/* Rigor de Evolução Obrigatória */}
        <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl space-y-6">
          <div className="flex items-center gap-3 md:gap-4 mb-2 border-b border-slate-800/50 pb-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-500/10 text-purple-500 rounded-xl md:rounded-2xl flex items-center justify-center">
              <FileCheck className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-black text-white uppercase tracking-tight">Compliance de Prontuário</h3>
              <p className="text-[10px] md:text-xs text-slate-500 font-medium">Cobrança e rigor clínico</p>
            </div>
          </div>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Tempo Limite para Evolução (Horas)</label>
              <input 
                type="number" 
                value={requireEvolutionHours}
                onChange={(e) => setRequireEvolutionHours(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/10 outline-none transition-all text-sm md:text-base font-medium"
                placeholder="Ex: 24 (horas após a Consulta)"
              />
            </div>
            
            <label className="flex items-start gap-4 cursor-pointer group">
              <div className="relative flex items-start">
                <input 
                  type="checkbox" 
                  checked={blockFinanceWithoutEvolution}
                  onChange={(e) => setBlockFinanceWithoutEvolution(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="w-5 h-5 md:w-6 md:h-6 border-2 border-slate-700 rounded bg-slate-950 peer-checked:bg-purple-500 peer-checked:border-purple-500 transition-colors flex items-center justify-center mt-0.5">
                  <CheckCircle className="w-3 h-3 md:w-4 md:h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-xs md:text-sm font-bold text-white uppercase tracking-widest group-hover:text-purple-400 transition-colors">
                  Travar Fechamento Financeiro
                </p>
                <p className="text-[10px] md:text-xs text-slate-400 mt-1">Impedir cobrança e repasse de sessão ou diária caso a evolução clínica não tenha sido preenchida</p>
              </div>
            </label>
          </div>
        </div>
      </div>

      <div className="pt-6 md:pt-8 border-t border-slate-800/50 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex-1 w-full">
          {status !== 'idle' && (
            <div className={`p-4 rounded-xl border flex items-center gap-3 ${
              status === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}>
              {status === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
              <span className="text-[10px] md:text-xs font-black uppercase tracking-wider">{message}</span>
            </div>
          )}
        </div>

        <Button 
          onClick={handleSave}
          disabled={isSaving}
          className="w-full md:w-auto bg-rose-500 hover:bg-rose-400 text-white font-black uppercase tracking-widest px-8 md:px-10 py-5 md:py-6 rounded-xl md:rounded-2xl shadow-lg shadow-rose-500/20 transition-all active:scale-95 text-xs md:text-sm"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Salvando...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              Salvar Regras
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
