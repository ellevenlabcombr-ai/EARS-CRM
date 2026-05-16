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
                      body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #e2e8f0; line-height: 1.6; padding: 2rem; max-w: 900px; margin: 0 auto; }
                      h1 { color: #fff; font-size: 2rem; border-bottom: 2px solid #334155; padding-bottom: 1rem; margin-bottom: 2rem; }
                      h2 { color: #f43f5e; margin-top: 2.5rem; border-bottom: 1px dashed #334155; padding-bottom: 0.5rem; }
                      h3 { color: #cbd5e1; margin-top: 1.5rem; }
                      p, li { color: #94a3b8; }
                      strong { color: #e2e8f0; }
                      .highlight { background: #1e293b; padding: 1rem; border-left: 4px solid #f43f5e; border-radius: 4px; margin: 1rem 0; }
                    </style>
                  </head>
                  <body>
                    <h1>Manual do Motor de Regras Clínicas</h1>
                    <p>O Motor de Regras é o cérebro clínico do sistema. Ele avalia automaticamente os dados dos pacientes (como índices de dor e recuperação) e dispara ações de segurança baseadas nos protocolos que você definir aqui. Este guia mostrará como configurar cada trava operacional.</p>

                    <h2>1. Limites Críticos (Risco Alto)</h2>
                    <div class="highlight">
                      <strong>Objetivo:</strong> Identificar atletas com grande risco de lesão aguda para intervir imediatamente.
                    </div>
                    <p>Aqui você define os "Limiares de Alerta Vermelho".</p>
                    <ul>
                      <li><strong>Prontidão menor que (%):</strong> O questionário wellness gera uma nota de prontidão. Se o atleta pontuar abaixo deste valor (ex: menor que 50%), ele entra em alerta vermelho.</li>
                      <li><strong>Dor maior ou igual a:</strong> Na escala de dor de 0 a 10. Se ele relatar uma dor que iguale ou ultrapasse este limite (ex: dor 7), também entra no estado crítico.</li>
                    </ul>
                    <p><em>Exemplo Prático:</em> Digite "50" na prontidão e "7" na dor. Qualquer atleta que chegar na academia com dor 7 ou mais, ou super fadigado, fará o sistema apitar.</p>

                    <h2>2. Faixa de Atenção (Alerta Leve)</h2>
                    <div class="highlight">
                      <strong>Objetivo:</strong> Monitorar atletas que precisam de cuidados preventivos antes que a dor piore.
                    </div>
                    <p>É a famosa "Luz Amarela". Você cria uma janela de valores.</p>
                    <ul>
                      <li><strong>Prontidão (Mín. e Máx.):</strong> Ex: Entre 51% e 75%. O atleta não está crítico, mas também não está 100%.</li>
                      <li><strong>Dor (Mín. e Máx.):</strong> Ex: Dor entre 4 e 6. O atleta relata um incômodo, precisa de atenção do preparador, mas não impede o treino leve.</li>
                    </ul>

                    <h2>3. Mensagens Padrão Automáticas</h2>
                    <div class="highlight">
                      <strong>Objetivo:</strong> Padronizar os recados que aparecem na tela dos profissionais.
                    </div>
                    <p>Quando o sistema identificar que o atleta caiu no Alerta Vermelho ou Amarelo estipulado acima, ele colará esses textos automaticamente no perfil do paciente e nos cards de agendamento do dia.</p>
                    <ul>
                      <li><strong>Mensagem de Risco:</strong> Digite um texto urgente. <em>Ex: "ATENÇÃO: Avaliação médica mandatória antes de qualquer esforço."</em></li>
                      <li><strong>Mensagem de Atenção:</strong> Digite um texto de alerta. <em>Ex: "Cuidado com cargas máximas hoje. Verifique a queixa de dor."</em></li>
                    </ul>
                    
                    <h2>4. Bloqueios Preventivos e de Segurança (Safety Locks)</h2>
                    <div class="highlight">
                      <strong>Objetivo:</strong> Impedir fisicamente as rotinas se a segurança for violada.
                    </div>
                    <p>Estas chaves funcionam junto com o <strong>Limite Crítico</strong> que você configurou no Passo 1.</p>
                    <ul>
                      <li><strong>Travar Agendamentos e Treinos (Risco Crítico):</strong> Se marcado, a recepção e os técnicos perdem o botão de dar "Check-in" ou agendar treinos se o paciente estiver vermelho. A tela fica bloqueada.</li>
                      <li><strong>Exigir Aprovação Médica (Clearance):</strong> Se o bloqueio acima atracar as telas, ao ligar esta chave você exige que a única maneira de destravar o paciente para treinar é se um usuário com perfil "Médico/Fisio" clicar no botão de "Aprovar Liberação" digitando a sua senha.</li>
                      <li><strong>Exigir Termo de Responsabilidade se Dor >=:</strong> Indique uma nota de dor (ex: 8). Se o paciente tentar treinar com dor alta e sem o Clearance, o sistema enviará um PDF/Termo para o App dele assinar atestando que está treinando por conta e risco, contra o aviso médico.</li>
                    </ul>
                    
                    <h2>5. Gatilhos de Notificações Internas (Alert Routing)</h2>
                    <div class="highlight">
                      <strong>Objetivo:</strong> Fazer as fofocas clínicas chegarem nas pessoas certas instantaneamente.
                    </div>
                    <p>Se você assinalar a chave <strong>Avisos Cruzados Imediatos</strong>, assim que o paciente finalizar o questionário no celular dele relatando um nível de dor que o coloque em "Risco", o sistema manda, na mesma hora, no e-mail ou no painel do Preparador Físico Chefe e do Fisioterapeuta que o atleta está quebrado. Assim eles podem alterar os treinos antes do atleta chegar no clube.</p>
                    
                    <h2>6. Automação de Retorno e Acompanhamento (Recall Clínico)</h2>
                    <div class="highlight">
                      <strong>Objetivo:</strong> Gestão automática de evasão e abstenção de pacientes.
                    </div>
                    <p>Como garantir que o paciente não parou o tratamento pela metade?</p>
                    <ul>
                      <li><strong>Alerta Abandono (Dias sem volta):</strong> Coloque um prazo, ex: 15 dias. Se um paciente com lesão ativa passar 15 dias sem agendar nada, seu nome piscará na aba "Abandonos" pro time ligar para ele.</li>
                      <li><strong>Inativo Auto (Dias sem atividade):</strong> Se você não quer arquivar pacientes à mão. Digite ex: 90 dias. Se em 90 dias ele não preencher questionários nem for atendido, seu status vai para "Inativo" e o chat dele é fechado.</li>
                    </ul>
                    
                    <h2>7. Rigor de Evolução Obrigatória (Compliance de Prontuário)</h2>
                    <div class="highlight">
                      <strong>Objetivo:</strong> Forçar a equipe de saúde a preencher os prontuários no prazo, vinculando isso ao dinheiro.
                    </div>
                    <p>Para clínicas que lutam com evoluções atrasadas.</p>
                    <ul>
                      <li><strong>Tempo Limite para Evolução:</strong> Defina quantas horas os profissionais têm para escrever no prontuário após a consulta. O CRM do Conselho Federal costuma pedir que os prontuários sejam diários. Se preencher "24", o profissional ganha uma pendência vermelha se passar desse prazo.</li>
                      <li><strong>Travar Fechamento Financeiro:</strong> A ferramenta final de cobrança. Se ativada, a equipe financeira não consegue gerar boletos, emitir nota ou repassar a comissão da sessão para o profissional SE ele não tiver finalizado a Evolução daquele atendimento. <em>Fez a evolução = O Dinheiro é liberado. Não fez = Sessão congelada.</em></li>
                    </ul>
                    
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
