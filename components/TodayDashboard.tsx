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
  const [radar, setRadar] = useState<any>({});
  const [intelligenceText, setIntelligenceText] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Bom dia');
    else if (hour < 18) setGreeting('Boa tarde');
    else setGreeting('Boa noite');

    setCurrentDate(format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR }));

    // TODO: fetch actual data from database
    // Mocking data for now as a premium mobile-first UI
    setTimeout(() => {
      setAgenda([
        { id: 1, time: '08:00', athlete_id: '1', athlete_name: 'Marcos Silva', wellness_status: 'ok', risk: 'low', alert: null, suggestion: 'Treino regenerativo sugerido.' },
        { id: 2, time: '09:30', athlete_id: '2', athlete_name: 'Ana Souza', wellness_status: 'pending', risk: 'medium', alert: 'Fadiga muscular relatada ontem.', suggestion: 'Focar em liberação miofascial.' },
        { id: 3, time: '14:00', athlete_id: '3', athlete_name: 'João Pedro', wellness_status: 'alert', risk: 'high', alert: 'Queda brusca na qualidade do sono (-30%).', suggestion: 'Adaptar carga do treino de hoje, avaliar repouso.' }
      ]);

      setExceptions([
        { id: '4', name: 'Carlos Dias', reason: 'Risco de lesão alto detectado pelas avaliações recentes.', last_seen: 'Há 2 dias' },
        { id: '5', name: 'Juliana Costa', reason: 'Stress subindo consecutivamente (+20% em 3 dias).', last_seen: 'Ontem' }
      ]);

      setPendencies([
        { id: 1, task: 'Revisar protocolo pós-operatório do Lucas', done: false },
        { id: 2, task: 'Atualizar planilhas de carga semanal', done: true },
        { id: 3, task: 'Enviar relatório mensal de wellness', done: false }
      ]);

      setFinancialAlerts([
        { id: 1, description: '2 atletas com mensalidade atrasada', urgency: 'medium' }
      ]);

      setRadar({
        highRisk: 2,
        mediumRisk: 5,
        assessmentsDone: 12,
        generalWellness: 78
      });

      setIntelligenceText('O cenário de hoje exige atenção na recuperação. 3 atletas apresentam alto risco de fadiga excessiva devido à carga da última partida. O alerta principal é para João Pedro, que teve uma quebra significativa no padrão de sono. Recomenda-se sessões focadas em recovery para o turno da tarde.');
      
      setLoading(false);
    }, 1500);

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
          <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-cyan-400 mb-2">
              <CalendarIcon size={16} />
              <span className="text-xs uppercase tracking-widest font-bold">Agenda</span>
            </div>
            <p className="text-2xl font-black text-white">{agenda.length} <span className="text-sm font-medium text-slate-500">atend.</span></p>
          </div>
          <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-amber-500 mb-2">
              <Activity size={16} />
              <span className="text-xs uppercase tracking-widest font-bold">Wellness</span>
            </div>
            <p className="text-2xl font-black text-white">{agenda.filter(a => a.wellness_status === 'pending').length} <span className="text-sm font-medium text-slate-500">pendentes</span></p>
          </div>
          <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-rose-500 mb-2">
              <AlertTriangle size={16} />
              <span className="text-xs uppercase tracking-widest font-bold">Alertas</span>
            </div>
            <p className="text-2xl font-black text-white">{radar.highRisk} <span className="text-sm font-medium text-slate-500">críticos</span></p>
          </div>
          <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center gap-2 text-emerald-500 mb-2">
              <CreditCard size={16} />
              <span className="text-xs uppercase tracking-widest font-bold">Financeiro</span>
            </div>
            <p className="text-2xl font-black text-white">{financialAlerts.length} <span className="text-sm font-medium text-slate-500">avisos</span></p>
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
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-black text-white text-sm shrink-0">
                    {item.time}
                  </div>
                  <div>
                    <h3 className="text-white font-bold">{item.athlete_name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {item.wellness_status === 'ok' && <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 flex items-center gap-1"><CheckCircle2 size={12}/> Wellness OK</span>}
                      {item.wellness_status === 'pending' && <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1"><Clock size={12}/> S/ Wellness</span>}
                      {item.wellness_status === 'alert' && <span className="text-[10px] font-bold uppercase tracking-widest text-rose-500 flex items-center gap-1"><AlertTriangle size={12}/> Alerta WL</span>}
                      
                      <span className={`w-1.5 h-1.5 rounded-full ${item.risk === 'low' ? 'bg-emerald-500' : item.risk === 'medium' ? 'bg-amber-500' : 'bg-rose-500'}`} />
                    </div>
                  </div>
                </div>
              </div>

              {item.alert && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-xs font-medium mb-3 flex items-start gap-2">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  <p>{item.alert}</p>
                </div>
              )}

              {item.suggestion && (
                <div className="bg-cyan-500/5 border border-cyan-500/10 text-cyan-300 p-3 rounded-xl text-xs flex-1 mb-4 flex items-start gap-2">
                  <Zap size={14} className="mt-0.5 shrink-0 text-cyan-500" />
                  <p>{item.suggestion}</p>
                </div>
              )}

              <button 
                onClick={() => onViewAthlete(item.athlete_id)}
                className="mt-auto w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2"
              >
                Abrir Atleta <ChevronRight size={14} />
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
          <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl text-center">
              <div className="text-2xl font-black text-rose-500 mb-1">{radar.highRisk}</div>
              <div className="text-xxs font-bold text-slate-400 uppercase tracking-widest">Risco Alto</div>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl text-center">
              <div className="text-2xl font-black text-amber-500 mb-1">{radar.mediumRisk}</div>
              <div className="text-xxs font-bold text-slate-400 uppercase tracking-widest">Risco Médio</div>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl text-center">
              <div className="text-2xl font-black text-cyan-500 mb-1">{radar.generalWellness}%</div>
              <div className="text-xxs font-bold text-slate-400 uppercase tracking-widest">Wellness Geral</div>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl text-center">
              <div className="text-2xl font-black text-emerald-500 mb-1">{radar.assessmentsDone}</div>
              <div className="text-xxs font-bold text-slate-400 uppercase tracking-widest">Avals. no Mês</div>
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
          <section className="bg-slate-900/40 border border-slate-800 rounded-3xl p-5">
            <h2 className="text-sm font-black text-slate-300 uppercase tracking-widest flex items-center gap-2 mb-4">
              <CreditCard size={16} className="text-amber-500" /> Financeiro
            </h2>
            <div className="space-y-3">
              {financialAlerts.map((fin) => (
                <div key={fin.id} className="flex items-center gap-3 bg-slate-950/50 border border-slate-800 p-3 rounded-xl cursor-pointer hover:bg-slate-800/50 transition-colors" onClick={() => onNavigate?.('finance')}>
                  <div className={`w-2 h-2 rounded-full shrink-0 ${fin.urgency === 'high' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                  <p className="text-sm text-slate-400 flex-1">{fin.description}</p>
                  <ChevronRight size={14} className="text-slate-600 shrink-0" />
                </div>
              ))}
              {financialAlerts.length === 0 && (
                <p className="text-xs text-slate-500">Tudo em dia com o financeiro.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
