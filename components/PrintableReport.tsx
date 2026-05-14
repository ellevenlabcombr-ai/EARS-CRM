import React from 'react';
import { ShieldCheck, MapPin, Calendar, User, Activity, TrendingUp, AlertTriangle } from 'lucide-react';
import Image from 'next/image';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface PrintableReportProps {
  athlete: any;
  reportType: string;
  reportTypes: any[];
  branding?: { logo_url: string | null; company_name: string };
}

const readinessData = [
  { subject: 'Recuperação', A: 80, fullMark: 100 },
  { subject: 'Sono', A: 65, fullMark: 100 },
  { subject: 'Estresse', A: 90, fullMark: 100 },
  { subject: 'Fadiga', A: 75, fullMark: 100 },
  { subject: 'Humor', A: 85, fullMark: 100 },
];

export const PrintableReport: React.FC<PrintableReportProps> = ({ athlete, reportType, reportTypes, branding }) => {
  const typeDetails = reportTypes.find(t => t.id === reportType) || reportTypes[0];

  return (
    <div className="bg-white text-slate-900 w-full relative" style={{ padding: '20mm', paddingBottom: '30mm', minHeight: '297mm' }}>
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
      
      {/* Background watermarks or decorative elements can go here */}
      <div className="absolute top-0 left-0 w-full h-3 flex z-10">
        <div className="w-3/4 h-full bg-slate-900" />
        <div className="w-1/4 h-full bg-yellow-400" />
      </div>
      
      {/* Header / Papel Timbrado */}
      <div className="flex justify-between items-center border-b-2 border-slate-200 pb-8 mb-8 mt-4 relative z-10">
        <div className="flex items-center gap-6">
          {branding?.logo_url ? (
            <div className="h-16 flex items-center justify-center shrink-0">
               <img 
                 src={branding.logo_url} 
                 crossOrigin="anonymous"
                 alt={branding.company_name || "Logo"} 
                 className="h-full w-auto object-contain"
               />
            </div>
          ) : null}
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">{branding?.company_name || 'ELLEVENLAB'}</h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Prevenção e Gestão de Performance</p>
          </div>
        </div>
        <div className="text-right flex flex-col items-end">
          <div className="bg-slate-100 px-4 py-2 rounded-lg mb-2">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{typeDetails.title}</h2>
          </div>
          <p className="text-xs text-slate-500 font-medium">Gerado em {new Date().toLocaleDateString('pt-BR')}</p>
        </div>
      </div>

      {/* Athlete Info */}
      <div className="bg-slate-50/80 rounded-2xl p-6 mb-8 border border-slate-100 flex items-center gap-6 relative z-10 backdrop-blur-sm">
        <div className="w-20 h-20 bg-slate-200 rounded-full overflow-hidden flex items-center justify-center text-3xl font-bold text-slate-400 shrink-0 shadow-inner">
          {athlete?.avatar_url || athlete?.photo ? (
            <img src={athlete.avatar_url || athlete.photo} crossOrigin="anonymous" alt={athlete.name} className="w-full h-full object-cover" />
          ) : (
            athlete?.name?.charAt(0) || 'A'
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-2xl font-black text-slate-800">{athlete?.name || 'Atleta Não Selecionado'}</h3>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3 text-sm text-slate-500 font-medium whitespace-nowrap">
            {(athlete?.modalidade || athlete?.sport) && <span className="flex items-center gap-2"><Activity className="w-4 h-4 text-slate-400" /> {athlete.modalidade || athlete.sport}</span>}
            {athlete?.posicao && <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-slate-400" /> {athlete.posicao}</span>}
            {athlete?.category && <span className="flex items-center gap-2"><User className="w-4 h-4 text-slate-400" /> {athlete.category}</span>}
            {athlete?.birth_date && (
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" /> 
                {(() => {
                  const today = new Date();
                  const birthDate = new Date(athlete.birth_date);
                  let age = today.getFullYear() - birthDate.getFullYear();
                  const m = today.getMonth() - birthDate.getMonth();
                  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                  }
                  return `${age} anos`;
                })()}
              </span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Score Global</div>
          <div className="text-4xl font-black text-cyan-600">85<span className="text-lg text-slate-400">/100</span></div>
        </div>
      </div>

      {/* Main Content Areas */}
      <div className="space-y-8 relative z-10">
        
        {/* IA Insights */}
        <div className="border border-slate-200 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500" />
          <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-600" />
            Insights ELLEVEN
          </h4>
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <p className="text-sm text-slate-600 leading-relaxed font-medium">Tendência positiva de evolução física observada na dinamometria dos últimos 30 dias. Ganhos de força de 12% a favorativos.</p>
            </li>
            <li className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm text-slate-600 leading-relaxed font-medium">Houve queda recente na recuperação associada à qualidade do sono, sugerindo ajuste tático nas cargas dos próximos 7 dias.</p>
            </li>
          </ul>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-6">
          <div className="border border-slate-200 rounded-2xl p-6">
             <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4">Evolução Física</h4>
             <div className="h-48 flex items-end justify-between gap-3 mt-4">
               {[40, 50, 45, 60, 75, 85].map((h, i) => {
                 const colors = ['bg-rose-500', 'bg-orange-500', 'bg-amber-500', 'bg-emerald-500', 'bg-cyan-500', 'bg-violet-500'];
                 const bgColors = ['bg-rose-50', 'bg-orange-50', 'bg-amber-50', 'bg-emerald-50', 'bg-cyan-50', 'bg-violet-50'];
                 return (
                 <div key={i} className="flex-1 flex flex-col items-center justify-end gap-2 h-full">
                   <span className={`text-[10px] font-black ${colors[i].replace('bg-', 'text-')}`}>{h}</span>
                   <div className={`w-full ${bgColors[i]} rounded-t-sm relative flex-1`}>
                     <div className={`absolute bottom-0 left-0 w-full ${colors[i]} rounded-t-sm transition-all shadow-sm`} style={{ height: `${h}%` }} />
                   </div>
                   <span className="text-[10px] font-bold text-slate-400 uppercase">W{i+1}</span>
                 </div>
               )})}
             </div>
          </div>
          
          <div className="border border-slate-200 rounded-2xl p-6 flex flex-col">
             <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4">Prontidão Clínica</h4>
             <div className="flex-1 w-full min-h-[12rem] -mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={readinessData}>
                    <defs>
                      <linearGradient id="colorProntidao" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8}/>
                        <stop offset="50%" stopColor="#8b5cf6" stopOpacity={0.6}/>
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.4}/>
                      </linearGradient>
                    </defs>
                    <PolarGrid stroke="#cbd5e1" strokeDasharray="3 3" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#334155', fontSize: 11, fontWeight: '900' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar 
                      name="Prontidão" 
                      dataKey="A" 
                      stroke="#ec4899" 
                      strokeWidth={3} 
                      fill="url(#colorProntidao)" 
                      fillOpacity={1} 
                      dot={{ r: 4, fill: "#06b6d4", strokeWidth: 2, stroke: "#fff" }}
                      activeDot={{ r: 6, fill: "#8b5cf6", strokeWidth: 0 }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
             </div>
          </div>
        </div>

        {/* Detailed Description */}
        <div className="border-t-2 border-slate-100 pt-8 mt-8">
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4">Parecer Técnico</h4>
          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            Atleta apresenta quadro estável com melhora considerável em testes de potência de membros inferiores. 
            Recomenda-se atenção à ingesta hídrica e manutenção do protocolo preventivo para cadeia posterior.
            A assimetria funcional observada no ciclo anterior foi reduzida para níveis seguros (&lt; 10%).
            Liberado para progressão de carga em treinos técnicos e táticos.
          </p>
        </div>

      </div>

      {/* Signature Area */}
      <div className="mt-16 pt-8 border-t border-slate-200">
        <div className="flex justify-end mb-8">
          <div className="text-center min-w-[250px]">
            <p className="text-sm font-black text-slate-800">Assinatura do Profissional</p>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Responsável Técnico</p>
          </div>
        </div>
      </div>

      {/* Letterhead Footer */}
      <div className="absolute bottom-0 left-0 w-full h-[40mm] flex items-end bg-white/80 backdrop-blur-sm">
        <div className="w-full relative h-full flex flex-col justify-end">
           <div className="absolute bottom-0 left-0 w-full h-[6mm] flex">
             <div className="w-1/4 h-full bg-yellow-400" />
             <div className="w-3/4 h-full bg-slate-900" />
           </div>
           
           <div className="px-[20mm] pb-[10mm] flex justify-between items-end relative z-10 w-full">
              <div className="flex flex-col gap-1 text-slate-500">
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-800">{branding?.company_name || 'ELLEVEN'}</span>
                {branding?.cnpj && <span className="text-[8px] font-medium tracking-[0.1em]">CNPJ: {branding.cnpj}</span>}
                {branding?.address && <span className="text-[8px] font-medium tracking-[0.1em]">{branding.address}</span>}
              </div>
              <div className="flex flex-col gap-1 text-right items-end text-slate-500">
                <span className="text-[9px] font-medium text-slate-600 mb-1">
                  Gerado em: {new Date().toLocaleDateString('pt-BR')}
                </span>
                {branding?.phone && <span className="text-[8px] font-medium tracking-[0.1em]">{branding.phone}</span>}
                {branding?.instagram && <span className="text-[8px] font-medium tracking-[0.1em]">{branding.instagram}</span>}
                {branding?.website && <span className="text-[8px] font-medium tracking-[0.1em]">{branding.website}</span>}
                {branding?.linkedin && <span className="text-[8px] font-medium tracking-[0.1em]">{branding.linkedin}</span>}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

