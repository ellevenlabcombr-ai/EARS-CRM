"use client";

import React, { useState, useMemo } from 'react';
import { 
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  History,
  Activity,
  Zap,
  Moon,
  Thermometer,
  ShieldCheck,
  BrainCircuit,
  AlertCircle,
  Tag
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SessionModePanelProps {
  athlete: any;
  clinicalSessionData: any;
  wellnessHistory: any[];
  clinicalAssessments: any[];
  prontuarioNotes: any[];
  isLoading?: boolean;
  onSaveSession: (data: any) => Promise<void>;
  onClose: () => void;
  onViewFullProntuario?: () => void;
  evolutionForm?: React.ReactNode;
}

export const SessionModePanel: React.FC<SessionModePanelProps> = ({ 
  athlete,
  clinicalSessionData,
  wellnessHistory,
  clinicalAssessments,
  prontuarioNotes,
  onClose,
  onViewFullProntuario,
  evolutionForm
}) => {
  const [manualDecision, setManualDecision] = useState<"full_train" | "modified_train" | "recovery" | "hold" | null>(null);
  const [isEditingDecision, setIsEditingDecision] = useState(false);

  const lastWellness = wellnessHistory?.[0] || {};
  const metrics = {
    sleep: lastWellness.sleep || lastWellness.sleep_hours || 8,
    fatigue: lastWellness.fatigue || lastWellness.fatigue_level || 4,
    pain: lastWellness.soreness || lastWellness.muscle_soreness || 3,
    wellness: lastWellness.readiness || lastWellness.readiness_score || 52
  };

  const masterScore = clinicalSessionData?.masterScore?.finalScore || 52;
  const acwr = clinicalSessionData?.priorityOutput?.metrics?.acwr || 1.73;

  return (
    <div className="fixed inset-0 z-50 bg-[#020617] flex flex-col pt-safe pb-safe overflow-hidden">
      {/* 1. TOPO FIXO */}
      <div className="shrink-0 z-10 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5 p-4 md:p-6 pb-4 md:pb-6">
        <div className="max-w-4xl mx-auto flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-4">
              <button onClick={onViewFullProntuario || onClose} className="text-slate-400 hover:text-white flex items-center gap-1 self-start w-fit">
                <ChevronLeft className="w-5 h-5" />
                <span className="text-[10px] md:text-xs font-black uppercase tracking-widest leading-none mt-0.5">Voltar p/ Prontuário</span>
              </button>
              <div>
                <h1 className="text-xl md:text-2xl font-black text-white tracking-tighter uppercase">{athlete.name || "CRISTINA JORGE"}</h1>
                <p className="text-[10px] md:text-xs font-bold text-cyan-500 uppercase tracking-[0.2em]">{athlete.category || "MASTER"} • {athlete.modalidade || athlete.sport || "VOLLEYBALL"}</p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-3xl md:text-4xl font-black tracking-tighter text-cyan-400">{masterScore}%</div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">MASTER SCORE</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 md:gap-4 border-t border-white/5 pt-6">
            <div className="bg-slate-900/50 rounded-2xl p-4 flex flex-col items-center">
              <Moon className="w-5 h-5 text-indigo-400 mb-2" />
              <span className="text-[18px] font-black text-white">{metrics.sleep}h</span>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sono</span>
            </div>
            <div className="bg-slate-900/50 rounded-2xl p-4 flex flex-col items-center">
              <Zap className="w-5 h-5 text-amber-400 mb-2" />
              <span className="text-[18px] font-black text-white">{metrics.fatigue}</span>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Fadiga</span>
            </div>
            <div className="bg-slate-900/50 rounded-2xl p-4 flex flex-col items-center">
              <Thermometer className="w-5 h-5 text-rose-500 mb-2" />
              <span className="text-[18px] font-black text-rose-500">{metrics.pain}</span>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Dor</span>
            </div>
          </div>
        </div>
      </div>

      <div id="session-panel-scroll" className="flex-1 overflow-y-auto w-full custom-scrollbar">
        <div className="max-w-4xl mx-auto p-4 md:p-6 pb-32 space-y-8">
          
          {/* PRONTIDÃO & TENDÊNCIA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900/40 rounded-3xl p-6 border border-white/5 flex items-center justify-between">
              <div>
                <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Prontidão</h2>
                <span className="text-3xl font-black text-cyan-400">{metrics.wellness}%</span>
              </div>
              <Activity className="w-10 h-10 text-cyan-500/20" />
            </div>

            <div className="bg-slate-900/40 rounded-3xl p-6 border border-white/5 flex flex-col justify-center">
              <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Dinâmica de Tendência</h2>
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-bold text-slate-400 uppercase">Prontidão Curta (7D)</span>
                <div className="flex items-center gap-1 text-rose-400 font-black">
                  <TrendingDown className="w-4 h-4" /> -1%
                </div>
              </div>
              <div className="flex items-center justify-between w-full mt-2">
                <span className="text-xs font-bold text-slate-400 uppercase">Padrão de Sono Atual</span>
                <span className="text-xs text-indigo-400 font-black uppercase">Protegido</span>
              </div>
            </div>
          </div>

          {/* INTELIGÊNCIA CLÍNICA EAR/S */}
          <div className="bg-rose-500/10 border-2 border-rose-500/20 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <BrainCircuit className="w-32 h-32 text-rose-500" />
            </div>
            <div className="relative z-10 space-y-4">
              <h2 className="text-xs font-black text-rose-500 uppercase tracking-[0.2em] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Inteligência Clínica EAR/S
              </h2>
              <div className="space-y-1">
                <p className="text-xl font-bold text-white">Dor recorrente</p>
                <p className="text-lg font-bold text-slate-300">Alta carga (ACWR: {acwr})</p>
                <p className="text-lg font-bold text-rose-400">Recomenda-se suspensão imediata.</p>
              </div>

              <div className="flex flex-wrap gap-3 pt-4">
                {!isEditingDecision ? (
                  <>
                    <button className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-black uppercase tracking-widest rounded-xl h-12 px-6 transition-all">
                      Confirmar Plano
                    </button>
                    <button 
                      onClick={() => setIsEditingDecision(true)}
                      className="bg-slate-900/50 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-black uppercase tracking-widest rounded-xl h-12 px-6 transition-all border border-slate-700">
                      Ajustar Manualmente
                    </button>
                  </>
                ) : (
                  <div className="w-full grid grid-cols-2 gap-2">
                    <button onClick={() => setIsEditingDecision(false)} className="text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl h-12">Livre</button>
                    <button onClick={() => setIsEditingDecision(false)} className="text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-xl h-12">Modificado</button>
                    <button onClick={() => setIsEditingDecision(false)} className="text-[10px] font-black uppercase tracking-widest hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl h-12">Recovery</button>
                    <button onClick={() => setIsEditingDecision(false)} className="text-[10px] font-black uppercase tracking-widest bg-rose-500/20 text-rose-400 border border-rose-500/50 rounded-xl h-12">Hold</button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CONTEXTO 360 */}
          <div className="space-y-4">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Contexto 360° (Histórico & Alertas)</h2>
            
            <div className="bg-slate-900/40 rounded-2xl border border-white/5 p-4 space-y-4">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-rose-500" /> Alertas Clínicos & Tags
              </h3>
              <div className="flex flex-col gap-2">
                <span className="text-xs text-rose-400 bg-rose-500/10 px-3 py-2 rounded-lg font-black uppercase tracking-widest border border-rose-500/20 w-fit">POSTERIOR CHAIN VULNERABILITY</span>
                <span className="text-xs text-amber-400 bg-amber-500/10 px-3 py-2 rounded-lg font-black uppercase tracking-widest border border-amber-500/20 w-fit">LOAD INTOLERANCE</span>
              </div>
            </div>

            <div className="bg-slate-900/40 rounded-2xl border border-white/5 p-4 space-y-3">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-emerald-500" /> Última Avaliação Estrutural
              </h3>
              <div>
                <p className="text-sm font-bold text-white uppercase tracking-wider">Avaliação de SLEEP</p>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">DATA: 29/04/2026</p>
              </div>
            </div>
          </div>

          {/* ÚLTIMA SESSÃO (HISTÓRICO) */}
          <div className="space-y-4">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
               <History className="w-4 h-4" /> Informativo Sobre a Última Sessão
            </h2>
            <div className="bg-slate-900/30 border border-white/5 rounded-2xl p-4 flex gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-800 flex flex-col items-center justify-center shrink-0">
                <span className="text-xs font-black text-white">28</span>
                <span className="text-[9px] font-bold text-slate-500 uppercase">ABR</span>
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-300 italic">"Sessão Anterior - Controle de Dor e Recovery devido à alta percepção subjetiva de esforço."</p>
                <p className="text-[10px] font-black text-cyan-500 uppercase tracking-widest mt-2">Dra. Cristina Jorge</p>
              </div>
            </div>
            
            <button 
                onClick={onViewFullProntuario}
                className="w-full text-xs font-black text-cyan-500 hover:text-cyan-400 uppercase tracking-widest bg-cyan-500/5 hover:bg-cyan-500/10 transition-all py-4 rounded-xl border border-cyan-500/20"
            >
                Ver Prontuário Completo
            </button>
          </div>

          {/* FICHA DE NOVA EVOLUÇÃO COMPLETA */}
          <div className="mt-8">
            {evolutionForm}
          </div>

        </div>
      </div>
    </div>
  );
};
