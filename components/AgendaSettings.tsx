"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Clock, 
  Calendar, 
  Plus, 
  Trash2, 
  CheckCircle, 
  Loader2, 
  AlertCircle,
  Timer,
  MessageCircle,
  ShieldAlert,
  Ban,
  Palette,
  Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AgendaSettings() {
  const [duration, setDuration] = useState(30);
  const [breakInterval, setBreakInterval] = useState(0);
  const [appointmentTypes, setAppointmentTypes] = useState<string[]>([]);
  const [newType, setNewType] = useState('');
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [newBlockedDate, setNewBlockedDate] = useState('');
  const [delayTolerance, setDelayTolerance] = useState(15);
  const [cancelNotice, setCancelNotice] = useState(24);
  const [appointmentColors, setAppointmentColors] = useState<Record<string, string>>({});
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const weekDays = [
    { value: '1', label: 'Seg' },
    { value: '2', label: 'Ter' },
    { value: '3', label: 'Qua' },
    { value: '4', label: 'Qui' },
    { value: '5', label: 'Sex' },
    { value: '6', label: 'Sáb' },
    { value: '0', label: 'Dom' },
  ];

  type DaySchedule = {
    enabled: boolean;
    start: string;
    end: string;
    lunchEnabled: boolean;
    lunchStart: string;
    lunchEnd: string;
  };

  const defaultDay: DaySchedule = {
    enabled: false, start: '08:00', end: '18:00', lunchEnabled: true, lunchStart: '12:00', lunchEnd: '13:00'
  };

  const [daySchedules, setDaySchedules] = useState<Record<string, DaySchedule>>({
    '0': { ...defaultDay },
    '1': { ...defaultDay, enabled: true },
    '2': { ...defaultDay, enabled: true },
    '3': { ...defaultDay, enabled: true },
    '4': { ...defaultDay, enabled: true },
    '5': { ...defaultDay, enabled: true },
    '6': { ...defaultDay },
  });
  
  const [selectedDay, setSelectedDay] = useState<string>('1');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    if (!supabase) return;
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('agenda_settings')
        .select('*')
        .maybeSingle();
      
      if (error) {
        console.error("AGENDA SETTINGS FETCH ERROR:", {
          message: error?.message,
          code: error?.code,
          details: error?.details,
          hint: error?.hint,
          full: error
        });

        // If table doesn't exist, we don't throw but we can log it
        if (error.message?.includes('relation "agenda_settings" does not exist')) {
          console.warn('Agenda settings table not found. Please run the database seeder.');
          return; // Exit early, use default state
        } else {
          throw error;
        }
      }
      
      if (data) {
        if (data.day_schedules && typeof data.day_schedules === 'object' && Object.keys(data.day_schedules).length > 0) {
          setDaySchedules(data.day_schedules);
        } else {
          // migrate from old structure
          const newScheds = { ...daySchedules };
          for (let i = 0; i <= 6; i++) {
            newScheds[i.toString()] = {
              enabled: (data.working_days || []).includes(i.toString()),
              start: data.start_time || '08:00',
              end: data.end_time || '18:00',
              lunchEnabled: data.lunch_enabled ?? true,
              lunchStart: data.lunch_start || '12:00',
              lunchEnd: data.lunch_end || '13:00',
            };
          }
          setDaySchedules(newScheds);
        }

        setDuration(data.default_duration_minutes || 30);
        setBreakInterval(data.break_interval_minutes || 0);
        setAppointmentTypes(data.appointment_types || []);
        let loadedDates = data.blocked_dates || [];
        const currentYear = new Date().getFullYear();
        const getNationalHolidays = (year: number) => [
          `${year}-01-01`, `${year}-04-21`, `${year}-05-01`, `${year}-09-07`, 
          `${year}-10-12`, `${year}-11-02`, `${year}-11-15`, `${year}-11-20`, `${year}-12-25`
        ];
        const autoHolidays = getNationalHolidays(currentYear);
        const newDates = autoHolidays.filter(d => !loadedDates.includes(d));
        if (newDates.length > 0) {
          loadedDates = [...loadedDates, ...newDates].sort();
        }
        setBlockedDates(loadedDates);

        if (data.delay_tolerance_minutes !== undefined) setDelayTolerance(data.delay_tolerance_minutes);
        if (data.cancellation_notice_hours !== undefined) setCancelNotice(data.cancellation_notice_hours);
        
        // Robust color loading
        if (data.appointment_colors && typeof data.appointment_colors === 'object') {
          setAppointmentColors(data.appointment_colors);
        } else {
          setAppointmentColors({});
        }
      }
    } catch (err: any) {
      console.error("AGENDA SETTINGS CATCH ERROR:", {
        message: err?.message,
        code: err?.code,
        details: err?.details,
        hint: err?.hint,
        full: err
      });
      setStatus('error');
      const errorMessage = err.message || (typeof err === 'object' ? JSON.stringify(err) : String(err));
      
      if (errorMessage.includes('column') && errorMessage.includes('schema cache')) {
        setMessage('O Supabase ainda não reconheceu as novas colunas. Por favor, vá em Configurações > Desenvolvimento e clique em "Otimizar Banco (Auto-Fix)" e aguarde alguns segundos.');
      } else {
        setMessage(`Erro ao carregar: ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!supabase) return;
    setIsSaving(true);
    setStatus('idle');

    try {
      // 1. Check for existing record
      const { data: existing, error: selectError } = await supabase
        .from('agenda_settings')
        .select('id')
        .maybeSingle(); // maybeSingle is safer than single() when 0 or 1 rows are expected

      if (selectError) {
        console.error("AGENDA SETTINGS SAVE SELECT ERROR:", {
          message: selectError?.message,
          code: selectError?.code,
          details: selectError?.details,
          hint: selectError?.hint,
          full: selectError
        });

        if (selectError.message?.includes('relation "agenda_settings" does not exist')) {
          throw new Error('A tabela "agenda_settings" não foi encontrada. Por favor, vá em Configurações > Desenvolvimento e clique em "Otimizar Banco (Auto-Fix)" para criar a estrutura necessária.');
        }
        throw selectError;
      }

      const firstEnabledDay = Object.values(daySchedules).find(d => d.enabled) || daySchedules['1'];
      
      const payload = {
        start_time: firstEnabledDay.start,
        end_time: firstEnabledDay.end,
        default_duration_minutes: duration,
        break_interval_minutes: breakInterval,
        lunch_start: firstEnabledDay.lunchStart,
        lunch_end: firstEnabledDay.lunchEnd,
        lunch_enabled: firstEnabledDay.lunchEnabled,
        working_days: Object.entries(daySchedules).filter(([_, d]) => d.enabled).map(([dayId]) => dayId),
        day_schedules: daySchedules,
        appointment_types: appointmentTypes,
        blocked_dates: blockedDates,
        delay_tolerance_minutes: delayTolerance,
        cancellation_notice_hours: cancelNotice,
        appointment_colors: appointmentColors,
        updated_at: new Date().toISOString()
      };

      let result;
      if (existing) {
        result = await supabase
          .from('agenda_settings')
          .update(payload)
          .eq('id', existing.id);
      } else {
        result = await supabase
          .from('agenda_settings')
          .insert([payload]);
      }
      
      let error = result.error;

      // Fallback robusto se colunas novas estiverem faltando
      if (error && (error.code === '42703' || error.message?.includes('column'))) {
        console.warn("Detectadas colunas ausentes no banco. Tentando salvamento simplificado (Legacy Mode)...");
        const { 
          lunch_start, lunch_end, lunch_enabled, 
          delay_tolerance_minutes, cancellation_notice_hours, 
          ...legacyPayload 
        } = payload;
        
        if (existing) {
          result = await supabase
            .from('agenda_settings')
            .update(legacyPayload)
            .eq('id', existing.id);
        } else {
          result = await supabase
            .from('agenda_settings')
            .insert([legacyPayload]);
        }
        error = result.error;
      }

      if (error) {
        console.error("AGENDA SETTINGS SAVE OPERATION ERROR:", {
          message: error?.message,
          code: error?.code,
          details: error?.details,
          hint: error?.hint,
          full: error
        });
        throw error;
      }

      setStatus('success');
      setMessage('Configurações sincronizadas ao núcleo operacional.');
    } catch (err: any) {
      console.error("AGENDA SETTINGS SAVE CATCH ERROR:", {
        message: err?.message,
        code: err?.code,
        details: err?.details,
        hint: err?.hint,
        full: err
      });
      setStatus('error');
      
      // Handle Supabase error objects which might not have a direct .message property in all cases
      const errorMessage = err.message || (typeof err === 'object' ? JSON.stringify(err) : String(err));
      setMessage(language === 'pt' 
        ? `Erro ao salvar: ${errorMessage}. DICA: Vá em Configurações > Aba Desenvolvimento e clique em 'Otimizar Banco'.` 
        : `Save error: ${errorMessage}. TIP: Go to Settings > Development and click 'Optimize DB'.`);
    } finally {
      setIsSaving(false);
    }
  };

  const addType = () => {
    if (newType.trim() && !appointmentTypes.includes(newType.trim())) {
      setAppointmentTypes([...appointmentTypes, newType.trim()]);
      setNewType('');
    }
  };

  const removeType = (typeToRemove: string) => {
    setAppointmentTypes(appointmentTypes.filter(t => t !== typeToRemove));
  };

  const getNationalHolidays = (year: number) => {
    return [
      `${year}-01-01`, // Confraternização Universal
      `${year}-04-21`, // Tiradentes
      `${year}-05-01`, // Dia do Trabalho
      `${year}-09-07`, // Independência
      `${year}-10-12`, // Nossa Senhora Aparecida
      `${year}-11-02`, // Finados
      `${year}-11-15`, // Proclamação da República
      `${year}-11-20`, // Dia Nacional de Zumbi e da Consciência Negra
      `${year}-12-25`  // Natal
    ];
  };

  const addNationalHolidays = () => {
    const currentYear = new Date().getFullYear();
    const holidays = [
      ...getNationalHolidays(currentYear),
      ...getNationalHolidays(currentYear + 1)
    ];
    
    const newDates = holidays.filter(d => !blockedDates.includes(d));
    if (newDates.length > 0) {
      setBlockedDates([...blockedDates, ...newDates].sort());
    }
  };

  const getMinutes = (timeStr: string) => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return (h * 60) + m;
  };

  const updateDaySchedule = (field: keyof DaySchedule, value: string | boolean) => {
    setDaySchedules(prev => ({
      ...prev,
      [selectedDay]: {
        ...prev[selectedDay],
        [field]: value
      }
    }));
  };

  const activeSchedule = daySchedules[selectedDay];
  
  const startMin = getMinutes(activeSchedule.start);
  const endMin = getMinutes(activeSchedule.end);
  const lunchStartMin = activeSchedule.lunchEnabled ? getMinutes(activeSchedule.lunchStart) : 0;
  const lunchEndMin = activeSchedule.lunchEnabled ? getMinutes(activeSchedule.lunchEnd) : 0;

  const hasConflict = activeSchedule.lunchEnabled 
    ? (startMin >= endMin || lunchStartMin >= lunchEndMin || lunchStartMin < startMin || lunchEndMin > endMin)
    : (startMin >= endMin);

  const totalMin = endMin - startMin;
  const p1 = totalMin > 0 ? (activeSchedule.lunchEnabled ? Math.max(0, ((lunchStartMin - startMin) / totalMin)) * 100 : 100) : 0;
  const pLunch = (totalMin > 0 && activeSchedule.lunchEnabled) ? Math.max(0, ((lunchEndMin - lunchStartMin) / totalMin)) * 100 : 0;
  const p2 = (totalMin > 0 && activeSchedule.lunchEnabled) ? Math.max(0, ((endMin - lunchEndMin) / totalMin)) * 100 : 0;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-8">
        <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 pb-32">
        {/* Horários */}
        <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl space-y-6 lg:row-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-cyan-500/10 text-cyan-400 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <h3 className="text-sm md:text-base font-black text-white uppercase tracking-tight">Janela Operacional</h3>
                <p className="text-[10px] md:text-xs text-slate-500 font-medium">Configure seu expediente diário</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 pt-2 mb-6">
            {weekDays.map(day => {
              const isActive = daySchedules[day.value]?.enabled;
              const isSelected = selectedDay === day.value;
              return (
                <button
                  key={day.value}
                  onClick={() => setSelectedDay(day.value)}
                  className={`relative overflow-hidden flex items-center justify-center h-10 lg:h-12 px-3 min-w-[2.5rem] flex-1 sm:flex-none rounded-xl text-xs md:text-sm font-black tracking-wider uppercase transition-all duration-300 ${
                    isSelected
                      ? 'bg-cyan-500 text-[#050B14] shadow-[0_0_15px_rgba(6,182,212,0.3)] scale-[1.02]'
                      : isActive
                        ? 'bg-slate-800/80 border border-cyan-500/30 text-cyan-400'
                        : 'bg-slate-950 border border-slate-800 text-slate-600 hover:border-slate-700 hover:text-slate-400'
                  }`}
                >
                  <span className="relative z-10">{day.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl mb-6">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white uppercase tracking-widest">{weekDays.find(d => d.value === selectedDay)?.label}</span>
              <span className="text-[10px] md:text-xs text-slate-500 font-medium">Status de operação</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={activeSchedule.enabled}
                onChange={(e) => updateDaySchedule('enabled', e.target.checked)}
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
            </label>
          </div>

          {!activeSchedule.enabled ? (
            <div className="py-12 border border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center opacity-70">
              <Ban className="w-12 h-12 text-slate-700 mb-3" />
              <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Dia Inativo</p>
              <p className="text-xs text-slate-600 mt-1">Nenhum agendamento será permitido</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row gap-6 md:gap-8 animate-in fade-in slide-in-from-bottom-2">
                <div className="space-y-3 flex-1">
                  <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Início</label>
                  <input 
                    type="time" 
                    value={activeSchedule.start}
                    onChange={(e) => updateDaySchedule('start', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 outline-none transition-all text-sm md:text-base font-medium"
                  />
                </div>
                <div className="space-y-3 flex-1">
                  <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Término</label>
                  <input 
                    type="time" 
                    value={activeSchedule.end}
                    onChange={(e) => updateDaySchedule('end', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 outline-none transition-all text-sm md:text-base font-medium"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-slate-800/50 mt-6 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center justify-between pl-1">
                  <label className="text-[10px] md:text-xs font-black text-amber-500 uppercase tracking-widest">Horário de Almoço</label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={activeSchedule.lunchEnabled}
                      onChange={(e) => updateDaySchedule('lunchEnabled', e.target.checked)}
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>
                
                <div className={`flex flex-col sm:flex-row gap-6 md:gap-8 transition-opacity duration-300 ${activeSchedule.lunchEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                  <div className="space-y-3 flex-1">
                    <label className="text-[10px] md:text-xs font-black text-amber-500/70 uppercase tracking-widest pl-1">Início Almoço</label>
                    <input 
                      type="time" 
                      value={activeSchedule.lunchStart}
                      onChange={(e) => updateDaySchedule('lunchStart', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 outline-none transition-all text-sm md:text-base font-medium"
                    />
                  </div>
                  <div className="space-y-3 flex-1">
                    <label className="text-[10px] md:text-xs font-black text-amber-500/70 uppercase tracking-widest pl-1">Fim Almoço</label>
                    <input 
                      type="time" 
                      value={activeSchedule.lunchEnd}
                      onChange={(e) => updateDaySchedule('lunchEnd', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 outline-none transition-all text-sm md:text-base font-medium"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-6 pt-6 border-t border-slate-800/50 animate-in fade-in slide-in-from-bottom-2">
                <div className="space-y-3 w-full">
                  <div className="flex items-center gap-2 mb-2 pl-1">
                    <Timer className="text-cyan-500 w-3 h-3 md:w-4 md:h-4" />
                    <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">Duração Padrão</label>
                  </div>
                  <div className="relative">
                    <div className="flex items-center justify-between px-2 mb-3">
                      <span className="text-2xl font-black text-white">{duration}</span>
                      <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase">min</span>
                    </div>
                    <input 
                      type="range"
                      min={15} max={120} step={15}
                      value={duration}
                      onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                  </div>
                </div>
                <div className="space-y-3 w-full">
                  <div className="flex items-center gap-2 mb-2 pl-1">
                    <Timer className="text-amber-500 w-3 h-3 md:w-4 md:h-4" />
                    <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">Intervalo</label>
                  </div>
                  <div className="relative">
                    <div className="flex items-center justify-between px-2 mb-3">
                      <span className="text-2xl font-black text-white">{breakInterval}</span>
                      <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase">min</span>
                    </div>
                    <input 
                      type="range"
                      min={0} max={60} step={5}
                      value={breakInterval}
                      onChange={(e) => setBreakInterval(parseInt(e.target.value) || 0)}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                  </div>
                </div>
              </div>
              
              {/* Timeline Visual */}
              {!hasConflict && totalMin > 0 ? (
                <div className="pt-8 mt-2 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono mb-2">
                    <span>{activeSchedule.start}</span>
                    <span>{activeSchedule.end}</span>
                  </div>
                  <div className="h-2 w-full flex rounded-full overflow-hidden bg-slate-800 shadow-inner">
                    <div className="h-full bg-cyan-500 transition-all duration-500" style={{ width: `${p1}%` }}></div>
                    {activeSchedule.lunchEnabled && <div className="h-full bg-slate-700 opacity-50" style={{ width: `${pLunch}%` }}></div>}
                    {activeSchedule.lunchEnabled && <div className="h-full bg-cyan-500 transition-all duration-500" style={{ width: `${p2}%` }}></div>}
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-2">
                    <span>Turno 1</span>
                    {activeSchedule.lunchEnabled && <span className="text-slate-500">Intervalo {activeSchedule.lunchStart} - {activeSchedule.lunchEnd}</span>}
                    {activeSchedule.lunchEnabled && <span>Turno 2</span>}
                  </div>
                </div>
              ) : (
                <div className="pt-4 mt-4 border-t border-slate-800/50 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-center justify-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400">
                    <AlertCircle size={16} className="shrink-0" />
                    <span className="text-xs font-bold uppercase tracking-widest leading-tight">Conflito Operacional Detectado</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Tipos de Atendimento */}
        <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl space-y-6">
          <div className="flex items-center gap-3 md:gap-4 mb-2">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-500/10 text-indigo-400 rounded-xl md:rounded-2xl flex items-center justify-center">
              <Calendar className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-black text-white uppercase tracking-tight">Protocolos de Sessão</h3>
              <p className="text-[10px] md:text-xs text-slate-500 font-medium">Categorias operacionais para agendamento</p>
            </div>
          </div>

          <div className="flex gap-2">
            <input 
              type="text" 
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addType()}
              placeholder="Novo tipo de consulta..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 outline-none transition-all text-sm md:text-base font-medium placeholder:text-slate-600"
            />
            <Button 
              onClick={addType}
              className="bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl px-4 py-3 h-auto"
            >
              <Plus size={20} />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {appointmentTypes.map((type) => (
              <div 
                key={type}
                className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 hover:border-slate-700 transition-colors group"
              >
                <div 
                  className="w-3 h-3 rounded-full cursor-pointer relative shadow-[0_0_8px_rgba(0,0,0,0.5)] shrink-0"
                  style={{ backgroundColor: appointmentColors[type] || '#3b82f6', boxShadow: `0 0 10px ${appointmentColors[type] || '#3b82f6'}40` }}
                >
                  <input
                    type="color"
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full block"
                    value={appointmentColors[type] || '#3b82f6'}
                    onChange={(e) => setAppointmentColors(prev => ({ ...prev, [type]: e.target.value }))}
                    title="Alterar cor"
                  />
                </div>
                <span className="text-xs md:text-sm font-bold text-slate-300 tracking-wide uppercase px-1">{type}</span>
                <button 
                  onClick={() => removeType(type)}
                  className="text-slate-600 hover:text-rose-500 transition-colors bg-slate-900 group-hover:bg-rose-500/10 p-1.5 rounded-lg ml-2"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {appointmentTypes.length === 0 && (
              <div className="w-full text-center py-6 border border-dashed border-slate-800 rounded-xl">
                <p className="text-[10px] md:text-xs text-slate-500 font-medium">Nenhum tipo cadastrado.<br/>Adicione acima para começar.</p>
              </div>
            )}
          </div>
        </div>

        {/* Feriados e Bloqueios */}
        <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl space-y-6">
          <div className="flex items-center gap-3 md:gap-4 mb-2">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-rose-500/10 text-rose-400 rounded-xl md:rounded-2xl flex items-center justify-center">
              <Ban className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm md:text-base font-black text-white uppercase tracking-tight">Bloqueios Operacionais</h3>
              <p className="text-[10px] md:text-xs text-slate-500 font-medium">Feriados e ausências programadas</p>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <input 
              type="date" 
              value={newBlockedDate}
              onChange={(e) => setNewBlockedDate(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-rose-500/50 focus:ring-2 focus:ring-rose-500/10 outline-none transition-all text-sm font-medium [color-scheme:dark]"
            />
            <Button 
              onClick={() => {
                if (newBlockedDate && !blockedDates.includes(newBlockedDate)) {
                  setBlockedDates([...blockedDates, newBlockedDate].sort());
                  setNewBlockedDate('');
                }
              }}
              className="bg-rose-500 hover:bg-rose-400 text-white rounded-xl px-4 py-3 h-auto"
            >
              <Plus size={20} />
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 pt-2">
            {blockedDates.map((date) => (
              <div 
                key={date}
                className="flex items-center justify-between gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 group hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3 text-rose-500/70" />
                  <span className="text-xs md:text-sm font-bold text-slate-300">
                    {new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  </span>
                </div>
                <button 
                  onClick={() => setBlockedDates(blockedDates.filter(d => d !== date))}
                  className="text-slate-600 hover:text-rose-500 transition-colors bg-slate-900 group-hover:bg-rose-500/10 p-1 rounded-lg"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {blockedDates.length === 0 && (
              <div className="col-span-full w-full text-center py-8 border border-dashed border-slate-800 rounded-xl text-slate-500">
                <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">A agenda está limpa</span>
              </div>
            )}
          </div>
        </div>

        {/* Políticas de Atendimento */}
        <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl space-y-6 lg:col-span-2">
          <div className="flex items-center gap-3 md:gap-4 mb-2">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-500/10 text-amber-500 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-black text-white uppercase tracking-tight">Diretrizes Operacionais</h3>
              <p className="text-[10px] md:text-xs text-slate-500 font-medium">Tolerância de atrasos e aviso prévio</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 pt-2">
            <div className="space-y-4">
              <label className="text-[10px] md:text-xs font-black text-amber-500 uppercase tracking-widest pl-1">Aviso Prévio (Cancelamento)</label>
              <div className="relative pt-2">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-2xl font-black text-white">{cancelNotice}</span>
                  <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase pb-1">horas</span>
                </div>
                <input 
                  type="range"
                  min={1} max={72} step={1}
                  value={cancelNotice}
                  onChange={(e) => setCancelNotice(parseInt(e.target.value) || 0)}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>
              <p className="text-[10px] md:text-xs text-slate-500 font-medium pl-1">Tempo exigido para reagendamentos gratuitos.</p>
            </div>
            
            <div className="space-y-4">
              <label className="text-[10px] md:text-xs font-black text-amber-500 uppercase tracking-widest pl-1">Tolerância de Atraso</label>
              <div className="relative pt-2">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-2xl font-black text-white">{delayTolerance}</span>
                  <span className="text-[10px] md:text-xs font-bold text-slate-500 uppercase pb-1">min</span>
                </div>
                <input 
                  type="range" 
                  min={0} max={30} step={5}
                  value={delayTolerance}
                  onChange={(e) => setDelayTolerance(parseInt(e.target.value) || 0)}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>
              <p className="text-[10px] md:text-xs text-slate-500 font-medium pl-1">Tolerância máxima de chegada na recepção.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#050B14]/80 backdrop-blur-xl border-t border-slate-800 p-4 md:p-6 lg:pl-72 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1 w-full max-w-2xl">
          {status !== 'idle' && (
            <div className={`p-3 md:p-4 rounded-xl border flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 ${
              status === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}>
              {status === 'success' ? <CheckCircle size={18} className="shrink-0" /> : <AlertCircle size={18} className="shrink-0" />}
              <span className="text-[10px] md:text-sm font-black uppercase tracking-wider leading-tight">{message}</span>
            </div>
          )}
        </div>

        <Button 
          onClick={handleSave}
          disabled={isSaving || hasConflict}
          className="w-full md:w-auto bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 disabled:text-slate-500 text-[#050B14] font-black uppercase tracking-widest px-8 md:px-12 py-6 rounded-xl md:rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.2)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all active:scale-95 text-xs md:text-sm whitespace-nowrap"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-3" />
              Sincronizando...
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5 mr-3" />
              Sincronizar Configurações
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
