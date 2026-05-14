import React, { useMemo } from 'react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Cell
} from 'recharts';
import { Activity, Box, CheckCircle, CircleDashed, Filter, Target, AlertTriangle, PlayCircle, AlignRight } from 'lucide-react';
import { translateKey } from '../lib/translations';

interface AssessmentVisualizerProps {
  data: any;
  type: string;
  language: string;
  selectedAssessment: any;
  isExporting?: boolean;
}

// Ignore these keys when parsing as they are usually handled by the main modal or are metadata
const IGNORED_KEYS = ['classification', 'classification_color', 'alerts', 'score', 'athlete_id', 'id', 'created_at', 'assessment_date', 'clinical_report', 'clinical_alerts', 'notes'];

const CustomAxisTick = (props: any) => {
  const { x, y, payload } = props;
  const parts = payload.value.split(' ');
  let lines = [payload.value];
  if (parts.length === 2) lines = parts;
  else if (parts.length === 3) lines = [parts[0], `${parts[1]} ${parts[2]}`];
  else if (parts.length > 3) {
    const mid = Math.ceil(parts.length / 2);
    lines = [parts.slice(0, mid).join(' '), parts.slice(mid).join(' ')];
  }

  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={16} textAnchor="end" fill="#64748b" fontSize={10} fontWeight={700} transform="rotate(-45)">
        {lines.map((line, index) => (
          <tspan x="0" dy={index === 0 ? 0 : 12} key={index}>{line.toUpperCase()}</tspan>
        ))}
      </text>
    </g>
  );
};

const RadarCustomTick = (props: any) => {
  const { payload, x, y, textAnchor, isExporting } = props;
  const parts = payload.value.split(' ');
  let lines = [payload.value];
  if (parts.length === 2) lines = parts;
  else if (parts.length === 3) lines = [parts[0], `${parts[1]} ${parts[2]}`];
  else if (parts.length > 3) {
    const mid = Math.ceil(parts.length / 2);
    lines = [parts.slice(0, mid).join(' '), parts.slice(mid).join(' ')];
  }

  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={0} textAnchor={textAnchor} fill={isExporting ? "#475569" : "#94a3b8"} fontSize={isExporting ? 11 : 10} fontWeight={700}>
        {lines.map((line, index) => (
          <tspan x="0" dy={index === 0 ? 0 : 12} key={index}>{line.toUpperCase()}</tspan>
        ))}
      </text>
    </g>
  );
};

