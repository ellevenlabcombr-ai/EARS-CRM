import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, Download, Users, TrendingUp, Search, Calendar, 
  MapPin, ShieldCheck, Clock, Zap, Star, Filter, Presentation, Share2, ClipboardList
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import Image from 'next/image';
import { PrintableReport } from './PrintableReport';
import { AssessmentPrintableReport } from './AssessmentPrintableReport';
import { supabase } from '@/lib/supabase';

interface ReportsDashboardProps {
  athletes: any[];
}

export const ReportsDashboard: React.FC<ReportsDashboardProps> = ({ athletes = [] }) => {
  const { language } = useLanguage();
  const [selectedReport, setSelectedReport] = useState<string | null>('athlete_individual');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAthlete, setSelectedAthlete] = useState<string>("");

  const [isPreview, setIsPreview] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>("");
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [branding, setBranding] = useState<any>({ logo_url: null, company_name: 'ELLEVENLAB' });

  useEffect(() => {
    async function loadBranding() {
      try {
        if (!supabase) return;
        const { data } = await supabase.from('branding_settings').select('*').single();
        if (data) {
          setBranding(data);
        }
      } catch (err) {
        console.error('Error fetching branding:', err);
      }
    }
    loadBranding();
  }, []);

  useEffect(() => {
    async function fetchAssessments() {
      if (selectedReport === 'assessment' && selectedAthlete && supabase) {
        try {
          const { data } = await supabase
            .from('all_assessments')
            .select('*')
            .eq('athlete_id', selectedAthlete)
            .order('assessment_date', { ascending: false });
          if (data) {
            setAssessments(data);
            if (data.length > 0) {
              // Only auto-select if empty or old id not in new list
              if (!selectedAssessmentId || !data.find(a => a.id === selectedAssessmentId)) {
                 setSelectedAssessmentId(data[0].id);
              }
            }
          }
        } catch (err) {
          console.error('Error fetching assessments', err);
        }
      }
    }
    fetchAssessments();
  }, [selectedReport, selectedAthlete]);


  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setNotification({ message: "Link copiado para a área de transferência!", type: 'success' });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleGenerateReportPreview = () => {
    if (!selectedAthlete) {
      setNotification({ message: "Por favor, selecione um atleta primeiro.", type: 'error' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    setIsPreview(true);
  };

  const filteredAthletes = [...athletes]
    .filter(a => 
      a.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      a.nickname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.id?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  const reportTypes = [
    {
      id: "athlete_individual",
      title: "Prontuário Individual",
      desc: "Visão clínica 360º de um único atleta.",
      icon: Users,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/30"
    },
    {
      id: "evolutionary",
      title: "Relatório Evolutivo",
      desc: "Comparativo de métricas e evolução no tempo.",
      icon: TrendingUp,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30"
    },
    {
      id: "technical",
      title: "Resumo Técnico",
      desc: "Focado no treinador. Prontidão e carga.",
      icon: Zap,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/30"
    },
    {
      id: "executive",
      title: "Relatório Executivo",
      desc: "Sumário premium para diretoria escolar/esportiva.",
      icon: Presentation,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/30"
    },
    {
      id: "assessment",
      title: "Avaliação Específica",
      desc: "Relatório detalhado de uma avaliação clínica.",
      icon: FileText,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/30"
    }
  ];

  if (isPreview) {
    const athlete = athletes.find(a => a.id === selectedAthlete);
    
    const handleDownloadPDF = async () => {
      try {
        setIsGenerating(true);
        const { toJpeg } = await import('html-to-image');
        const jsPDF = (await import('jspdf')).default;
        
        const element = document.getElementById('report-content');
        if (!element) return;
        
        const dataUrl = await toJpeg(element, { 
          quality: 0.95, 
          backgroundColor: '#ffffff',
          pixelRatio: 2
        });
        
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        });
        
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        pdf.addImage(dataUrl, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Relatorio_${athlete?.name || 'Elleven'}.pdf`);
      } catch (error) {
        console.error('Erro ao gerar PDF:', error);
      } finally {
        setIsGenerating(false);
      }
    };

    return (
      <div className="flex flex-col pb-12">
        <div className="flex items-center justify-between bg-slate-900/50 p-6 xl:p-8 rounded-[2rem] border border-slate-800 backdrop-blur-xl shrink-0 mb-6 w-full max-w-5xl mx-auto">
          <button 
            onClick={() => setIsPreview(false)}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors uppercase tracking-widest font-bold text-xs"
          >
            ← Voltar para Configuração
          </button>
          
          <button 
            onClick={handleDownloadPDF}
            disabled={isGenerating}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-8 py-3.5 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {isGenerating ? "Gerando PDF..." : "Baixar PDF"}
          </button>
        </div>
        
        <div className="flex-1 p-4 flex justify-center pb-20">
          <div id="report-content" className="bg-white rounded-xl shadow-2xl overflow-hidden shrink-0" style={{ width: '210mm', minHeight: '297mm' }}>
             {selectedReport === 'assessment' ? (
                <AssessmentPrintableReport 
                  athlete={athlete} 
                  assessment={assessments.find(a => a.id === selectedAssessmentId) || assessments[0]} 
                  language={language} 
                  branding={branding} 
                />
             ) : (
                <PrintableReport athlete={athlete} reportType={selectedReport || ''} reportTypes={reportTypes} branding={branding} />
             )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 flex flex-col min-h-[calc(100vh-120px)] pb-12">
      {/* Header section with styling similar to other dashboards */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/50 p-6 xl:p-8 rounded-[2rem] border border-slate-800 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
            <FileText className="w-7 h-7 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tighter">RELATÓRIOS</h1>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 flex-1 items-center">
        {/* Main Configuration form */}
        <div className="w-full max-w-5xl bg-slate-900/50 rounded-[2rem] border border-slate-800 flex flex-col">
          
          <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900 rounded-t-[2rem]">
            <h2 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
              <Filter className="w-4 h-4 text-cyan-500" /> Configuração da Extração
            </h2>
            
            <div className="flex items-center gap-2">
               <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-1 bg-amber-500/10 text-amber-500 rounded-lg border border-amber-500/20">
                 Score Global IA Ativo
               </span>
            </div>
          </div>

          <div className="flex-1 p-6 md:p-8">
             
             {/* Main Configuration form */}
             <div className="space-y-6 max-w-2xl mx-auto w-full pt-4">
                
                {/* Athlete Search & Select */}
                <div className="space-y-3 relative">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Atleta Alvo</label>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input 
                      type="text"
                      placeholder="Buscar por nome..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setIsDropdownOpen(true)}
                      onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-white text-sm outline-none focus:border-cyan-500 transition-colors placeholder:text-slate-600 font-medium"
                    />
                  </div>
                  
                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 z-50 w-full bg-slate-950 border border-slate-800 rounded-2xl max-h-64 overflow-y-auto custom-scrollbar p-2 shadow-xl">
                      {filteredAthletes.length === 0 ? (
                        <div className="p-4 text-center text-sm text-slate-500">Nenhum atleta encontrado.</div>
                      ) : (
                        filteredAthletes.map(athlete => {
                          const isSelected = selectedAthlete === athlete.id;
                          return (
                            <div 
                              key={athlete.id}
                              onMouseDown={(e) => {
                                // use onMouseDown to fire before onBlur
                                e.preventDefault();
                                setSelectedAthlete(athlete.id);
                                setSearchQuery(athlete.name);
                                setIsDropdownOpen(false);
                              }}
                              className={`p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-colors ${
                                isSelected ? 'bg-cyan-500/10' : 'hover:bg-slate-900'
                              }`}
                            >
                              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                                {athlete.name?.charAt(0)}
                              </div>
                              <div className="flex-1">
                                <div className="text-sm font-bold text-white">{athlete.name}</div>
                                <div className="text-[10px] text-slate-500 uppercase tracking-wider">{athlete.category || 'Sem Categoria'}</div>
                              </div>
                              {isSelected && <ShieldCheck className="w-4 h-4 text-cyan-400" />}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5"><FileText className="w-3 h-3" /> Modelo de Relatório</label>
                     <div className="relative">
                       <select 
                         value={selectedReport || ''}
                         onChange={(e) => setSelectedReport(e.target.value)}
                         className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-4 text-white text-sm outline-none focus:border-cyan-500 uppercase tracking-wider font-bold appearance-none"
                       >
                         {reportTypes.map((report) => (
                           <option key={report.id} value={report.id}>{report.title}</option>
                         ))}
                       </select>
                       <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                         <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                       </div>
                     </div>
                  </div>
                  
                  {selectedReport === 'assessment' && (
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5"><FileText className="w-3 h-3" /> Avaliação Específica</label>
                       <div className="relative">
                         <select 
                           value={selectedAssessmentId || ''}
                           onChange={(e) => setSelectedAssessmentId(e.target.value)}
                           className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-4 text-white text-sm outline-none focus:border-cyan-500 uppercase tracking-wider font-bold appearance-none"
                         >
                           {assessments.length === 0 && <option value="">Nenhuma avaliação encontrada</option>}
                           {assessments.map((ass) => {
                             const typeTitles: Record<string, string> = {
                               sleep: 'Sono', orthopedic: 'Ortopédica', biomechanical: 'Biomecânica',
                               physical: 'Física', functional: 'Funcional', strength: 'Dinamometria',
                               neurological: 'Neurológica', psychological: 'Psicológica',
                               nutritional: 'Nutricional', reds: 'RED-S', anthropometric: 'Antropométrica',
                               maturation: 'Maturação', menstrual: 'Ciclo Menstrual', hydration: 'Hidratação'
                             };
                             const typeTitle = language === 'pt' ? typeTitles[ass.assessment_type] || ass.assessment_type : ass.assessment_type;
                             return (
                             <option key={ass.id} value={ass.id}>
                               {new Date(ass.assessment_date).toLocaleDateString()} - {typeTitle}
                             </option>
                             );
                           })}
                         </select>
                         <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                           <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                         </div>
                       </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Período Evolutivo</label>
                     <select className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-4 text-white text-sm outline-none focus:border-cyan-500 uppercase tracking-wider font-bold appearance-none">
                       <option>Recente vs Anterior (Última)</option>
                       <option>Últimos 30 dias</option>
                       <option>Últimos 90 dias</option>
                       <option>Últimos 6 meses</option>
                       <option>Último  ano</option>
                     </select>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5"><MapPin className="w-3 h-3" /> Unidade de Atendimento</label>
                     <select className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-4 text-white text-sm outline-none focus:border-cyan-500 uppercase tracking-wider font-bold appearance-none">
                       <option>Todas as unidades</option>
                       <option>Sede Principal</option>
                       <option>Unidade Escolar</option>
                     </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5"><ClipboardList className="w-3 h-3" /> Módulos a Incluir</label>
                     <select className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-4 text-white text-sm outline-none focus:border-cyan-500 uppercase tracking-wider font-bold appearance-none">
                       <option>Prontuário Completo + Insights</option>
                       <option>Apenas Avaliações Clínicas</option>
                       <option>Apenas Wellness e Recuperação</option>
                       <option>Relatório Físico (Desempenho)</option>
                     </select>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5"><Users className="w-3 h-3" /> Profissional Responsável</label>
                     <select className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-4 text-white text-sm outline-none focus:border-cyan-500 uppercase tracking-wider font-bold appearance-none">
                       <option>Todos os profissionais</option>
                       <option>Dr. Roberto Silva</option>
                       <option>Fis. Amanda Costa</option>
                     </select>
                  </div>
                </div>

                {/* AI Insights Sample Preview */}
                <div className="bg-slate-950/80 rounded-2xl border border-slate-800/80 p-6 mt-8 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-500 to-purple-500" />
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                      <Star className="w-4 h-4 text-cyan-400" />
                      Preview de Insights ELLEVEN AI
                    </h4>
                    <span className="text-[9px] text-slate-500 font-bold uppercase">Apenas Exemplo</span>
                  </div>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-300 leading-relaxed">Tendência positiva de evolução física observada na dinamometria dos últimos 30 dias. Ganhos de força de 12% a favorativos.</p>
                    </li>
                    <li className="flex items-start gap-3">
                      <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-300 leading-relaxed">Houve queda recente na recuperação associada à qualidade do sono, sugerindo ajuste tático nas cargas dos próximos 7 dias.</p>
                    </li>
                  </ul>
                </div>
             </div>
          </div>
          
          <div className="p-6 border-t border-slate-800 bg-slate-900/80 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4 rounded-b-[2rem]">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Status: <span className="text-white">Pronto para Gerar</span></span>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto relative">
              {notification && (
                <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-4 px-4 py-2 text-xs font-bold rounded-lg border whitespace-nowrap z-50 ${
                  notification.type === 'error' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                }`}>
                  {notification.message}
                </div>
              )}
              <button 
                onClick={handleShare}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-6 py-3.5 rounded-xl font-bold uppercase tracking-widest text-xs transition-all border border-slate-700"
              >
                <Share2 className="w-4 h-4" />
                Compartilhar Link
              </button>
              <button 
                onClick={handleGenerateReportPreview}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white px-8 py-3.5 rounded-xl font-black uppercase tracking-widest text-xs transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)]"
              >
                <ClipboardList className="w-4 h-4" />
                Gerar Relatório
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
