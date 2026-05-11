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
  AlertCircle
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
  const [financialAlerts, setFinancialAlerts] = useState<any[]>([]);
  const [radar, setRadar] = useState<any>({
    highRisk: 0,
    mediumRisk: 0,
    assessmentsDone: 0,
    generalWellness: 0
  });
  const [intelligenceText, setIntelligenceText] = useState('');

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
        .select('id, name, risk_level, status, updated_at');

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
          const athleteAlerts = alertsData?.filter(a => a.athlete_id === event.athlete_id && a.severity === 'high');
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
            alert: athleteAlerts?.[0]?.description || (wellness && wellness.readiness_score < 70 ? `Baixa prontidão detectada: ${wellness.readiness_score}%` : null),
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

        // Process Radar
        const highRiskCount = athletesData.filter(a => a.risk_level === 'Crítico' || a.risk_level === 'Alto').length;
        const mediumRiskCount = athletesData.filter(a => a.risk_level === 'Médio').length;
        const avgWellness = wellnessData && wellnessData.length > 0
          ? Math.round(wellnessData.reduce((acc, w) => acc + (Number(w.readiness_score) || 0), 0) / wellnessData.length)
          : 0;

        setRadar({
          highRisk: highRiskCount,
          mediumRisk: mediumRiskCount,
          assessmentsDone: assessmentsCount || 0,
          generalWellness: avgWellness
        });
      }

      // Financial Mocks (still mocked as no table exists)
      setFinancialAlerts([
        { id: 1, description: 'Mensalidades pendentes', urgency: 'medium' }
      ]);

      // Intelligence Text
      if (wellnessData && wellnessData.length > 0) {
        const lowReadiness = wellnessData.filter(w => w.readiness_score < 60);
        if (lowReadiness.length > 0) {
          setIntelligenceText(`${lowReadiness.length} atleta(s) com baixa prontidão detectada hoje. Recomenda-se ajuste de carga para preservar a integridade física do grupo.`);
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
    <div className="space-y-6 lg:space-y-8 pb-10">
      {/* 1. Topo */}
      <section className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 lg:p-8 backdrop-blur-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 blur-[80px] rounded-full pointer-events-none" />
        
        <header className="mb-6">
          <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight">
            {greeting},
          </h1>
          <p className="text-slate-400 font-medium mt-1 capitalize">{currentDate}</p>
        </header>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800/80 flex flex-col justify-between hover:border-slate-700 transition-colors">
            <div className="flex items-center gap-2 text-cyan-400 mb-3">
              <CalendarIcon size={16} />
              <span className="text-xs uppercase tracking-widest font-bold">Agenda</span>
            </div>
            <div>
              <p className="text-3xl font-black text-white leading-none">{agenda.length}</p>
              <p className="text-sm font-medium text-slate-400 mt-1">atendimentos hoje</p>
            </div>
          </div>
          <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800/80 flex flex-col justify-between hover:border-slate-700 transition-colors">
            <div className="flex items-center gap-2 text-amber-500 mb-3">
              <Activity size={16} />
              <span className="text-xs uppercase tracking-widest font-bold">Wellness</span>
            </div>
            <div>
              <p className="text-3xl font-black text-white leading-none">{agenda.filter(a => a.wellness_status === 'pending').length}</p>
              <p className="text-sm font-medium text-slate-400 mt-1">resposta{agenda.filter(a => a.wellness_status === 'pending').length !== 1 ? 's' : ''} pendente{agenda.filter(a => a.wellness_status === 'pending').length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800/80 flex flex-col justify-between hover:border-slate-700 transition-colors">
            <div className="flex items-center gap-2 text-rose-500 mb-3">
              <AlertTriangle size={16} />
              <span className="text-xs uppercase tracking-widest font-bold">Alertas</span>
            </div>
            <div>
              <p className="text-3xl font-black text-white leading-none">{radar.highRisk}</p>
              <p className="text-sm font-medium text-slate-400 mt-1">exigem ação hoje</p>
            </div>
          </div>
          <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800/80 flex flex-col justify-between hover:border-slate-700 transition-colors">
            <div className="flex items-center gap-2 text-emerald-500 mb-3">
              <CreditCard size={16} />
              <span className="text-xs uppercase tracking-widest font-bold">Financeiro</span>
            </div>
            <div>
              <p className="text-3xl font-black text-white leading-none">{financialAlerts.length}</p>
              <p className="text-sm font-medium text-slate-400 mt-1">item pendente</p>
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
          <span className="text-xs font-bold text-slate-500 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">{agenda.length} agendamentos</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agenda.map((item, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-[#0A1120] border border-slate-800 rounded-2xl p-5 hover:border-slate-600 transition-all group flex flex-col"
            >
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
                className="mt-auto w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(79,70,229,0.15)] hover:shadow-[0_0_25px_rgba(79,70,229,0.3)] active:scale-[0.98] flex items-center justify-center gap-2 border border-indigo-500/50"
              >
                Iniciar Sessão <ChevronRight size={14} className="opacity-80" />
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lado Esquerdo (2 colunas em desktop) */}
        <div className="lg:col-span-2 space-y-6">
          {/* 6. Inteligência EARS */}
          <section className="bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/20 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px] rounded-full pointer-events-none" />
            <h2 className="text-sm font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2 mb-3">
              <Brain size={16} /> Insight EARS
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed font-medium">
              {intelligenceText}
            </p>
          </section>

          {/* 3. Exceções Invisíveis */}
          <section className="space-y-4">
            <h2 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 px-2">
              <TrendingDown size={16} /> Exceções Ocultas (Sem Agenda)
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

          {/* 5. Radar Clínico */}
          <section className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6">
            <h2 className="text-sm font-black text-slate-300 uppercase tracking-widest flex items-center gap-2 mb-4">
              <Activity size={16} className="text-cyan-500" /> Radar da Equipe
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-950/50 border border-slate-800/80 p-3.5 rounded-xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]"></span>
                </div>
                <p className="text-sm font-medium text-slate-300"><span className="text-white font-bold">{radar.highRisk} atletas</span> preocupam hoje</p>
              </div>
              <div className="bg-slate-950/50 border border-slate-800/80 p-3.5 rounded-xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                </div>
                <p className="text-sm font-medium text-slate-300"><span className="text-white font-bold">{radar.mediumRisk} atletas</span> em monitoramento</p>
              </div>
              <div className="bg-slate-950/50 border border-slate-800/80 p-3.5 rounded-xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                </div>
                <p className="text-sm font-medium text-slate-300">Adesão wellness <span className="text-white font-bold">{radar.generalWellness}%</span></p>
              </div>
              <div className="bg-slate-950/50 border border-slate-800/80 p-3.5 rounded-xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center shrink-0 text-cyan-500">
                  <TrendingUp size={14} />
                </div>
                <p className="text-sm font-medium text-slate-300"><span className="text-white font-bold">{radar.assessmentsDone} avaliações</span> este mês</p>
              </div>
            </div>
          </section>
        </div>

        {/* Lado Direito (Side column) */}
        <div className="space-y-6">
          {/* 4. Pendências Rápidas */}
          <section className="bg-slate-900/40 border border-slate-800 rounded-3xl p-5">
            <h2 className="text-sm font-black text-slate-300 uppercase tracking-widest flex items-center gap-2 mb-4">
              <ListTodo size={16} className="text-emerald-500" /> Operacional
            </h2>
            <div className="space-y-3">
              {pendencies.map((pend) => (
                <div key={pend.id} className="flex items-start gap-3">
                  <button 
                    onClick={() => {
                      setPendencies(pendencies.map(p => p.id === pend.id ? {...p, done: !p.done} : p))
                    }}
                    className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-colors ${pend.done ? 'bg-emerald-500 border-emerald-500 text-emerald-950' : 'bg-slate-950 border-slate-700 text-transparent hover:border-emerald-500/50'}`}
                  >
                    <CheckCircle2 size={12} className={pend.done ? 'opacity-100' : 'opacity-0'} />
                  </button>
                  <span className={`text-sm ${pend.done ? 'text-slate-600 line-through' : 'text-slate-300'}`}>
                    {pend.task}
                  </span>
                </div>
              ))}
              {pendencies.length === 0 && (
                <p className="text-xs text-slate-500">Nenhuma pendência operacional.</p>
              )}
            </div>
          </section>

          {/* 7. Financeiro Discreto */}
          <section className="bg-slate-900/20 border border-slate-800/50 rounded-3xl p-5 hover:border-slate-700/50 transition-colors group">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <CreditCard size={16} className="text-slate-500" /> Financeiro
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