export function AssessmentVisualizer({ data, type, language, selectedAssessment, isExporting = false }: AssessmentVisualizerProps) {
  
  const { numericMetrics, nestedNumericGroups, textMetrics, booleanMetrics, arrayMetrics } = useMemo(() => {
    let numMet: { name: string; value: number; originalKey: string }[] = [];
    let nestedGroups: { name: string; originalKey: string; data: { subject: string, value: number, fullMark: number }[] }[] = [];
    let txtMet: { name: string; value: string }[] = [];
    let boolMet: { name: string; value: boolean }[] = [];
    let arrMet: { name: string; value: any[] }[] = [];

    const processObject = (obj: any, prefix = '') => {
      for (const [k, v] of Object.entries(obj)) {
        if (IGNORED_KEYS.includes(k) && prefix === '') continue;
        if (v === null || v === undefined) continue;

        const niceName = translateKey(k, language);

        if (typeof v === 'number') {
          numMet.push({ name: niceName, value: v, originalKey: k });
        } else if (typeof v === 'boolean') {
          boolMet.push({ name: niceName, value: v });
        } else if (typeof v === 'string') {
          if (!isNaN(Number(v)) && v.trim() !== '') {
             numMet.push({ name: niceName, value: Number(v), originalKey: k });
          } else {
             txtMet.push({ name: niceName, value: v });
          }
        } else if (Array.isArray(v)) {
          arrMet.push({ name: niceName, value: v });
        } else if (typeof v === 'object') {
          const subEntries = Object.entries(v).filter(([_, subV]) => typeof subV === 'number' || (typeof subV === 'string' && !isNaN(Number(subV))));
          const totalEntries = Object.keys(v).length;
          
          if (subEntries.length > 2 && subEntries.length === totalEntries) {
            const groupData = subEntries.map(([subK, subV]) => {
                const val = Number(subV);
                let max = 10;
                if (val > 10) max = 100;
                if (val > 100) max = 1000;
                
                return {
                    subject: translateKey(subK, language).substring(0, 15),
                    value: val,
                    fullMark: max
                };
            });
            nestedGroups.push({ name: niceName, data: groupData, originalKey: k });
          } else {
            processObject(v, prefix ? `${prefix} - ${niceName}` : niceName);
          }
        }
      }
    };

    if (data && typeof data === 'object') {
      processObject(data);
    }

    return { numericMetrics: numMet, nestedNumericGroups: nestedGroups, textMetrics: txtMet, booleanMetrics: boolMet, arrayMetrics: arrMet };
  }, [data, language]);

  if (!data) return null;

  const COLORS = ['#0ea5e9', '#10b981', '#f59e0b', '#f43f5e', '#8b5cf6'];

  const containerClass = isExporting ? "bg-white border-slate-200 rounded-2xl p-8 break-inside-avoid" : "bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-cyan-500/30 transition-all duration-300";
  const titleClass = isExporting ? "text-sm font-black text-slate-800 uppercase tracking-widest mb-8 flex items-center gap-2" : "text-sm font-black text-white uppercase tracking-widest mb-6 flex items-center gap-2";

  const formatMetricName = (name: string) => {
    const parts = name.split(' ');
    if (parts.length === 1) return name;
    if (parts.length === 3) return <>{parts[0]}<br/>{parts[1]} {parts[2]}</>;
    if (parts.length > 3) {
      const mid = Math.ceil(parts.length / 2);
      return <>{parts.slice(0, mid).join(' ')}<br/>{parts.slice(mid).join(' ')}</>;
    }
    return <>{parts[0]}<br/>{parts[1]}</>;
  };

  // tick components moved out

  return (
    <div className={isExporting ? "space-y-8" : "space-y-8 mt-6"}>
      
      {/* Nested Numeric Groups (Rendered as Radar Charts) */}
      {nestedNumericGroups.length > 0 && (
        <div data-pdf-block={isExporting ? "true" : undefined} className={isExporting ? "grid grid-cols-2 gap-4" : "grid grid-cols-1 lg:grid-cols-2 gap-6"}>
          {nestedNumericGroups.map((group, idx) => (
            <div key={idx} className={containerClass}>
              {!isExporting && (
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Target className="w-24 h-24 text-cyan-500" />
                </div>
              )}
              <h5 className={titleClass}>
                <Activity className={`w-5 h-5 ${isExporting ? 'text-slate-600' : 'text-cyan-500'}`} />
                {group.name}
              </h5>
              <div className="h-[250px] w-full -ml-4 flex items-center justify-center">
                {isExporting ? (
                  <RadarChart width={320} height={250} cx="50%" cy="50%" outerRadius="70%" data={group.data}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={(props: any) => <RadarCustomTick {...props} isExporting={true} />} />
                    <Radar
                      name={group.name}
                      dataKey="value"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.3}
                      isAnimationActive={false}
                    />
                  </RadarChart>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={group.data}>
                      <PolarGrid stroke="#334155" />
                      <PolarAngleAxis dataKey="subject" tick={(props: any) => <RadarCustomTick {...props} isExporting={false} />} />
                      <Radar
                        name={group.name}
                        dataKey="value"
                        stroke="#06b6d4"
                        fill="#06b6d4"
                        fillOpacity={0.3}
                      />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', fontWeight: 'bold' }}
                        itemStyle={{ color: '#06b6d4' }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bar Chart for loose Numeric Metrics (if > 3 items) */}
      {numericMetrics.length >= 3 && (
        <div data-pdf-block={isExporting ? "true" : undefined} className={containerClass}>
            <h5 className={titleClass}>
                <Filter className={`w-5 h-5 ${isExporting ? 'text-slate-600' : 'text-cyan-500'}`} />
                {language === 'pt' ? 'Métricas' : 'Metrics'}
            </h5>
            <div className="h-[250px] w-full flex items-center justify-center">
            {isExporting ? (
                <BarChart width={700} height={250} data={numericMetrics} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                    dataKey="name" 
                    tick={(props: any) => <CustomAxisTick {...props} />} 
                    axisLine={false} 
                    tickLine={false}
                    height={60}
                />
                <YAxis tick={{ fill: "#64748b", fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40} isAnimationActive={false}>
                    {numericMetrics.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Bar>
                </BarChart>
            ) : (
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={numericMetrics} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                    dataKey="name" 
                    tick={(props: any) => <CustomAxisTick {...props} />} 
                    axisLine={false} 
                    tickLine={false}
                    height={60}
                />
                <YAxis tick={{ fill: "#64748b", fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', fontWeight: 'bold' }}
                    cursor={{ fill: '#1e293b', opacity: 0.4 }}
                  />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
                    {numericMetrics.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Bar>
                </BarChart>
                </ResponsiveContainer>
            )}
            </div>
        </div>
      )}

      {/* Grid for loosely numeric metrics if < 3 items or to supplement */}
      {numericMetrics.length > 0 && (
        <div data-pdf-block={isExporting ? "true" : undefined} className={isExporting ? "flex flex-wrap gap-4" : "grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3"}>
          {numericMetrics.map((metric, i) => (
            <div key={i} className={isExporting ? "bg-slate-50 border border-slate-200 p-4 rounded-xl min-w-[120px]" : "bg-slate-900/50 border border-slate-800/80 p-3 rounded-xl flex flex-col justify-between hover:border-cyan-500/30 transition-colors"}>
              <p className={isExporting ? "text-[9px] font-black leading-[1.2] text-slate-500 uppercase tracking-widest mb-1.5" : "text-[10px] font-black leading-[1.2] text-slate-500 uppercase tracking-widest mb-1.5 min-h-[24px]"} title={metric.name}>{formatMetricName(metric.name)}</p>
              <div className="flex items-baseline gap-1.5">
                <p className={isExporting ? "text-base font-black text-slate-800 uppercase" : "text-xl font-black text-white"}>{metric.value}</p>
                {!isExporting && <span className="text-[9px] font-bold text-slate-400 uppercase">Val</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Discrete text metrics */}
      {textMetrics.length > 0 && (
        <div data-pdf-block={isExporting ? "true" : undefined} className={containerClass}>
            <h5 className={titleClass}>
                <AlignRight className={`w-5 h-5 ${isExporting ? 'text-slate-600' : 'text-emerald-500'}`} />
                {language === 'pt' ? 'Dados Qualitativos' : 'Qualitative Data'}
            </h5>
            <div className={isExporting ? "flex flex-wrap gap-4" : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"}>
                {textMetrics.map((metric, i) => (
                    <div key={i} className={isExporting ? "bg-slate-50 border border-slate-200 p-4 rounded-xl min-w-[150px] flex-1" : "bg-slate-900 border border-slate-800 p-3 rounded-xl"}>
                        <p className={isExporting ? "text-[9px] font-black leading-[1.2] text-slate-500 uppercase tracking-widest mb-1.5" : "text-[10px] font-black leading-[1.2] text-slate-500 uppercase tracking-widest mb-1.5 min-h-[24px]"} title={metric.name}>{formatMetricName(metric.name)}</p>
                        <p className={isExporting ? "text-sm font-semibold text-slate-800" : "text-sm font-semibold text-slate-200 truncate"} title={String(metric.value)}>{
                          typeof metric.value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(metric.value) 
                            ? new Date(metric.value).toLocaleDateString(language === 'pt' ? 'pt-BR' : 'en-US') 
                            : metric.value
                        }</p>
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* Boolean Metrics */}
      {booleanMetrics.length > 0 && (
        <div data-pdf-block={isExporting ? "true" : undefined} className={containerClass}>
            <h5 className={titleClass}>
                <CheckCircle className={`w-5 h-5 ${isExporting ? 'text-slate-600' : 'text-amber-500'}`} />
                {language === 'pt' ? 'Indicadores Binários' : 'Boolean Indicators'}
            </h5>
            <div className="flex flex-wrap gap-3">
                {booleanMetrics.map((metric, i) => (
                    <div key={i} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${metric.value ? (isExporting ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400') : (isExporting ? 'bg-white border-slate-100 text-slate-400' : 'bg-slate-800/30 border-slate-700 text-slate-500')}`}>
                        {metric.value ? <CheckCircle className={`w-3.5 h-3.5 ${isExporting ? 'text-slate-700' : ''}`} /> : <CircleDashed className={`w-3.5 h-3.5 ${isExporting ? 'text-slate-300' : ''}`} />}
                        <span className="text-[11px] font-bold uppercase tracking-wide">{metric.name}</span>
                    </div>
                ))}
            </div>
        </div>
      )}

      {/* Array Metrics */}
      {arrayMetrics.length > 0 && (
        <div data-pdf-block={isExporting ? "true" : undefined} className="space-y-4">
          {arrayMetrics.map((arr, i) => {
            if (!arr.value || arr.value.length === 0) return null;
            return (
              <div key={i} className={containerClass}>
                <h5 className={titleClass}>
                  <Box className={`w-5 h-5 ${isExporting ? 'text-slate-600' : 'text-indigo-500'}`} />
                  {arr.name}
                </h5>
                <div className="flex flex-wrap gap-2">
                  {arr.value.map((item, j) => (
                    <div key={j} className={isExporting ? "bg-slate-50 border border-slate-200 p-3 rounded-xl flex flex-col gap-1.5" : "bg-slate-900 border border-slate-800 p-3 rounded-xl flex flex-col gap-1.5"}>
                      {typeof item === 'object' && item !== null ? (
                        Object.entries(item).map(([k, val]) => (
                          <div key={k} className="flex flex-col">
                            <span className={isExporting ? "text-[9px] font-black leading-[1.2] text-slate-500 uppercase tracking-widest" : "text-[9px] font-black leading-[1.2] text-slate-500 uppercase tracking-widest"}>
                              {translateKey(k, language)}
                            </span>
                            <span className={isExporting ? "text-xs font-semibold text-slate-800" : "text-xs font-bold text-slate-300"}>
                              {Array.isArray(val) ? val.join(', ') : typeof val === 'boolean' ? (val ? 'Sim' : 'Não') : String(val)}
                            </span>
                          </div>
                        ))
                      ) : (
                        <span className={isExporting ? "px-3 py-1.5 text-[11px] font-bold text-slate-700 uppercase tracking-widest" : "px-3 py-1.5 text-[11px] font-bold text-slate-300 uppercase tracking-widest"}>
                          {String(item)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
