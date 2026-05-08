"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  ChevronLeft, 
  Activity, 
  Moon, 
  Zap, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown,
  BrainCircuit,
  Stethoscope,
  History,
  Save,
  MessageSquareDiff
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface SmartSessionProps {
  athleteId: string;
  onBack: () => void;
  onSave: () => void;
}

export function SmartSession({ athleteId, onBack, onSave }: SmartSessionProps) {
  const [athlete, setAthlete] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Exame Expresso states
  const [checklist, setChecklist] = useState({
    dor: false,
    adm: false,
    forca: false,
    mobilidade: false,
    confianca: false,
  });
  const [observacoes, setObservacoes] = useState("");

  // Registrar Evolução states
  const [evolucao, setEvolucao] = useState({
    conduta: "",
    resposta: "",
    proximaAcao: "",
  });

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Fetch athlete data from supabase or back-end
    const fetchAthlete = async () => {
      try {
        if (!supabase) throw new Error("Supabase not initialized");
        const { data, error } = await supabase
          .from("athletes")
          .select("*")
          .eq("id", athleteId)
          .single();

        if (error) throw error;
        
        // Mock data for Smart Session context
        setAthlete({
          ...data,
          currentScore: 85,
          status: {
            sono: "Bom",
            fadiga: "Média",
            dor: "Nenhuma",
            wellness: "Ok"
          },
          lastSessionChanges: [
            { label: "Qualidade do Sono", trend: "up", value: "+15%" },
            { label: "Fadiga Muscular", trend: "down", value: "-10%" }
          ],
          suggestedFocus: "Focar em liberação miofascial de cadeia posterior e mobilidade de quadril devido ao aumento de carga no treino de ontem.",
          recentHistory: [
            { date: "Ontem", summary: "Recovery ativo pós-jogo." },
            { date: "Há 3 dias", summary: "Mobilidade e ativação de core." },
            { date: "Há 5 dias", summary: "Sessão padrão pré-jogo." }
          ]
        });
      } catch (err) {
        console.error("Error fetching athlete", err);
        // Fallback mock if failure
        setAthlete({
          name: "Atleta Carregando...",
          category: "Profissional",
          currentScore: 85,
          status: { sono: "Bom", fadiga: "Média", dor: "Nenhuma", wellness: "Ok" },
          lastSessionChanges: [],
          suggestedFocus: "Carregando foco sugerido...",
          recentHistory: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAthlete();
  }, [athleteId]);

  const handleSave = () => {
    // In a real app, save to Supabase here
    setSaved(true);
    // onSave callback to go back or show something else
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh] text-slate-400">
        <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (saved) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-6">
        <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mb-4">
          <CheckCircle2 size={40} />
        </div>
        <h2 className="text-3xl font-black text-white">Sessão Salva!</h2>
        <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl max-w-md w-full">
          <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-widest mb-3 flex items-center justify-center gap-2">
            <BrainCircuit size={16} /> Próxima Conduta Sugerida
          </h3>
          <p className="text-slate-300">
            Monitore o relato de dor ao longo das próximas 24h. Sugere-se carga leve no próximo treino.
          </p>
        </div>
        <button 
          onClick={onBack}
          className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-sm transition-all"
        >
          Voltar para Hoje
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#050B14] pb-24">
      {/* 1. Topo Fixo */}
      <div className="sticky top-0 z-[60] bg-[#0A1120]/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-4 pt-safe flex flex-col gap-4 shadow-xl">
        <div className="flex items-center justify-between">
          <button 
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-black text-white leading-none mb-1">{athlete?.name}</h1>
            <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-500 bg-cyan-500/10 px-2 py-0.5 rounded-full">
              {athlete?.category || athlete?.modalidade || "Profissional"}
            </span>
          </div>
          <div className="w-11 h-11 relative flex items-center justify-center">
             <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="16" fill="none" className="stroke-slate-800" strokeWidth="3" />
                <circle cx="18" cy="18" r="16" fill="none" className="stroke-emerald-500" strokeWidth="3" strokeDasharray="100" strokeDashoffset={100 - (athlete?.currentScore || 0)} strokeLinecap="round" />
            </svg>
            <span className="absolute text-xs font-black text-emerald-400">{athlete?.currentScore}</span>
          </div>
        </div>

        {/* Status Rápido */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg shrink-0">
            <Moon size={14} className="text-indigo-400" />
            <span className="text-[10px] font-bold text-slate-300 uppercase shrink-0">Sono: {athlete?.status?.sono}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg shrink-0">
            <Activity size={14} className="text-amber-400" />
            <span className="text-[10px] font-bold text-slate-300 uppercase shrink-0">Fadiga: {athlete?.status?.fadiga}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg shrink-0">
            <AlertCircle size={14} className="text-emerald-400" />
            <span className="text-[10px] font-bold text-slate-300 uppercase shrink-0">Dor: {athlete?.status?.dor}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg shrink-0">
            <Zap size={14} className="text-cyan-400" />
            <span className="text-[10px] font-bold text-slate-300 uppercase shrink-0">Well: {athlete?.status?.wellness}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 lg:p-6 lg:max-w-3xl lg:mx-auto w-full space-y-6">
        
        {/* 2. O que mudou desde a última sessão */}
        <section>
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Activity size={14} /> Desde a Última Sessão
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {athlete?.lastSessionChanges?.map((change: any, i: number) => (
              <div key={i} className="bg-slate-900/40 border border-slate-800 rounded-xl p-3 flex place-items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">{change.label}</span>
                <div className={`flex items-center gap-1 text-xs font-bold ${change.trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {change.trend === 'up' ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
                  {change.value}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. Foco sugerido hoje */}
        <section className="bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/20 rounded-2xl p-5 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px] rounded-full pointer-events-none" />
           <h2 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2 mb-3">
             <BrainCircuit size={14} /> Foco Clínico Inteligente
           </h2>
           <p className="text-sm text-slate-200 font-medium leading-relaxed mb-4">
             {athlete?.suggestedFocus}
           </p>
           <div className="flex gap-2">
             <button className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg py-2.5 text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2">
               <CheckCircle2 size={14} /> Confirmar Plano
             </button>
             <button className="bg-slate-800 hover:bg-slate-700 text-white rounded-lg px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors">
               Ajustar
             </button>
           </div>
        </section>

        {/* 4. Exame Expresso */}
        <section>
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Stethoscope size={14} /> Exame Expresso
          </h2>
          <div className="bg-[#0A1120] border border-slate-800 rounded-2xl p-4 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(checklist).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => setChecklist(prev => ({ ...prev, [key]: !prev[key as keyof typeof checklist] }))}
                  className={`flex items-center gap-2 p-3 rounded-xl border transition-all text-sm font-bold capitalize ${
                    value 
                      ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-400" 
                      : "bg-slate-900/50 border-slate-800 text-slate-400"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${value ? "border-cyan-400 bg-cyan-400 text-[#050B14]" : "border-slate-600"}`}>
                    {value && <CheckCircle2 size={12} />}
                  </div>
                  {key === 'adm' ? 'ADM' : key.replace('forca', 'Força').replace('confianca', 'Confiança')}
                </button>
              ))}
            </div>
            <textarea 
              placeholder="Observações rápidas do exame (opcional)..."
              value={observacoes}
              onChange={e => setObservacoes(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder-slate-500 resize-none h-20 focus:border-cyan-500 outline-none"
            />
          </div>
        </section>

        {/* 6. Registrar Evolução */}
        <section>
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <MessageSquareDiff size={14} /> Registrar Evolução
          </h2>
          <div className="bg-[#0A1120] border border-slate-800 rounded-2xl p-4 space-y-3">
            <div>
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1 block">Conduta Realizada</label>
               <input 
                 value={evolucao.conduta}
                 onChange={e => setEvolucao(prev => ({...prev, conduta: e.target.value}))}
                 placeholder="Ex: Liberação miofascial e exercícios isométricos"
                 className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:border-cyan-500 transition-colors"
               />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1 block">Resposta do Atleta</label>
                <input 
                  value={evolucao.resposta}
                  onChange={e => setEvolucao(prev => ({...prev, resposta: e.target.value}))}
                  placeholder="Ex: Alívio imediato"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1 block">Próxima Ação</label>
                <input 
                  value={evolucao.proximaAcao}
                  onChange={e => setEvolucao(prev => ({...prev, proximaAcao: e.target.value}))}
                  placeholder="Ex: Reavaliar amanhã"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>
          </div>
        </section>

        {/* 5. Histórico Recente */}
        <section>
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <History size={14} /> Histórico Recente
          </h2>
          <div className="space-y-2">
            {athlete?.recentHistory?.map((hist: any, i: number) => (
              <div key={i} className="flex gap-3 items-center">
                 <div className="text-[10px] font-bold text-slate-500 uppercase w-16 text-right shrink-0">{hist.date}</div>
                 <div className="w-2 h-2 rounded-full bg-slate-800 shrink-0" />
                 <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-2.5 flex-1 text-xs text-slate-300">
                   {hist.summary}
                 </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* 7. Botão Principal Fixo Base */}
      <div className="sticky bottom-0 -mx-4 lg:-mx-6 px-4 lg:px-6 p-4 pb-safe bg-gradient-to-t from-[#050B14] via-[#050B14] 80% to-transparent z-[50] flex items-end mt-8">
         <div className="w-full max-w-3xl mx-auto">
            <button 
              onClick={handleSave}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black uppercase tracking-widest py-4 rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-all active:scale-[0.98]"
            >
              <Save size={18} /> Salvar Sessão
            </button>
         </div>
      </div>
    </div>
  );
}
