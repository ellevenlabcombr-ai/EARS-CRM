import React from 'react';
import { Activity } from 'lucide-react';
import { ClinicalReportRenderer } from '../ClinicalReportRenderer';

export const SleepReportPDF = ({ assessment, athlete, language = "pt" }: { assessment: any, athlete: any, language?: string }) => {
  const data = assessment.raw_data || assessment.data || {};
  const score = assessment.score || data?.score || 0;
  
  const translations: Record<string, any> = {
    pt: {
      criticalRecovery: "RECUPERAÇÃO CRÍTICA",
      excellentRecovery: "EXCELENTE RECUPERAÇÃO",
      goodRecovery: "BOA RECUPERAÇÃO",
      moderateRecovery: "RECUPERAÇÃO MODERADA",
      quality: "Qual.",
      duration: "Duração",
      awakenings: "Despert.",
      morningFatigue: "Fadiga",
      screens: "Telas",
      latency: "Latência",
      sleepRecoveryReport: "Relatório de Sono",
      recoveryIndex: "Índice de Recuperação",
      clinicalInterpretation: "Interpretação Clínica",
      performanceImpact: "Impacto na Performance",
      actionProtocol: "Protocolo de Ação",
      professional: "Profissional",
      reactionSpeed: "Velocidade de reação pode ser afetada",
      cognitiveSharpness: "Redução da agilidade cognitiva",
      neuralRecovery: "Baixa recuperação neural",
      morningReadiness: "Prontidão matinal inconsistente",
      action1: "Reduzir telas 90 min ant. dormir",
      action2: "Horário regular de sono",
      action3: "Baixa luz ambiente à noite",
      action4: "Reavaliar em 7 dias",
      dateLocale: 'pt-BR'
    },
    en: {
      criticalRecovery: "CRITICAL RECOVERY",
      excellentRecovery: "EXCELLENT RECOVERY",
      goodRecovery: "GOOD RECOVERY",
      moderateRecovery: "MODERATE RECOVERY",
      quality: "Quality",
      duration: "Duration",
      awakenings: "Awaken.",
      morningFatigue: "Fatigue",
      screens: "Screens",
      latency: "Latency",
      sleepRecoveryReport: "Sleep Report",
      recoveryIndex: "Recovery Index",
      clinicalInterpretation: "Clinical Interpretation",
      performanceImpact: "Performance Impact",
      actionProtocol: "Action Protocol",
      professional: "Professional",
      reactionSpeed: "Reaction speed may decline",
      cognitiveSharpness: "Reduced cognitive sharpness",
      neuralRecovery: "Neural recovery below ideal",
      morningReadiness: "Morning readiness inconsistent",
      action1: "Reduce screens 90 min pre-sleep",
      action2: "Fixed sleep schedule",
      action3: "Lower ambient light at night",
      action4: "Reassess in 7 days",
      dateLocale: 'en-US'
    }
  };

  const l = translations[language] || translations['pt'];
  
  let statusText = l.criticalRecovery;
  let statusColor = "#DC2626"; // Vermelho crítico
  
  if (score >= 85) {
    statusText = l.excellentRecovery;
    statusColor = "#16A34A"; // Verde performance
  } else if (score >= 70) {
    statusText = l.goodRecovery;
    statusColor = "#16A34A";
  } else if (score >= 50) {
    statusText = l.moderateRecovery;
    statusColor = "#D97706"; // Amarelo atenção
  }

  const metrics = [
    { label: l.quality, value: `${data.quality || 0}/10`, state: data.quality >= 8 ? 'good' : data.quality >= 5 ? 'warning' : 'critical' },
    { label: l.duration, value: `${data.duration || 0}h`, state: data.duration >= 7 ? 'good' : data.duration >= 6 ? 'warning' : 'critical' },
    { label: l.awakenings, value: `${data.awakenings || 0}`, state: data.awakenings <= 1 ? 'good' : data.awakenings <= 3 ? 'warning' : 'critical' },
    { label: l.morningFatigue, value: `${data.morningFatigue || 0}/10`, state: data.morningFatigue <= 3 ? 'good' : data.morningFatigue <= 6 ? 'warning' : 'critical' },
    { label: l.screens, value: `${data.screenExposure || 0}/10`, state: data.screenExposure <= 3 ? 'good' : data.screenExposure <= 6 ? 'warning' : 'critical' },
    { label: l.latency, value: `${data.difficultyFallingAsleep || 0}/10`, state: data.difficultyFallingAsleep <= 3 ? 'good' : data.difficultyFallingAsleep <= 6 ? 'warning' : 'critical' },
  ];

  const getColor = (state: string) => {
    if (state === 'good') return '#111111';
    if (state === 'warning') return '#D97706';
    return '#DC2626';
  }
  
  return (
    <div className="bg-white font-sans box-border relative overflow-hidden" style={{ width: '794px', height: '1122px', border: 'none' }}>
      {/* TOPO MINIMALISTA */}
      <div data-pdf-block="true" className="pt-[22mm] break-inside-avoid">
        <div className="flex justify-between items-end pb-6" style={{ borderBottom: '1px solid #EAEAEA' }}>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5" style={{ color: '#111111' }} />
            <span className="text-base font-black tracking-widest uppercase" style={{ color: '#111111', letterSpacing: '0.15em' }}>ELLEVEN</span>
          </div>
          <div className="text-right">
            <h1 className="text-[10px] font-medium uppercase tracking-[0.15em]" style={{ color: '#111111' }}>{l.sleepRecoveryReport}</h1>
            <p className="text-[9px] font-medium mt-1 uppercase tracking-[0.1em]" style={{ color: '#6B7280' }}>
               {new Date(assessment.assessment_date).toLocaleDateString(l.dateLocale, { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* HERO SECTION */}
      <div data-pdf-block="true" className="pt-[12mm] pb-[10mm] flex flex-col items-center text-center break-inside-avoid">
         <h2 className="text-[18px] font-semibold tracking-tight leading-tight" style={{ color: '#111111' }}>{athlete.name}</h2>
         <p className="text-[10px] uppercase tracking-[0.1em] mt-1 mb-6" style={{ color: '#6B7280' }}>{athlete.sport || athlete.modalidade} • {athlete.category || l.professional}</p>
         
         <div className="flex flex-col items-center justify-center">
            <span className="text-[48px] font-medium leading-none tracking-tighter" style={{ color: '#111111', letterSpacing: '-0.04em' }}>{score}</span>
            <span className="text-[9px] uppercase mt-2 tracking-[0.2em]" style={{ color: '#6B7280' }}>{l.recoveryIndex}</span>
            <span className="text-[9.5px] uppercase mt-3 tracking-[0.1em] font-medium" style={{ color: statusColor }}>{statusText}</span>
         </div>
      </div>

      {/* METRICS STRIP */}
      <div data-pdf-block="true" className="mb-[12mm] break-inside-avoid">
         <div className="flex justify-between items-start py-6" style={{ borderTop: '1px solid #EAEAEA', borderBottom: '1px solid #EAEAEA' }}>
            {metrics.map((m, i) => (
               <div key={i} className="flex flex-col flex-1 items-center" style={{ borderRight: i < metrics.length - 1 ? '1px solid #EAEAEA' : 'none' }}>
                  <p className="text-[8px] uppercase tracking-[0.15em] mb-2" style={{ color: '#6B7280' }}>{m.label}</p>
                  <p className="text-[14px] font-medium" style={{ color: getColor(m.state) }}>{m.value}</p>
               </div>
            ))}
         </div>
      </div>

      {/* CLINICAL REPORT SECTION */}
      <div data-pdf-block="true" className="break-inside-avoid">
         <div className="w-full">
            <ClinicalReportRenderer 
               report={assessment.clinical_report || "No clinical interpretation available."} 
               isDark={false} 
               isPDF={true} 
            />
         </div>
      </div>

      {/* RODAPÉ */}
      <div className="absolute bottom-[22mm] left-[24mm] right-[20mm]">
         <div className="flex justify-between items-center pt-5" style={{ borderTop: '1px solid #EAEAEA' }}>
            <span className="text-[9px] font-medium uppercase tracking-[0.15em]" style={{ color: '#6B7280' }}>ELLEVEN Performance Intelligence</span>
            <span className="text-[9px] font-medium" style={{ color: '#6B7280' }}>1</span>
         </div>
      </div>
    </div>
  );
}
