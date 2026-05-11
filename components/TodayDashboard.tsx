"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { supabase } from '@/lib/supabase';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Activity, 
  TrendingDown, 
  CreditCard,
  ChevronRight,
  Brain,
  ListTodo,
  User,
  Zap,
  TrendingUp,
  AlertCircle,
  MoreVertical,
  Check,
  XSquare,
  FastForward,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MasterScoreEngine } from '@/lib/master-score-engine';
import { getLocalDateString } from '@/lib/utils';

interface TodayDashboardProps {
  onViewAthlete: (id: string) => void;
  onNavigate?: (view: any) => void;
}

export function TodayDashboard({ onViewAthlete, onNavigate }: TodayDashboardProps) {
  const [greeting, setGreeting] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [loading, setLoading] = useState(true);

  // Mocks / State for data
  const [agenda, setAgenda] = useState<any[]>([]);
  const [exceptions, setExceptions] = useState<any[]>([]);
  const [pendencies, setPendencies] = useState<any[]>([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [financialAlerts, setFinancialAlerts] = useState<any[]>([]);
  const [pendingWellnessCount, setPendingWellnessCount] = useState(0);
  const [radar, setRadar] = useState<any>({
    highRisk: 0,
    mediumRisk: 0,
    lowRisk: 0,
    assessmentsDone: 0,
    generalWellness: 0
  });
  const [intelligenceText, setIntelligenceText] = useState<React.ReactNode>('');

  const [selectedRadar, setSelectedRadar] = useState<'high' | 'medium' | 'low' | 'wellness' | 'assessments' | null>(null);
  const [radarAthletes, setRadarAthletes] = useState<any[]>([]);

  const handleQuickAction = async (eventId: string, action: 'encerrar' | 'pular' | 'excluir', athleteId?: string, athleteName?: string) => {
    try {
      // Remover o evento da agenda para "limpar" a fila
      await supabase.from('agenda_events').delete().eq('id', eventId);

      // Se for "encerrar", vamos dar um upsert num prontuário rápido
      if (action === 'encerrar' && athleteId) {
        await supabase.from('clinical_notes').insert([{
           athlete_id: athleteId,
           note_date: new Date().toISOString(),
           observations: "Atendimento expresso concluído via Dashboard. (Sem registro de sessão detalhada)"
        }]);
      } else if (action === 'pular' && athleteId) {
        await supabase.from('clinical_notes').insert([{
           athlete_id: athleteId,
           note_date: new Date().toISOString(),
           observations: "Atendimento marcado como 'Falta / Pulado' no Dashboard."
        }]);
      }

      setAgenda(prev => prev.filter(e => e.id !== eventId));
    } catch (err) {
      console.error("Erro ao modificar agenda:", err);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const today = getLocalDateString();
      
      const localNow = new Date();
      // Calculate local start and end of day in ISO string ensuring UTC offset handles it
      const startOfLocal = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate(), 0, 0, 0, 0).toISOString();
      const endOfLocal = new Date(localNow.getFullYear(), localNow.getMonth(), localNow.getDate(), 23, 59, 59, 999).toISOString();

      // 1. Fetch Agenda Events
      const { data: agendaData, error: agendaError } = await supabase
        .from('agenda_events')
        .select('*, athletes(id, name, risk_level)')
        .gte('start_time', startOfLocal)
        .lte('start_time', endOfLocal)
        .order('start_time');

      // 2. Fetch Wellness Records for today
      const { data: wellnessData, error: wellnessError } = await supabase
        .from('wellness_records')
        .select('*')
        .eq('record_date', today);

      // 3. Fetch All Athletes for stats and exceptions
      const { data: athletesData, error: athletesError } = await supabase
        .from('athletes')
        .select('id, name, risk_level, status, updated_at, modalidade, category');

      setRadarAthletes(athletesData || []);

      // Fetch Tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('daily_tasks')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (tasksData) {
        setPendencies(tasksData.map(t => ({ id: t.id, task: t.title, done: t.status === 'completed' })));
      }

      // 4. Fetch Clinical Alerts
      const { data: alertsData, error: alertsError } = await supabase
        .from('clinical_alerts')
        .select('*')
        .eq('status', 'active');

      // 5. Fetch Monthly assessments count (using the view)
      const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
      const { count: assessmentsCount } = await supabase
        .from('all_assessments')
        .select('*', { count: 'exact', head: true })
        .gte('assessment_date', firstDayOfMonth);

      // Fetch assessments for all athletes in agenda to calculate Master Score
      const agendaIds = agendaData?.map(e => e.athlete_id).filter(Boolean) || [];
      const { data: agendaAssessments } = agendaIds.length > 0 ? await supabase
        .from('all_assessments')
        .select('*')
        .in('athlete_id', agendaIds)
        .order('assessment_date', { ascending: false }) : { data: [] };

      // Process Agenda
      if (agendaData) {
        const mappedAgenda = agendaData.map(event => {
          const athlete = event.athletes;
          const wellness = wellnessData?.find(w => w.athlete_id === event.athlete_id);
          const athleteAlerts = alertsData?.filter(a => a.athlete_id === event.athlete_id && (a.severity === 'high' || a.severity === 'critical'));
          
          let dynamicAlertMessage = athleteAlerts?.[0]?.description || null;
          if (!dynamicAlertMessage && wellness) {
            const pain = Math.max(
              Number(wellness.muscle_soreness || 0),
              Number(wellness.pain || 0),
              Number(wellness.dor || 0),
              Number(wellness.pain_level || 0)
            );
            if (pain >= 7) {
              dynamicAlertMessage = `Alto nível de dor detectado: Nível ${pain}`;
            } else if (wellness.readiness_score < 70) {
              dynamicAlertMessage = `Baixa prontidão detectada: ${wellness.readiness_score}%`;
            }
          }

          const relevantAssessments = agendaAssessments?.filter(a => a.athlete_id === event.athlete_id) || [];
          
          const masterScore = MasterScoreEngine.calculate(
            {
              wellness: wellness,
              ears: { score: wellness?.readiness_score || 70 },
              assessments: relevantAssessments,
              wellnessRecords: wellness ? [wellness] : [],
              painHistory: [],
              tags: []
            },
            {
              sport: athlete?.sport || 'geral'
            }
          );

          return {
            id: event.id,
            time: format(new Date(event.start_time), 'HH:mm'),
            athlete_id: event.athlete_id,
            athlete_name: athlete?.name || 'Evento Geral',
            wellness_status: wellness ? (wellness.readiness_score >= 70 ? 'ok' : 'alert') : 'pending',
            risk: athlete?.risk_level === 'Crítico' || athlete?.risk_level === 'Alto' ? 'high' : (athlete?.risk_level === 'Médio' ? 'medium' : 'low'),
            alert: dynamicAlertMessage,
            suggestion: event.description || (wellness ? 'Acompanhar conforme respostas de wellness.' : 'Aguardando respostas de prontidão.'),
            masterScore
          };
        });
        setAgenda(mappedAgenda);
      }

      // Process Exceptions (High Risk athletes not in agenda)
      if (athletesData) {
        const agendaAthleteIds = new Set(agendaData?.map(e => e.athlete_id).filter(Boolean));
        const highRiskExceptions = athletesData
          .filter(a => (a.risk_level === 'Crítico' || a.risk_level === 'Alto') && !agendaAthleteIds.has(a.id))
          .map(a => ({
            id: a.id,
            name: a.name,
            reason: `Risco ${a.risk_level} sem atendimento agendado hoje.`,
            last_seen: a.updated_at ? format(new Date(a.updated_at), "d 'de' MMM", { locale: ptBR }) : 'N/A'
          }));
        setExceptions(highRiskExceptions);

        // Process Radar (Dynamically adjust if wellness implies higher risk)
        let highRiskCount = athletesData.filter(a => a.risk_level === 'Crítico' || a.risk_level === 'Alto').length;
        let mediumRiskCount = athletesData.filter(a => a.risk_level === 'Médio').length;
        
        // Dynamic patch for athletes who filled wellness before Risk Sync was implemented
        athletesData.forEach(a => {
          const w = wellnessData?.find(rec => rec.athlete_id === a.id);
          if (w && a.risk_level !== 'Crítico' && a.risk_level !== 'Alto') {
             const pain = Math.max(
              Number(w.muscle_soreness || 0),
              Number(w.pain || 0),
              Number(w.dor || 0),
              Number(w.pain_level || 0)
            );
            if (pain >= 8 || w.readiness_score <= 40) {
              a.risk_level = 'Crítico';
            } else if (pain >= 6 || w.readiness_score <= 60) {
              a.risk_level = 'Alto';
            } else if (a.risk_level !== 'Médio' && (pain >= 4 || w.readiness_score <= 75)) {
              a.risk_level = 'Médio';
            }
          }
        });
        
        // Recalculate after dynamic patch
        highRiskCount = athletesData.filter(a => a.risk_level === 'Crítico' || a.risk_level === 'Alto').length;
        mediumRiskCount = athletesData.filter(a => a.risk_level === 'Médio').length;
        const lowRiskCount = athletesData.filter(a => a.risk_level === 'Baixo' || !a.risk_level).length;

        const activeAthletes = athletesData.filter(a => a.status !== 'Inativo' && a.status !== 'Arquivado');
        const activeCount = activeAthletes.length;
        const wellnessAnsweredCount = wellnessData ? wellnessData.length : 0;
        setPendingWellnessCount(Math.max(0, activeCount - wellnessAnsweredCount));
        
        const adherencePct = activeCount > 0 ? Math.round((wellnessAnsweredCount / activeCount) * 100) : 0;

        setRadar({
          highRisk: highRiskCount,
          mediumRisk: mediumRiskCount,
          lowRisk: lowRiskCount,
          assessmentsDone: assessmentsCount || 0,
          generalWellness: adherencePct
        });
      }

      // 5. Fetch Financial Transactions (Pending incomes up to today)
      let financialAlertsData: any[] = [];
      try {
        const { data: finData, error: finError } = await supabase
          .from('financial_transactions')
          .select('id, description, amount, date')
          .eq('type', 'income')
          .eq('status', 'pending')
          .lte('date', today);
          
        if (finData) {
          financialAlertsData = finData.map(f => ({
            id: f.id,
            description: f.description || 'Mensalidade',
            amount: f.amount,
            date: f.date,
            urgency: 'high'
          }));
        }
      } catch (e) {
        console.log("No financial table yet");
      }
      setFinancialAlerts(financialAlertsData);

      // Intelligence Text
      if (wellnessData && wellnessData.length > 0) {
        const lowReadiness = wellnessData.filter(w => w.readiness_score < 60);
        if (lowReadiness.length > 0) {
          const athleteNamesNodes = lowReadiness.map((w, index) => {
            const a = athletesData?.find(ath => ath.id === w.athlete_id);
            return (
              <span key={w.athlete_id}>
                <button
                  onClick={() => onViewAthlete(w.athlete_id)}
                  className="mx-1 px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold hover:bg-indigo-500/40 transition-colors inline-flex items-center gap-1 leading-none"
                >
                  <User size={12} /> {a ? a.name : 'Atleta Desconhecido'}
                </button>
                {index < lowReadiness.length - 1 ? ', ' : ''}
              </span>
            );
          });

          setIntelligenceText(
            <span>
              <span className="font-bold text-white">{lowReadiness.length} atleta(s)</span> com baixa prontidão detectada hoje: 
              {athleteNamesNodes}. Recomenda-se ajuste de carga para preservar a integridade física do grupo.
            </span>
          );
        } else {
          setIntelligenceText('A prontidão média do grupo está saudável hoje. Protocolos de treinamento podem seguir conforme planejado.');
        }
      } else {
        setIntelligenceText('Aguardando coleta de dados de wellness para gerar insights de performance hoje.');
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Bom dia');
    else if (hour < 18) setGreeting('Boa tarde');
    else setGreeting('Boa noite');

    setCurrentDate(format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR }));

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh] text-slate-400">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
          <p className="text-sm uppercase tracking-widest font-black opacity-50">Carregando Dia...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* 1. Topo Hero Section */}
      <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 lg:p-8 relative overflow-hidden">
        <header className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight">
            {greeting},
          </h1>
          <p className="text-slate-400 font-medium mt-1 text-sm"><span className="uppercase">{currentDate}</span> • Visão Operacional do Dia</p>
        </header>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <button onClick={() => setSelectedRadar('high')} className="text-left bg-slate-950 p-5 rounded-2xl border border-slate-800/80 flex flex-col justify-between hover:border-slate-700 transition-all hover:scale-[1.02] active:scale-[0.98]">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] uppercase tracking-[0.2em] font-black text-rose-500">Crítico Hoje</span>
              <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
              </div>
            </div>
            <div>
              <p className="text-4xl font-black text-white leading-none tracking-tight">{radar.highRisk}</p>
              <p className="text-xs font-semibold text-slate-500 mt-2">atletas exigem ação</p>
            </div>
          </button>
          
          <button onClick={() => setSelectedRadar('medium')} className="text-left bg-slate-950 p-5 rounded-2xl border border-slate-800/80 flex flex-col justify-between hover:border-slate-700 transition-all hover:scale-[1.02] active:scale-[0.98]">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] uppercase tracking-[0.2em] font-black text-amber-500">Monitoramento</span>
              <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              </div>
            </div>
            <div>
              <p className="text-4xl font-black text-white leading-none tracking-tight">{radar.mediumRisk}</p>
              <p className="text-xs font-semibold text-slate-500 mt-2">atenção redobrada</p>
            </div>
          </button>
          
          <button onClick={() => setSelectedRadar('low')} className="text-left bg-slate-950 p-5 rounded-2xl border border-slate-800/80 flex flex-col justify-between hover:border-slate-700 transition-all hover:scale-[1.02] active:scale-[0.98]">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] uppercase tracking-[0.2em] font-black text-emerald-500">Liberados</span>
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </div>
            </div>
            <div>
              <p className="text-4xl font-black text-white leading-none tracking-tight">{radar.lowRisk}</p>
              <p className="text-xs font-semibold text-slate-500 mt-2">treinamento normal</p>
            </div>
          </button>
          
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80 flex flex-col justify-between hover:border-slate-700 transition-all">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] uppercase tracking-[0.2em] font-black text-indigo-400">Operacional</span>
              <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <ListTodo size={14} />
              </div>
            </div>
            <div>
              <p className="text-4xl font-black text-white leading-none tracking-tight">{pendencies.filter(p => !p.done).length}</p>
              <p className="text-xs font-semibold text-slate-500 mt-2">tarefas operacionais</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Agenda Inteligente */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
            <Clock size={18} className="text-cyan-500" />
            Agenda Hoje
          </h2>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                // To Do: trigger add event modal (you might want to expose it from layout or an agenda wrapper)
                // For now, let's navigate to the agenda view
                window.dispatchEvent(new CustomEvent('nav-to-agenda'));
              }}
              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors uppercase tracking-widest flex items-center gap-1 bg-cyan-500/10 border border-cyan-500/20 px-3 py-1.5 rounded-full"
            >
              + Adicionar
            </button>
            <span className="text-xs font-bold text-slate-500 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800">{agenda.length} agendamentos</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agenda.map((item, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-[#0A1120] border border-slate-800 rounded-2xl p-5 hover:border-slate-600 transition-all group flex flex-col relative"
            >
              {/* Quick Actions (Hover) */}
              <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button 
                   onClick={(e) => { e.stopPropagation(); handleQuickAction(item.id, 'encerrar', item.athlete_id, item.athlete_name); }}
                   title="Encerrar/Concluir Rápido"
                   className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 flex items-center justify-center transition-colors"
                 >
                   <Check size={14} />
                 </button>
                 <button 
                   onClick={(e) => { e.stopPropagation(); handleQuickAction(item.id, 'pular', item.athlete_id, item.athlete_name); }}
                   title="Falta / Pular"
                   className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 hover:text-amber-400 flex items-center justify-center transition-colors"
                 >
                   <FastForward size={14} />
                 </button>
                 <button 
                   onClick={(e) => { e.stopPropagation(); handleQuickAction(item.id, 'excluir'); }}
                   title="Excluir Agendamento"
                   className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 hover:text-rose-400 flex items-center justify-center transition-colors"
                 >
                   <Trash2 size={14} />
                 </button>
              </div>

              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col items-center justify-center shrink-0 shadow-inner">
                    <span className="text-white font-black text-sm">{item.time}</span>
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-base tracking-tight">{item.athlete_name}</h3>
                    <div className="flex items-center gap-2 mt-1 line-clamp-1">
                      {item.masterScore && (
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${item.masterScore.finalScore >= 80 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : item.masterScore.finalScore >= 60 ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'}`}>
                          MS: {item.masterScore.finalScore}%
                        </span>
                      )}
                      
                      {item.risk === 'low' && <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Estável</span>}
                      {item.risk === 'medium' && <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-md flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Atenção</span>}
                      {item.risk === 'high' && <span className="text-[10px] font-bold uppercase tracking-widest text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded-md flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span> Prioridade</span>}
                      
                      {item.wellness_status === 'pending' && <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 border border-slate-800 px-1.5 py-0.5 rounded-md flex items-center gap-1"><Clock size={10}/> s/ wellness</span>}
                    </div>
                  </div>
                </div>
              </div>

              {item.alert && (
                <div className="bg-rose-500/5 border border-rose-500/10 text-rose-300 p-3 rounded-xl text-xs font-medium mb-3 flex items-start gap-2">
                  <AlertCircle size={14} className="mt-0.5 shrink-0 text-rose-500" />
                  <p>{item.alert}</p>
                </div>
              )}

              {item.suggestion && (
                <div className="bg-cyan-500/5 border border-cyan-500/10 text-cyan-300 p-3 rounded-xl text-xs flex-1 mb-4 flex items-start gap-2 shadow-inner">
                  <Zap size={14} className="mt-0.5 shrink-0 text-cyan-500 drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
                  <p className="leading-relaxed">{item.suggestion}</p>
                </div>
              )}

              <button 
                onClick={() => onViewAthlete(item.athlete_id, true)}
                className="mt-auto w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 border border-slate-800 hover:border-slate-700 active:scale-[0.98]"
              >
                Atendimento Rápido <ChevronRight size={14} className="opacity-80" />
              </button>
            </motion.div>
          ))}
          {agenda.length === 0 && (
            <div className="col-span-full p-8 border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-500">
              <CalendarIcon size={32} className="mb-3 opacity-20" />
              <p>Nenhum atleta agendado para hoje.</p>
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lado Esquerdo (2 colunas em desktop) */}
        <div className="lg:col-span-2 space-y-8">
          {/* 6. Inteligência EARS */}
          <section className="bg-slate-950 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3">
              <Brain size={14} className="text-cyan-500" /> EAR/S Clinic Intelligence
            </h2>
            <p className="text-slate-200 text-[15px] leading-relaxed font-medium">
              {intelligenceText}
            </p>
          </section>

          {/* 3. Exceções Invisíveis */}
          <section className="space-y-4 pt-2">
            <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 px-1">
              <TrendingDown size={14} /> Atletas em Risco (Sem Agendamento)
            </h2>
            <div className="space-y-3">
              {exceptions.map((exc, idx) => (
                <div key={idx} className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl flex items-center justify-between hover:bg-slate-800/80 transition-colors cursor-pointer" onClick={() => onViewAthlete(exc.id)}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 shrink-0">
                      <User size={18} />
                    </div>
                    <div>
                      <h4 className="text-white font-bold">{exc.name}</h4>
                      <p className="text-xs text-rose-400 mt-0.5">{exc.reason}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <span className="text-[10px] font-bold text-slate-500 block uppercase">{exc.last_seen}</span>
                    <ChevronRight size={16} className="text-slate-600 inline-block mt-1" />
                  </div>
                </div>
              ))}
              {exceptions.length === 0 && (
                <p className="text-sm text-slate-500 px-2">Nenhum alerta crítico para atletas fora da agenda.</p>
              )}
            </div>
          </section>


        </div>

        {/* Radar Selection Modal (Conditional) */}
        {selectedRadar && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
                <h3 className="text-white font-black uppercase tracking-widest flex items-center gap-2">
                  <Activity size={18} className="text-cyan-500" />
                  {selectedRadar === 'high' ? 'Atletas Críticos (Alto Risco)' : 
                   selectedRadar === 'medium' ? 'Atletas em Monitoramento' : 
                   selectedRadar === 'low' ? 'Atletas Liberados' : 
                   selectedRadar === 'wellness' ? 'Adesão ao Wellness' : 
                   'Avaliações do Mês'}
                </h3>
                <button onClick={() => setSelectedRadar(null)} className="text-slate-500 hover:text-white transition-colors">
                  <AlertCircle size={24} />
                </button>
              </div>
              <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                <div className="space-y-2">
                  {radarAthletes
                    .filter(a => {
                      if (selectedRadar === 'high') return a.risk_level === 'Crítico' || a.risk_level === 'Alto';
                      if (selectedRadar === 'medium') return a.risk_level === 'Médio';
                      if (selectedRadar === 'low') return a.risk_level === 'Baixo' || !a.risk_level;
                      return true; // Show all for wellness/assessments for now, or could refine
                    })
                    .map(athlete => (
                      <div 
                        key={athlete.id} 
                        onClick={() => {
                          setSelectedRadar(null);
                          onViewAthlete(athlete.id);
                        }}
                        className="p-4 bg-slate-950/50 border border-slate-800 rounded-2xl flex items-center justify-between hover:border-cyan-500/30 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-slate-500 group-hover:text-cyan-400 transition-colors">
                            <User size={20} />
                          </div>
                          <div>
                            <h4 className="text-white font-bold">{athlete.name}</h4>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">{athlete.category} • {athlete.modalidade}</p>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                          athlete.risk_level === 'Crítico' || athlete.risk_level === 'Alto' ? 'bg-rose-500/10 text-rose-500' : 
                          athlete.risk_level === 'Médio' ? 'bg-amber-500/10 text-amber-500' : 
                          'bg-emerald-500/10 text-emerald-500'
                        }`}>
                          {athlete.risk_level || 'Baixo'}
                        </div>
                      </div>
                    ))}
                  {radarAthletes.filter(a => {
                    if (selectedRadar === 'high') return a.risk_level === 'Crítico' || a.risk_level === 'Alto';
                    if (selectedRadar === 'medium') return a.risk_level === 'Médio';
                    if (selectedRadar === 'low') return a.risk_level === 'Baixo' || !a.risk_level;
                    return true;
                  }).length === 0 && (
                    <div className="text-center py-8 text-slate-500 italic">Nenhum atleta encontrado nesta categoria.</div>
                  )}
                </div>
              </div>
              <div className="p-4 bg-slate-950/50 border-t border-slate-800">
                 <button 
                  onClick={() => setSelectedRadar(null)}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all"
                 >
                   Fechar
                 </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Lado Direito (Side column) */}
        <div className="space-y-8">
          {/* 4. Pendências Rápidas */}
          <section className="bg-slate-950 border border-slate-800 rounded-3xl p-6">
            <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-5">
              <ListTodo size={14} className="text-indigo-400" /> Operacional Diário
            </h2>
            <div className="space-y-3 mb-5">
              {pendencies.map((pend) => (
                <div key={pend.id} className="flex items-start gap-3">
                  <button 
                    onClick={async () => {
                      const newStatus = !pend.done;
                      setPendencies(pendencies.map(p => p.id === pend.id ? {...p, done: newStatus} : p));
                      await supabase.from('daily_tasks').update({ status: newStatus ? 'completed' : 'pending' }).eq('id', pend.id);
                    }}
                    className={`mt-0.5 w-4 h-4 rounded-md flex items-center justify-center shrink-0 border transition-colors ${pend.done ? 'bg-indigo-500 border-indigo-500 text-indigo-950' : 'bg-slate-900 border-slate-700 text-transparent hover:border-indigo-500/50'}`}
                  >
                    <CheckCircle2 size={10} className={pend.done ? 'opacity-100' : 'opacity-0'} />
                  </button>
                  <span className={`text-sm tracking-tight ${pend.done ? 'text-slate-600 line-through' : 'text-slate-200'}`}>
                    {pend.task}
                  </span>
                </div>
              ))}
              {pendencies.length === 0 && (
                <p className="text-xs text-slate-500">Nenhuma pendência operacional.</p>
              )}
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!newTaskText.trim()) return;
              try {
                const { data, error } = await supabase.from('daily_tasks').insert([{ title: newTaskText.trim() }]).select().single();
                if (data) {
                  setPendencies([{ id: data.id, task: data.title, done: false }, ...pendencies]);
                  setNewTaskText('');
                }
              } catch (err) {
                console.error("Error creating task:", err);
              }
            }} className="mt-4 flex gap-2">
              <input 
                type="text" 
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                placeholder="Nova tarefa..." 
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
              <button 
                type="submit" 
                disabled={!newTaskText.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all"
              >
                +
              </button>
            </form>
          </section>

          {/* 7. Financeiro Discreto */}
          <section className="bg-slate-950 border border-slate-800 rounded-3xl p-6 hover:border-slate-700 transition-colors group">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <CreditCard size={14} className="text-slate-600" /> Financeiro
              </h2>
              {financialAlerts.length > 0 && (
                <button 
                  onClick={() => onNavigate?.('finance')}
                  className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors flex items-center gap-1 bg-slate-800/50 hover:bg-slate-700/50 px-2.5 py-1 rounded-full"
                >
                  Ver Detalhes <ChevronRight size={12} />
                </button>
              )}
            </div>
            
            <div className="pt-2">
              {financialAlerts.length > 0 ? (
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 shadow-[0_0_5px_rgba(245,158,11,0.5)]"></div>
                  <p className="text-sm text-slate-300 font-medium">
                    {financialAlerts.length} mensalidade{financialAlerts.length !== 1 ? 's' : ''} em aberto
                  </p>
                </div>
              ) : (
                <p className="text-sm text-slate-500">Tudo em dia com o financeiro.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
