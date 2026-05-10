"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Zap, 
  ShieldAlert, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle, 
  AlertTriangle,
  ClipboardList,
  Target,
  Tag,
  Activity,
  Info,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Moon,
  Clock,
  Thermometer,
  Brain,
  BrainCircuit,
  Stethoscope,
  Move,
  Dumbbell,
  PersonStanding,
  Users,
  Save,
  RefreshCcw,
  Sparkles,
  History,
  MessageSquare,
  Plus,
  Trophy
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SignaturePad } from '../ui/SignaturePad';

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
  onOpenNewEvolution?: () => void;
}

export const SessionModePanel: React.FC<SessionModePanelProps> = ({ 
  athlete,
  clinicalSessionData, 
  wellnessHistory,
  clinicalAssessments,
  prontuarioNotes,
  isLoading = false,
  onSaveSession,
  onClose,
  onViewFullProntuario,
  onOpenNewEvolution
}) => {
  const [loading, setLoading] = useState(false);
  const [showNextSuggestion, setShowNextSuggestion] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [signature, setSignature] = useState<string | null>(null);
  const [manualDecision, setManualDecision] = useState<"full_train" | "modified_train" | "recovery" | "hold" | null>(null);
  const [isEditingDecision, setIsEditingDecision] = useState(false);

  // Safety guard for athlete
  if (!athlete || !athlete.id) {
    return (
      <div className="fixed inset-0 z-50 bg-[#020617] flex items-center justify-center">
        <RefreshCcw className="w-10 h-10 text-cyan-500 animate-spin" />
      </div>
    );
  }
  
  // Interactive State for "Exame Expresso"
  const [expressoExam, setExpressoExam] = useState({
    dor: 'Normal',
    adm: 'Normal',
    forca: 'Normal',
    mobilidade: 'Normal',
    confianca: 'Alta',
    observacoes: ''
  });

  const lastWellness = wellnessHistory?.[0] || {};
  
  const metrics = {
    sleep: lastWellness.sleep || lastWellness.sleep_hours || 0,
    fatigue: lastWellness.fatigue || lastWellness.fatigue_level || 0,
    pain: lastWellness.soreness || lastWellness.muscle_soreness || 0,
    wellness: lastWellness.readiness || lastWellness.readiness_score || 0
  };

  if (isLoading && metrics.wellness === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-[#020617] flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
          <BrainCircuit className="w-10 h-10 text-cyan-500 absolute inset-0 m-auto animate-pulse" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-black text-white uppercase tracking-widest mb-2">Processando EAR/S Care</h2>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Sincronizando Wellness, Avaliações e Histórico Clínico...</p>
        </div>
      </div>
    );
  }

  const getMetricColor = (val: number, type: 'sleep' | 'fatigue' | 'pain' | 'wellness') => {
    if (type === 'wellness' || type === 'sleep') {
      if (val >= 80 || (type === 'sleep' && val >= 7)) return 'text-emerald-400';
      if (val >= 60 || (type === 'sleep' && val >= 6)) return 'text-amber-400';
      return 'text-rose-400';
    } else {
      if (val <= 3) return 'text-emerald-400';
      if (val <= 6) return 'text-amber-400';
      return 'text-rose-400';
    }
  };

  const masterScore = clinicalSessionData?.masterScore;
  
  const stats = [
    { label: 'Sono', value: `${metrics.sleep}h`, icon: Moon, color: getMetricColor(metrics.sleep, 'sleep') },
    { label: 'Fadiga', value: metrics.fatigue, icon: Zap, color: getMetricColor(metrics.fatigue, 'fatigue') },
    { label: 'Dor', value: metrics.pain, icon: Thermometer, color: getMetricColor(metrics.pain, 'pain') },
    { label: 'Prontidão', value: `${metrics.wellness}%`, icon: Trophy, color: getMetricColor(metrics.wellness, 'wellness') },
  ];

  const handleSave = async () => {
    setLoading(true);
    try {
      const sessionData = {
        athlete_id: athlete.id,
        expresso_exam: expressoExam,
        decision_applied: manualDecision || clinicalSessionData?.priorityOutput?.adjustedDecision,
        signature: signature,
        timestamp: new Date().toISOString()
      };
      await onSaveSession(sessionData);
      setShowNextSuggestion(true);
    } catch (err) {
      console.error('Error saving session:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#020617] overflow-y-auto pb-20 pt-28 md:pt-0">
      {/* 1. TOPO FIXO E PREMIUM */}
      <div className="sticky top-0 z-10 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5 p-4 md:p-6">
        <div className="max-w-4xl mx-auto flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white hover:bg-white/5 rounded-full">
                <ChevronLeft className="w-6 h-6" />
              </Button>
              <div>
                <h1 className="text-xl md:text-2xl font-black text-white tracking-tighter uppercase">{athlete.name}</h1>
                <p className="text-[10px] md:text-xs font-bold text-cyan-500 uppercase tracking-[0.2em]">{athlete.category} • {athlete.modalidade || athlete.sport}</p>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-3xl md:text-4xl font-black tracking-tighter ${masterScore ? (masterScore.finalScore >= 80 ? 'text-emerald-400' : masterScore.finalScore >= 60 ? 'text-amber-400' : 'text-rose-400') : getMetricColor(metrics.wellness, 'wellness')}`}>
                {masterScore ? masterScore.finalScore : metrics.wellness}%
              </div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">MASTER SCORE</p>
              {masterScore && (
                <p className={`text-[8px] font-black uppercase tracking-widest mt-1 ${masterScore.confidence === 'high' ? 'text-emerald-500' : masterScore.confidence === 'medium' ? 'text-amber-500' : 'text-rose-500'}`}>
                  Confiança: {masterScore.confidence === 'high' ? 'Alta' : masterScore.confidence === 'medium' ? 'Média' : 'Baixa'}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 md:gap-4">
            {stats.map((s, i) => (
              <div key={i} className="bg-slate-900/50 border border-white/5 rounded-2xl p-2 md:p-3 flex flex-col items-center">
                <s.icon className={`w-4 h-4 md:w-5 md:h-5 ${s.color} mb-1`} />
                <span className="text-[14px] md:text-18px font-black text-white">{s.value}</span>
                <span className="text-[8px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-8">
        
        {/* 2. BLOCO: O QUE MUDOU / TENDÊNCIAS */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Dinâmica de Tendência</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-indigo-500/5 border-indigo-500/10 shadow-xl overflow-hidden">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Prontidão Curta (7d)</p>
                  <div className={`flex items-center gap-2 text-2xl font-black ${(clinicalSessionData?.trends?.trendScore || 0) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {(clinicalSessionData?.trends?.trendScore || 0) >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                    {(clinicalSessionData?.trends?.trendScore || 0) > 0 ? '+' : ''}{(clinicalSessionData?.trends?.trendScore || 0).toFixed(0)}%
                  </div>
                </div>
                <div className="w-16 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center">
                  <Activity className="w-8 h-8 text-indigo-500/20" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/40 border-white/5 shadow-xl">
              <CardContent className="p-4">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Padrão de Sono Atual</p>
                <div className="flex items-center gap-4">
                  <div className="h-1 flex-1 bg-slate-800 rounded-full overflow-hidden">
                     <div className="h-full bg-cyan-500" style={{ width: `${(metrics.sleep / 10) * 100}%` }} />
                  </div>
                  <span className="text-xs font-black text-white italic">{metrics.sleep >= 7 ? 'Protegido' : 'Déficit'}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* 3. BLOCO: FOCO SUGERIDO HOJE */}
        <section className="space-y-4">
          <Card className="bg-cyan-500/10 border-cyan-500/20 border-2 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <BrainCircuit className="w-24 h-24 text-cyan-400" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-black text-cyan-500 uppercase tracking-[0.2em] flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Inteligência Clínica EAR/S
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-lg font-bold text-white leading-tight mb-6">
                {masterScore && masterScore.domains.find(d => d?.factors?.length > 0) ? (
                  <div className="space-y-2">
                    <p>Motivo principal:</p>
                    <div className="flex flex-wrap gap-2">
                      {masterScore.domains.flatMap(d => d?.factors || []).slice(0, 2).map((factor, i) => (
                        <span key={i} className="text-rose-400 bg-rose-500/10 px-2 py-1 rounded-lg text-sm">{factor}</span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p>{clinicalSessionData?.priorityOutput?.content?.factors?.[0] || 'Atendimento focado em estabilidade funcional.'}</p>
                )}
                <p className="text-cyan-400 mt-3">
                  Recomenda-se {(manualDecision || clinicalSessionData?.priorityOutput?.adjustedDecision) === 'hold' ? 'suspensão imediata' : (manualDecision || clinicalSessionData?.priorityOutput?.adjustedDecision) === 'recovery' ? 'protocolo de recovery' : (manualDecision || clinicalSessionData?.priorityOutput?.adjustedDecision) === 'modified_train' ? 'treino modificado' : 'treino livre'}.
                  {manualDecision && <span className="ml-2 text-xs text-amber-400">(Ajustado Manualmente)</span>}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {!isEditingDecision ? (
                  <>
                  <Button 
                    onClick={() => {
                        setIsFinalizing(true);
                        setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
                    }}
                    variant="outline" 
                    className="bg-cyan-500/20 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30 text-xs font-black uppercase tracking-widest rounded-2xl h-10 px-6">
                    Confirmar Plano
                  </Button>
                  <Button 
                    onClick={() => setIsEditingDecision(true)}
                    variant="ghost" 
                    className="text-slate-400 hover:text-white text-xs font-black uppercase tracking-widest">
                    Ajustar Manualmente
                  </Button>
                  </>
                ) : (
                  <div className="w-full flex gap-2">
                    <Button onClick={() => { setManualDecision('full_train'); setIsEditingDecision(false); setIsFinalizing(true); setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100); }} variant="outline" className="text-xs font-black uppercase tracking-widest hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30 rounded-xl h-10">Livre</Button>
                    <Button onClick={() => { setManualDecision('modified_train'); setIsEditingDecision(false); setIsFinalizing(true); setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100); }} variant="outline" className="text-xs font-black uppercase tracking-widest hover:bg-indigo-500/20 text-indigo-400 border-indigo-500/30 rounded-xl h-10">Modificado</Button>
                    <Button onClick={() => { setManualDecision('recovery'); setIsEditingDecision(false); setIsFinalizing(true); setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100); }} variant="outline" className="text-xs font-black uppercase tracking-widest hover:bg-amber-500/20 text-amber-400 border-amber-500/30 rounded-xl h-10">Recovery</Button>
                    <Button onClick={() => { setManualDecision('hold'); setIsEditingDecision(false); setIsFinalizing(true); setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100); }} variant="outline" className="text-xs font-black uppercase tracking-widest hover:bg-rose-500/20 text-rose-400 border-rose-500/30 rounded-xl h-10">Hold</Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* 4. BLOCO: VISÃO 360 DO ATLETA */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Contexto 360° (Histórico & Alertas)</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="bg-slate-900 border-white/5 p-4 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Alertas Clínicos & Tags</p>
                <div className="flex flex-wrap gap-2">
                  {clinicalSessionData?.priorityOutput?.content?.tags?.map((tag: string, i: number) => (
                    <div key={i} className="px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full text-[10px] font-black text-rose-400 uppercase tracking-widest">
                      {tag}
                    </div>
                  ))}
                  {clinicalSessionData?.priorityOutput?.content?.tags?.length === 0 && (
                    <span className="text-[10px] font-bold text-slate-600 uppercase italic">Nenhum alerta crítico ativo</span>
                  )}
                </div>
              </div>
            </Card>

            <Card className="bg-slate-900 border-white/5 p-4 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Última Avaliação Estrutural</p>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-xl">
                    <ClipboardList className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-300">
                      {clinicalAssessments?.[0]?.source_table ? 
                        `Avaliação de ${clinicalAssessments[0].source_table.replace('_assessments', '').toUpperCase()}` : 
                        'Sem avaliações recentes'}
                    </p>
                    <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase">
                      Data: {clinicalAssessments?.[0]?.assessment_date ? new Date(clinicalAssessments[0].assessment_date).toLocaleDateString('pt-BR') : '---'}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="bg-slate-900 border-white/5 p-4 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Dados Biométricos</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-800/50 rounded-lg p-2">
                    <p className="text-[8px] font-black text-slate-500 uppercase">Peso</p>
                    <p className="text-xs font-bold text-white">{athlete.weight || '--'} kg</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-2">
                    <p className="text-[8px] font-black text-slate-500 uppercase">Altura</p>
                    <p className="text-xs font-bold text-white">{athlete.height || '--'} {athlete.height && athlete.height < 3 ? 'm' : 'cm'}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-2">
                    <p className="text-[8px] font-black text-slate-500 uppercase">Idade</p>
                    <p className="text-xs font-bold text-white">{athlete.age ? `${athlete.age} anos` : (athlete.birthDate || athlete.birth_date) ? `${new Date().getFullYear() - new Date(athlete.birthDate || athlete.birth_date).getFullYear()} anos` : '--'}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-2">
                    <p className="text-[8px] font-black text-slate-500 uppercase">Dom.</p>
                    <p className="text-xs font-bold text-white uppercase">{athlete.dominance || '--'}</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* 4. BLOCO: EXAME EXPRESSO */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Stethoscope className="w-5 h-5 text-purple-400" />
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Exame Expresso (Checklist)</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { id: 'dor', label: 'Dor', icon: Thermometer, options: ['Normal', 'Aumento', 'Diminuição', 'Aguda'] },
              { id: 'adm', label: 'ADM', icon: Move, options: ['Normal', 'Restrita', 'Aumentada'] },
              { id: 'forca', label: 'Força', icon: Dumbbell, options: ['Normal', 'Reduzida', 'Déficit'] },
              { id: 'mobilidade', label: 'Mobilidade', icon: PersonStanding, options: ['Ok', 'Rígido', 'Hipermóvel'] },
              { id: 'confianca', label: 'Confiança', icon: Brain, options: ['Alta', 'Moderada', 'Baixa'] },
            ].map((field) => (
              <div key={field.id} className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                   <field.icon className="w-3 h-3 text-slate-500" />
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{field.label}</span>
                </div>
                <select 
                  className="bg-slate-950 border border-white/10 rounded-xl w-full p-2 text-xs font-bold text-white focus:border-purple-500/50 outline-none"
                  value={(expressoExam as any)[field.id]}
                  onChange={(e) => setExpressoExam({ ...expressoExam, [field.id]: e.target.value })}
                >
                  {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            ))}
            <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 space-y-3 col-span-2 md:col-span-1">
               <div className="flex items-center gap-2">
                   <MessageSquare className="w-3 h-3 text-slate-500" />
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Obs</span>
                </div>
                <input 
                  type="text"
                  placeholder="Rápida..."
                  className="bg-slate-950 border border-white/10 rounded-xl w-full p-2 text-xs font-bold text-white focus:border-purple-500/50 outline-none"
                  value={expressoExam.observacoes}
                  onChange={(e) => setExpressoExam({ ...expressoExam, observacoes: e.target.value })}
                />
            </div>
          </div>
        </section>

        {/* 5. BLOCO: HISTÓRICO RECENTE */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <History className="w-5 h-5 text-slate-400" />
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Histórico Sessões (Últimas 3)</h2>
          </div>
          <div className="space-y-3">
            {prontuarioNotes.slice(0, 3).map((note, i) => {
              // Safe date parsing for the circular badge
              let dateObj = new Date();
              let isDateValid = false;
              
              try {
                // If note.date is already formatted like "dd/mm/yyyy hh:mm", we need to handle it
                // In HealthProfile it's .toLocaleString('pt-BR')
                if (note.date) {
                  // Try parsing directly. If it fails, we might need a regex
                  const parts = note.date.split(',')[0].split('/');
                  if (parts.length === 3) {
                    dateObj = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
                    isDateValid = !isNaN(dateObj.getTime());
                  } else {
                    dateObj = new Date(note.date);
                    isDateValid = !isNaN(dateObj.getTime());
                  }
                }
              } catch (e) {
                console.error("Error parsing note date:", e);
              }

              return (
                <div key={i} className="bg-slate-900/30 border border-white/5 rounded-2xl p-4 flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] font-black text-white">
                      {isDateValid ? format(dateObj, 'dd', { locale: ptBR }) : '--'}
                    </span>
                    <span className="text-[8px] font-bold text-slate-500 uppercase">
                      {isDateValid ? format(dateObj, 'MMM', { locale: ptBR }) : '---'}
                    </span>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-xs font-bold text-slate-300 line-clamp-2 italic">
                      "{note.text || note.observations || 'Sem descrição'}"
                    </p>
                    <p className="text-[10px] font-black text-cyan-500 uppercase tracking-widest mt-1">
                      {note.professional || 'Atendimento Clínico'}
                    </p>
                  </div>
                </div>
              );
            })}
            {prontuarioNotes.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-4 uppercase font-bold">Nenhum histórico anterior disponível</p>
            )}
            <Button 
                variant="ghost" 
                onClick={onViewFullProntuario}
                className="w-full text-[10px] font-black text-cyan-500 hover:text-cyan-400 uppercase tracking-widest gap-2 bg-cyan-500/5 py-6 rounded-2xl border border-cyan-500/10"
            >
                Ver Prontuário Completo <ChevronRight className="w-3 h-3" />
            </Button>
          </div>
        </section>

        {/* 6. BLOCO: REGISTRAR EVOLUÇÃO */}
        <section className="space-y-4">
          <div className="flex items-center justify-between p-6 bg-slate-900 border border-white/5 rounded-[2rem] shadow-2xl">
            <div className="flex items-center gap-3">
              <ClipboardList className="w-6 h-6 text-emerald-400" />
              <div>
                <h2 className="text-sm font-black text-white uppercase tracking-widest">Evolução Clínica</h2>
                <p className="text-[10px] font-bold text-slate-500 uppercase">Registre condutas e observações completas</p>
              </div>
            </div>
            <Button 
                onClick={onOpenNewEvolution}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-widest px-6 h-12 rounded-2xl flex items-center gap-2 transition-all active:scale-95"
            >
                <Plus className="w-4 h-4" /> Nova Evolução Completa
            </Button>
          </div>
        </section>

        {/* 7. BOTÃO SALVAR */}
        <div className="pt-10">
          {!isFinalizing ? (
            <Button 
              className="w-full h-16 bg-cyan-500 hover:bg-cyan-400 text-[#020617] font-black text-lg uppercase tracking-[0.2em] rounded-3xl shadow-[0_20px_50px_rgba(6,182,212,0.3)] group transition-all active:scale-95"
              onClick={() => setIsFinalizing(true)}
              disabled={loading || isLoading}
            >
              {isLoading ? (
                <>
                  <RefreshCcw className="w-6 h-6 animate-spin mr-3" />
                  Carregando dados...
                </>
              ) : (
                <>
                  <CheckCircle className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" />
                  Finalizar Atendimento
                </>
              )}
            </Button>
          ) : (
            <Card className="bg-slate-900 border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.1)] p-6 rounded-[2rem]">
              <SignaturePad 
                onSave={(dataUrl) => {
                  setSignature(dataUrl);
                  handleSave();
                }}
                onClear={() => setSignature(null)}
              />
              <Button 
                variant="ghost" 
                onClick={() => setIsFinalizing(false)}
                className="w-full mt-4 text-[10px] font-black text-slate-500 uppercase tracking-widest"
              >
                Voltar para edição
              </Button>
            </Card>
          )}
        </div>

      </div>

      {/* 8. OVERLAY DE SUGESTÃO PÓS-SALVAR */}
      <AnimatePresence>
        {showNextSuggestion && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-55 bg-black/90 backdrop-blur-2xl flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="max-w-md w-full bg-slate-900 border border-cyan-500/30 rounded-[2.5rem] p-8 shadow-[0_0_100px_rgba(6,182,212,0.2)] text-center space-y-6"
            >
              <div className="w-20 h-20 bg-cyan-500 rounded-full mx-auto flex items-center justify-center shadow-[0_0_40px_rgba(6,182,212,0.5)]">
                <Check className="w-10 h-10 text-[#020617]" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Sessão Finalizada</h3>
                <p className="text-slate-400 font-bold mb-8">Evolução registrada com sucesso. A IA gerou a próxima diretriz para este atleta.</p>
                
                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-3xl p-6 text-left space-y-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-500" />
                    <span className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">Sugestão Automática</span>
                  </div>
                  <p className="text-sm font-bold text-white italic">
                    "Manter monitoramento de dor nas próximas 12h. Se score mantiver estável, liberar para treinamento de força excêntrico amanhã com 70% da carga."
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full h-14 border-white/10 text-white font-black uppercase tracking-widest rounded-2xl"
                onClick={() => {
                  setShowNextSuggestion(false);
                  onClose();
                }}
              >
                Concluído
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
