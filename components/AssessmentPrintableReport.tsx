import React from 'react';
import { Activity, User, Calendar, MapPin, Sparkles } from 'lucide-react';
import { AssessmentVisualizer } from './AssessmentVisualizer';
import { ClinicalReportRenderer } from './ClinicalReportRenderer';

interface AssessmentPrintableReportProps {
  athlete: any;
  assessment: any;
  language: string;
  branding?: { logo_url: string | null; company_name: string };
}

export const AssessmentPrintableReport: React.FC<AssessmentPrintableReportProps> = ({ athlete, assessment, language, branding }) => {
  const assessmentTitle = language === "pt" ? (
    assessment.assessment_type === 'sleep' ? 'Avaliação de Sono' :
    assessment.assessment_type === 'orthopedic' ? 'Avaliação Ortopédica' :
    assessment.assessment_type === 'biomechanical' ? 'Avaliação Biomecânica' :
    assessment.assessment_type === 'physical' ? 'Avaliação Física' :
    assessment.assessment_type === 'functional' ? 'Avaliação Funcional' :
    assessment.assessment_type === 'strength' ? 'Dinamometria' :
    assessment.assessment_type === 'neurological' ? 'Avaliação Neurológica' :
    assessment.assessment_type === 'psychological' ? 'Avaliação Psicológica' :
    assessment.assessment_type === 'nutritional' ? 'Avaliação Nutricional' :
    assessment.assessment_type === 'reds' ? 'RED-S' :
    assessment.assessment_type === 'anthropometric' ? 'Avaliação Antropométrica' :
    assessment.assessment_type === 'maturation' ? 'Maturação' :
    assessment.assessment_type === 'menstrual' ? 'Ciclo Menstrual' :
    assessment.assessment_type === 'hydration' ? 'Nível de Hidratação' : assessment.assessment_type
  ) : assessment.assessment_type;

  return (
    <div className="bg-white text-slate-900 w-full relative" style={{ width: '794px', minHeight: '1122px', border: 'none', backgroundColor: '#ffffff', boxSizing: 'border-box' }}>
      {branding?.background_url && (
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url(${branding.background_url})`,
            backgroundPosition: 'center',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            opacity: 0.05,
            zIndex: 0
          }}
        />
      )}
      
      {/* Block 1: Header / Papel Timbrado + Athlete Info */}
      <div data-pdf-block="true" className="pt-[22mm] pl-[24mm] pr-[20mm] relative break-inside-avoid">
        {/* Top Minimalist Header */}
        <div className="flex justify-between items-end pb-6" style={{ borderBottom: '1px solid #EAEAEA' }}>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5" style={{ color: '#111111' }} />
            <span className="text-base font-black tracking-widest uppercase" style={{ color: '#111111', letterSpacing: '0.15em' }}>{branding?.company_name || 'ELLEVEN'}</span>
          </div>
          <div className="text-right">
            <h1 className="text-[10px] font-medium uppercase tracking-[0.15em]" style={{ color: '#111111' }}>{assessmentTitle}</h1>
            <p className="text-[9px] font-medium mt-1 uppercase tracking-[0.1em]" style={{ color: '#6B7280' }}>
               {new Date(assessment.assessment_date).toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Hero Section */}
        <div className="pt-[12mm] pb-[10mm] flex flex-col items-center text-center break-inside-avoid">
           <h2 className="text-[18px] font-semibold tracking-tight leading-tight" style={{ color: '#111111' }}>{athlete?.name || 'Atleta Não Selecionado'}</h2>
           <p className="text-[10px] uppercase tracking-[0.1em] mt-1 mb-6" style={{ color: '#6B7280' }}>{(athlete?.modalidade || athlete?.sport || '')} • {(athlete?.category || '')}</p>
           
           {(assessment.score !== undefined && assessment.score !== null) && (
              <div className="flex flex-col items-center justify-center">
                <span className="text-[48px] font-medium leading-none tracking-tighter" style={{ color: '#111111', letterSpacing: '-0.04em' }}>{assessment.score}</span>
                <span className="text-[9px] uppercase mt-2 tracking-[0.2em]" style={{ color: '#6B7280' }}>{language === "pt" ? "Índice de Performance" : "Performance Index"}</span>
              </div>
           )}
        </div>
      </div>

      <div data-pdf-block="true" className="pl-[24mm] pr-[20mm] relative z-10">
        <div className="mb-6 flex justify-between items-center break-inside-avoid" style={{ borderBottom: '1px solid #EAEAEA', paddingBottom: '16px' }}>
          <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest" style={{ color: '#111111' }}>
              {language === "pt" ? "Dados Detalhados" : "Detailed Data"}
          </h4>
        </div>
        
        <div className="w-full">
          {/* Visualizer running in export mode */}
          <AssessmentVisualizer 
            data={assessment.raw_data || assessment.data} 
            type={assessment.assessment_type} 
            language={language}
            selectedAssessment={assessment}
            isExporting={true}
          />
        </div>
      </div>

      {/* Assessment Extras (e.g. Clinical Report) */}
      {assessment.clinical_report && (
        <div data-pdf-block="true" className="pl-[24mm] pr-[20mm] mt-[12mm] relative z-10 break-inside-avoid">
          <div className="w-full">
            <ClinicalReportRenderer report={assessment.clinical_report} isDark={false} isPDF={true} />
          </div>
        </div>
      )}

      {/* Letterhead Footer */}
      <div data-pdf-block="true" className="relative mt-8 h-[40mm] z-10">
        <div className="absolute bottom-[22mm] left-[24mm] right-[20mm]">
           <div className="flex justify-between items-start pt-5" style={{ borderTop: '1px solid #EAEAEA' }}>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] font-bold uppercase tracking-[0.15em]" style={{ color: '#111111' }}>{branding?.company_name || 'ELLEVEN'}</span>
                {branding?.cnpj && <span className="text-[8px] font-medium tracking-[0.1em]" style={{ color: '#6B7280' }}>CNPJ: {branding.cnpj}</span>}
                {branding?.address && <span className="text-[8px] font-medium tracking-[0.1em]" style={{ color: '#6B7280' }}>{branding.address}</span>}
              </div>
              <div className="flex flex-col gap-1 text-right items-end">
                <span className="text-[9px] font-medium" style={{ color: '#6B7280' }}>{language === 'pt' ? 'Gerado em: ' : 'Generated: '}{new Date().toLocaleDateString()}</span>
                {branding?.phone && <span className="text-[8px] font-medium tracking-[0.1em]" style={{ color: '#6B7280' }}>{branding.phone}</span>}
                {branding?.instagram && <span className="text-[8px] font-medium tracking-[0.1em]" style={{ color: '#6B7280' }}>{branding.instagram}</span>}
                {branding?.website && <span className="text-[8px] font-medium tracking-[0.1em]" style={{ color: '#6B7280' }}>{branding.website}</span>}
                {branding?.linkedin && <span className="text-[8px] font-medium tracking-[0.1em]" style={{ color: '#6B7280' }}>{branding.linkedin}</span>}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
