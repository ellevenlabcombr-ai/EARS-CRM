import React from 'react';
import { 
  ArrowLeft, 
  Activity, 
  BrainCircuit, 
  Stethoscope, 
  History, 
  PencilLine, 
  Save 
} from 'lucide-react';

interface SessionDashboardProps {
  onBack?: () => void;
}

export function SessionDashboard({ onBack }: SessionDashboardProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col font-sans selection:bg-indigo-500/30">
      {/* 1. Header atleta */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-slate-900 hover:bg-slate-800 flex items-center justify-center transition-colors border border-slate-800/50"
          >
            <ArrowLeft size={18} className="text-slate-400" />
          </button>
          <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/20">
            Sessão Inteligente
          </div>
          <div className="w-10" /> {/* Spacer para centralizar badge */}
        </div>
        
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-center shadow-inner shrink-0">
            <span className="text-xl font-black text-slate-300">JP</span>
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">João Pedro</h1>
            <p className="text-sm font-medium text-slate-400">Atacante • Sub-20</p>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-6 pb-32">
        
        {/* 2. Mudanças recentes */}
        <section className="bg-slate-900/40 border border-slate-800 rounded-3xl p-5">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
            <Activity size={16} className="text-amber-500" /> Mudanças Recentes
          </h2>
          <div className="bg-slate-950/50 rounded-2xl p-4 border border-slate-800/50 border-dashed flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-slate-500">Nenhum alerta crítico ou mudança significativa nas últimas 24h.</p>
            {/* Placeholder para tags de mudança */}
          </div>
        </section>

        {/* 3. Foco sugerido hoje */}
        <section className="bg-indigo-950/20 border border-indigo-900/30 rounded-3xl p-5 shadow-[0_0_30px_rgba(79,70,229,0.05)_inset]">
          <h2 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2 mb-4">
            <BrainCircuit size={16} /> Foco Sugerido Hoje
          </h2>
          <div className="bg-indigo-950/40 rounded-2xl p-4 border border-indigo-500/10">
            <p className="text-sm text-indigo-200/70 leading-relaxed italic">
               IA analisando correlações para sugerir o foco principal desta sessão...
            </p>
          </div>
        </section>

        {/* 4. Exame Expresso */}
        <section className="bg-slate-900/40 border border-slate-800 rounded-3xl p-5">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
            <Stethoscope size={16} className="text-emerald-500" /> Exame Expresso
          </h2>
          <div className="grid grid-cols-2 gap-3">
             <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800/80 flex items-center justify-center text-xs font-bold text-slate-500 h-16 hover:bg-slate-800/50 transition-colors cursor-pointer">
               Testes de Dor
             </div>
             <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800/80 flex items-center justify-center text-xs font-bold text-slate-500 h-16 hover:bg-slate-800/50 transition-colors cursor-pointer">
               Força (MVC)
             </div>
             <div className="col-span-2 bg-slate-950/50 rounded-xl p-3 border border-slate-800/80 border-dashed flex items-center justify-center text-xs font-bold text-slate-500 h-12 hover:bg-slate-800/50 transition-colors cursor-pointer">
               + Adicionar Teste Rápido
             </div>
          </div>
        </section>

        {/* 5. Histórico recente */}
        <section className="bg-slate-900/40 border border-slate-800 rounded-3xl p-5">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
            <History size={16} className="text-cyan-500" /> Histórico Recente
          </h2>
          <div className="space-y-3">
             <div className="bg-slate-950/50 border border-slate-800/50 rounded-xl p-4 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-800" />
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Há 2 dias</p>
                <p className="text-sm text-slate-300">Nenhum registro clínico recente neste período.</p>
             </div>
          </div>
        </section>

        {/* 6. Registrar evolução */}
        <section className="bg-slate-900/40 border border-slate-800 rounded-3xl p-5">
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
            <PencilLine size={16} className="text-purple-500" /> Registrar Evolução
          </h2>
          <div className="bg-slate-950/50 rounded-2xl p-4 border border-slate-800/80 h-32 flex items-start justify-start">
             <p className="text-sm text-slate-600">Escreva detalhes da sessão, queixas ou nota clínica...</p>
          </div>
        </section>

      </main>

      {/* 7. Botão Salvar Sessão */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent pb-6 pt-12 z-40">
        <button className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-[0_0_20px_rgba(79,70,229,0.2)] hover:shadow-[0_0_25px_rgba(79,70,229,0.3)] active:scale-[0.98] flex items-center justify-center gap-2 border border-indigo-500/50">
          <Save size={16} className="opacity-80" />
          Finalizar Sessão
        </button>
      </div>

    </div>
  );
}
