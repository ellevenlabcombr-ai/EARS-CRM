import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FileText, Download, Users, TrendingUp, Calendar as CalendarIcon, ShieldAlert } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface ReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  athletesList?: any[];
}

export const ReportsModal: React.FC<ReportsModalProps> = ({ isOpen, onClose, athletesList = [] }) => {
  const { language } = useLanguage();
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  if (!isOpen) return null;

  const reportTypes = [
    {
      id: "athlete_individual",
      title: "Relatório Individual / Prontuário",
      desc: "Histórico completo, avaliações, risco e evolução de um atleta específico.",
      icon: Users,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/30"
    },
    {
      id: "interventions",
      title: "Estatísticas de Departamento",
      desc: "Volume de atendimentos, lesões mais comuns e eficácia clínica.",
      icon: TrendingUp,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30"
    }
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex flex-col sm:items-center sm:justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-[#050B14]/90 backdrop-blur-md"
        />

        {/* Modal content */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-800">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <FileText className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-tight">Central de Relatórios</h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Extração & Analytics</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {reportTypes.map((report) => (
                  <div 
                    key={report.id}
                    onClick={() => setSelectedReport(report.id)}
                    className={`relative p-6 rounded-2xl border cursor-pointer transition-all ${
                      selectedReport === report.id 
                        ? `${report.border} bg-slate-800 shadow-[0_0_20px_rgba(0,0,0,0.5)] scale-[1.02] ring-1 ring-[var(--tw-ring-color)] ring-opacity-50` 
                        : "border-slate-800 bg-slate-950/50 hover:bg-slate-900 hover:border-slate-700"
                    }`}
                  >
                     <div className={`w-12 h-12 rounded-xl mb-4 flex items-center justify-center border ${report.border} ${report.bg} ${report.color}`}>
                        <report.icon className="w-6 h-6" />
                     </div>
                     <h3 className="text-sm font-black text-white uppercase tracking-wider mb-2">{report.title}</h3>
                     <p className="text-xs text-slate-400">{report.desc}</p>

                     {selectedReport === report.id && (
                       <div className="absolute top-4 right-4 text-white">
                         <div className="w-4 h-4 rounded-full bg-cyan-500 flex items-center justify-center">
                           <div className="w-1.5 h-1.5 bg-white rounded-full" />
                         </div>
                       </div>
                     )}
                  </div>
                ))}
             </div>

             <AnimatePresence mode="popLayout">
               {selectedReport && (
                 <motion.div 
                   initial={{ opacity: 0, y: 10, height: 0 }}
                   animate={{ opacity: 1, y: 0, height: 'auto' }}
                   exit={{ opacity: 0, height: 0 }}
                   className="mt-8 pt-8 border-t border-slate-800"
                 >
                    <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800">
                      <h4 className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-6 border-b border-slate-800 pb-2">Configuração de Extração</h4>
                      
                      <div className="space-y-6">
                        {/* Filters Placeholder */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          <div className="space-y-2">
                             <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Período</label>
                             <select className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-cyan-500 uppercase tracking-wider font-bold">
                               <option>Últimos 7 dias</option>
                               <option>Últimos 30 dias</option>
                               <option>Mês Atual</option>
                               <option>Temporada Completa</option>
                             </select>
                          </div>
                          <div className="space-y-2">
                             <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tipo / Módulo</label>
                             <select className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-cyan-500 uppercase tracking-wider font-bold">
                               {selectedReport === 'athlete_individual' ? (
                                 <>
                                   <option>Prontuário Completo</option>
                                   <option>Resumo de Risco Diário</option>
                                   <option>Questionário de Prontidão (Wellness)</option>
                                   <option>Avaliação Ortopédica</option>
                                   <option>Avaliação Biomecânica</option>
                                   <option>Avaliação de Concussão</option>
                                   <option>Avaliação Psicológica</option>
                                   <option>Avaliação Nutricional</option>
                                   <option>Avaliação RED-S</option>
                                   <option>Avaliação Antropométrica</option>
                                   <option>Avaliação de Maturação</option>
                                   <option>Acompanhamento Menstrual</option>
                                   <option>Avaliação de Hidratação</option>
                                   <option>Avaliação Funcional</option>
                                   <option>Dinamometria Isométrica</option>
                                   <option>Testes Físicos</option>
                                 </>
                               ) : (
                                 <>
                                   <option>Geral de Atendimentos</option>
                                   <option>Incidência de Lesões</option>
                                   <option>Tipos de Intervenções</option>
                                 </>
                               )}
                             </select>
                          </div>
                          {selectedReport === 'athlete_individual' && (
                            <div className="space-y-2">
                               <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Atleta Alvo</label>
                               <select className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-cyan-500 uppercase tracking-wider font-bold">
                                 <option value="">Selecione o atleta...</option>
                                 {athletesList.map(athlete => (
                                   <option key={athlete.id} value={athlete.id}>
                                     {athlete.name}
                                   </option>
                                 ))}
                               </select>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-end pt-4 mt-8">
                          <button className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white px-8 py-3.5 rounded-xl font-black uppercase tracking-widest text-sm transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]">
                            <Download className="w-5 h-5" />
                            Gerar Relatório
                          </button>
                        </div>
                      </div>
                    </div>
                 </motion.div>
               )}
             </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
