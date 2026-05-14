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
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('18:00');
  const [duration, setDuration] = useState(30);
  const [breakInterval, setBreakInterval] = useState(0);
  const [lunchStart, setLunchStart] = useState('12:00');
  const [lunchEnd, setLunchEnd] = useState('13:00');
  const [workingDays, setWorkingDays] = useState<string[]>(['1', '2', '3', '4', '5']);
  const [appointmentTypes, setAppointmentTypes] = useState<string[]>([]);
  const [newType, setNewType] = useState('');
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [newBlockedDate, setNewBlockedDate] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderTemplate, setReminderTemplate] = useState('Olá {nome}! Seu atendimento está marcado para {data} às {hora}.');
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
        setStartTime(data.start_time || '08:00');
        setEndTime(data.end_time || '18:00');
        setDuration(data.default_duration_minutes || 30);
        setBreakInterval(data.break_interval_minutes || 0);
        setAppointmentTypes(data.appointment_types || []);
        if (data.lunch_start) setLunchStart(data.lunch_start);
        if (data.lunch_end) setLunchEnd(data.lunch_end);
        if (data.working_days) setWorkingDays(data.working_days);
        if (data.blocked_dates) setBlockedDates(data.blocked_dates);
        if (data.reminder_enabled !== undefined) setReminderEnabled(data.reminder_enabled);
        if (data.reminder_template) setReminderTemplate(data.reminder_template);
        if (data.delay_tolerance_minutes !== undefined) setDelayTolerance(data.delay_tolerance_minutes);
        if (data.cancellation_notice_hours !== undefined) setCancelNotice(data.cancellation_notice_hours);
        if (data.appointment_colors) setAppointmentColors(data.appointment_colors);
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
      setMessage(`Erro ao carregar: ${errorMessage}`);
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

      const payload = {
        start_time: startTime,
        end_time: endTime,
        default_duration_minutes: duration,
        break_interval_minutes: breakInterval,
        lunch_start: lunchStart,
        lunch_end: lunchEnd,
        working_days: workingDays,
        appointment_types: appointmentTypes,
        blocked_dates: blockedDates,
        reminder_enabled: reminderEnabled,
        reminder_template: reminderTemplate,
        delay_tolerance_minutes: delayTolerance,
        cancellation_notice_hours: cancelNotice,
        appointment_colors: appointmentColors,
        updated_at: new Date().toISOString()
      };

      let error;
      if (existing) {
        const { error: updateError } = await supabase
          .from('agenda_settings')
          .update(payload)
          .eq('id', existing.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('agenda_settings')
          .insert([payload]);
        error = insertError;
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
      setMessage(`Inconsistência temporal detectada: ${errorMessage}`);
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

  const startMin = getMinutes(startTime);
  const endMin = getMinutes(endTime);
  const lunchStartMin = getMinutes(lunchStart);
  const lunchEndMin = getMinutes(lunchEnd);

  const hasConflict = startMin >= endMin || lunchStartMin >= lunchEndMin || lunchStartMin < startMin || lunchEndMin > endMin;

  const totalMin = endMin - startMin;
  const p1 = totalMin > 0 ? Math.max(0, ((lunchStartMin - startMin) / totalMin)) * 100 : 0;
  const pLunch = totalMin > 0 ? Math.max(0, ((lunchEndMin - lunchStartMin) / totalMin)) * 100 : 0;
  const p2 = totalMin > 0 ? Math.max(0, ((endMin - lunchEndMin) / totalMin)) * 100 : 0;

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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 pb-32">
        {/* Horários */}
        <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl space-y-6">
          <div className="flex items-center gap-3 md:gap-4 mb-2">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-cyan-500/10 text-cyan-400 rounded-xl md:rounded-2xl flex items-center justify-center">
              <Clock className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-black text-white uppercase tracking-tight">Janela Operacional</h3>
              <p className="text-[10px] md:text-xs text-slate-500 font-medium">Configure seu expediente diário</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Início</label>
              <input 
                type="time" 
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 outline-none transition-all text-sm md:text-base font-medium"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Término</label>
              <input 
                type="time" 
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 outline-none transition-all text-sm md:text-base font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800/50 mt-4">
            <div className="space-y-2">
              <label className="text-[10px] md:text-xs font-black text-amber-500 uppercase tracking-widest pl-1">Início Almoço</label>
              <input 
                type="time" 
                value={lunchStart}
                onChange={(e) => setLunchStart(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 outline-none transition-all text-sm md:text-base font-medium"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] md:text-xs font-black text-amber-500 uppercase tracking-widest pl-1">Fim Almoço</label>
              <input 
                type="time" 
                value={lunchEnd}
                onChange={(e) => setLunchEnd(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 outline-none transition-all text-sm md:text-base font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800/50">
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-1 pl-1">
                <Timer className="text-cyan-500 w-3 h-3 md:w-4 md:h-4" />
                <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">Duração Padrão</label>
              </div>
              <div className="relative">
                <input 
                  type="number" 
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 outline-none transition-all pr-12 text-sm md:text-base font-medium mb-2"
                />
                <span className="absolute right-4 top-4 text-[10px] md:text-xs font-black text-slate-600 uppercase">min</span>
                <input 
                  type="range"
                  min={15} max={120} step={15}
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                  className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-1 pl-1">
                <Timer className="text-amber-500 w-3 h-3 md:w-4 md:h-4" />
                <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">Intervalo</label>
              </div>
              <div className="relative">
                <input 
                  type="number" 
                  value={breakInterval}
                  onChange={(e) => setBreakInterval(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 outline-none transition-all pr-12 text-sm md:text-base font-medium mb-2"
                />
                <span className="absolute right-4 top-4 text-[10px] md:text-xs font-black text-slate-600 uppercase">min</span>
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
            <div className="pt-6 border-t border-slate-800/50 mt-4">
              <div className="flex justify-between text-[10px] text-slate-500 font-mono mb-2">
                <span>{startTime}</span>
                <span>{endTime}</span>
              </div>
              <div className="h-2 w-full flex rounded-full overflow-hidden bg-slate-800 shadow-inner">
                <div className="h-full bg-cyan-500 transition-all duration-500" style={{ width: `${p1}%` }}></div>
                <div className="h-full bg-slate-700 opacity-50" style={{ width: `${pLunch}%` }}></div>
                <div className="h-full bg-cyan-500 transition-all duration-500" style={{ width: `${p2}%` }}></div>
              </div>
              <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-2">
                <span>Turno 1</span>
                <span className="text-slate-500">Intervalo {lunchStart} - {lunchEnd}</span>
                <span>Turno 2</span>
              </div>
            </div>
          ) : (
            <div className="pt-4 mt-4 border-t border-slate-800/50">
              <div className="flex items-center justify-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400">
                <AlertCircle size={16} className="shrink-0" />
                <span className="text-xs font-bold uppercase tracking-widest leading-tight">Conflito Operacional Detectado</span>
              </div>
            </div>
          )}
        </div>

        {/* Dias de Funcionamento */}
        <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl space-y-6">
          <div className="flex items-center gap-3 md:gap-4 mb-2">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-500/10 text-emerald-400 rounded-xl md:rounded-2xl flex items-center justify-center">
              <Calendar className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-black text-white uppercase tracking-tight">Funcionamento Semanal</h3>
              <p className="text-[10px] md:text-xs text-slate-500 font-medium">Dias de operação padrão</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 pt-2">
            {weekDays.map(day => {
              const isActive = workingDays.includes(day.value);
              return (
                <button
                  key={day.value}
                  onClick={() => {
                    if (isActive) {
                      setWorkingDays(workingDays.filter(d => d !== day.value));
                    } else {
                      setWorkingDays([...workingDays, day.value]);
                    }
                  }}
                  className={`relative overflow-hidden px-5 py-3 rounded-xl text-sm font-black tracking-widest uppercase transition-all duration-300 ${
                    isActive
                      ? 'bg-emerald-500/10 border border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)] scale-[1.02]'
                      : 'bg-slate-950 border border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  {isActive && <div className="absolute inset-0 bg-emerald-500/5 transition-opacity duration-300"></div>}
                  <span className="relative z-10">{day.label}</span>
                </button>
              );
            })}
          </div>
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
            <Button
              onClick={addNationalHolidays}
              variant="outline"
              className="text-xs transition-colors font-bold uppercase tracking-widest border-slate-700 bg-slate-950 text-slate-400 hover:text-rose-400 hover:bg-slate-900 shadow-sm shadow-black"
            >
              Popula Feriados
            </Button>
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
            <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-500/10 text-amber-500 rounded-xl md:rounded-2xl flex items-center justify-center">
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

        {/* Lembretes e Automação */}
        <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl space-y-6 lg:col-span-2">
          <div className="flex items-center gap-3 md:gap-4 mb-2">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-cyan-500/10 text-cyan-400 rounded-xl md:rounded-2xl flex items-center justify-center">
              <MessageCircle className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm md:text-base font-black text-white uppercase tracking-tight">Automação de Comunicação</h3>
              <p className="text-[10px] md:text-xs text-slate-500 font-medium">Lembretes proativos (WhatsApp)</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={reminderEnabled}
                onChange={(e) => setReminderEnabled(e.target.checked)}
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
            </label>
          </div>
          
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 pt-2 transition-opacity duration-300 ${reminderEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
            <div className="space-y-4">
              <label className="text-[10px] md:text-xs font-black text-cyan-500 uppercase tracking-widest pl-1">Template da Mensagem</label>
              <textarea 
                value={reminderTemplate}
                onChange={(e) => setReminderTemplate(e.target.value)}
                rows={5}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 outline-none transition-all text-sm font-medium resize-none"
              />
              <div className="flex gap-2 flex-wrap text-xs font-mono text-slate-500">
                <span>Variáveis Suportadas:</span>
                <span className="text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded cursor-pointer hover:bg-cyan-500/20 transition-colors" onClick={() => setReminderTemplate(prev => prev + '{nome}')}>{`{nome}`}</span>
                <span className="text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded cursor-pointer hover:bg-cyan-500/20 transition-colors" onClick={() => setReminderTemplate(prev => prev + '{data}')}>{`{data}`}</span>
                <span className="text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded cursor-pointer hover:bg-cyan-500/20 transition-colors" onClick={() => setReminderTemplate(prev => prev + '{hora}')}>{`{hora}`}</span>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] md:text-xs font-black text-cyan-500 uppercase tracking-widest pl-1">Preview em Tempo Real</label>
              <div className="bg-[#0b141a] rounded-2xl p-4 border border-[#202c33] shadow-lg flex flex-col gap-3 h-full justify-end min-h-[140px] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full p-2 bg-[#202c33] border-b border-[#2a3942] flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-semibold text-[#e9edef]">Simulação WhatsApp</span>
                </div>
                <div className="mt-8 bg-[#005c4b] text-[#e9edef] p-3 rounded-lg rounded-tr-none self-end max-w-[90%] shadow-sm relative text-sm whitespace-pre-wrap font-medium">
                  {reminderTemplate
                    .replace('{nome}', 'Mariana')
                    .replace('{data}', new Date().toLocaleDateString('pt-BR'))
                    .replace('{hora}', '15:00')}
                  <div className="absolute top-0 right-[-8px] w-0 h-0 border-[8px] border-transparent border-t-[#005c4b] border-l-[#005c4b]"></div>
                  <div className="text-[10px] text-[#e9edef]/70 text-right mt-1 font-sans">
                    {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} ✓✓
                  </div>
                </div>
              </div>
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
