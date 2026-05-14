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
  Palette
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
      setMessage('Configurações da agenda salvas com sucesso!');
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
      setMessage(`Erro ao salvar: ${errorMessage}`);
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {/* Horários */}
        <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl space-y-6">
          <div className="flex items-center gap-3 md:gap-4 mb-2">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-cyan-500/10 text-cyan-400 rounded-xl md:rounded-2xl flex items-center justify-center">
              <Clock className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-black text-white uppercase tracking-tight">Horário de Atendimento</h3>
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 outline-none transition-all pr-12 text-sm md:text-base font-medium"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] md:text-xs font-black text-slate-600 uppercase">min</span>
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 outline-none transition-all pr-12 text-sm md:text-base font-medium"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] md:text-xs font-black text-slate-600 uppercase">min</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dias de Funcionamento */}
        <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl space-y-6">
          <div className="flex items-center gap-3 md:gap-4 mb-2">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-500/10 text-emerald-400 rounded-xl md:rounded-2xl flex items-center justify-center">
              <Calendar className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-black text-white uppercase tracking-tight">Dias de Funcionamento</h3>
              <p className="text-[10px] md:text-xs text-slate-500 font-medium">Selecione os dias da semana</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {weekDays.map(day => (
              <button
                key={day.value}
                onClick={() => {
                  if (workingDays.includes(day.value)) {
                    setWorkingDays(workingDays.filter(d => d !== day.value));
                  } else {
                    setWorkingDays([...workingDays, day.value]);
                  }
                }}
                className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                  workingDays.includes(day.value)
                    ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                    : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tipos de Atendimento */}
        <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl space-y-6">
          <div className="flex items-center gap-3 md:gap-4 mb-2">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-500/10 text-indigo-400 rounded-xl md:rounded-2xl flex items-center justify-center">
              <Calendar className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-black text-white uppercase tracking-tight">Tipos de Atendimento</h3>
              <p className="text-[10px] md:text-xs text-slate-500 font-medium">Categorias para agendamento</p>
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
                className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 transition-colors"
              >
                <div 
                  className="w-4 h-4 rounded-full overflow-hidden cursor-pointer relative shadow-inner"
                  style={{ backgroundColor: appointmentColors[type] || '#3b82f6' }}
                >
                  <input
                    type="color"
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full block"
                    value={appointmentColors[type] || '#3b82f6'}
                    onChange={(e) => setAppointmentColors(prev => ({ ...prev, [type]: e.target.value }))}
                    title="Alterar cor"
                  />
                </div>
                <span className="text-xs md:text-sm font-medium text-slate-300">{type}</span>
                <button 
                  onClick={() => removeType(type)}
                  className="text-slate-600 hover:text-rose-500 transition-colors bg-slate-900 hover:bg-rose-500/10 p-1.5 rounded-lg ml-2"
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
              <h3 className="text-sm md:text-base font-black text-white uppercase tracking-tight">Datas Bloqueadas</h3>
              <p className="text-[10px] md:text-xs text-slate-500 font-medium">Feriados ou pausas específicas</p>
            </div>
            <Button
              onClick={addNationalHolidays}
              variant="outline"
              className="text-xs border-slate-800 bg-slate-950 text-slate-300 hover:text-rose-400 hover:bg-slate-900 hover:border-rose-500/30"
            >
              Popula Feriados
            </Button>
          </div>
          <div className="flex gap-2">
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
          <div className="flex flex-wrap gap-2 pt-2">
            {blockedDates.map((date) => (
              <div 
                key={date}
                className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2"
              >
                <span className="text-xs md:text-sm font-medium text-slate-300">
                  {new Date(date + 'T12:00:00').toLocaleDateString('pt-BR')}
                </span>
                <button 
                  onClick={() => setBlockedDates(blockedDates.filter(d => d !== date))}
                  className="text-slate-600 hover:text-rose-500 transition-colors bg-slate-900 hover:bg-rose-500/10 p-1.5 rounded-lg"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {blockedDates.length === 0 && (
              <div className="w-full text-center py-6 border border-dashed border-slate-800 rounded-xl">
                <p className="text-[10px] md:text-xs text-slate-500 font-medium">Nenhuma data bloqueada.</p>
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
              <h3 className="text-sm md:text-base font-black text-white uppercase tracking-tight">Políticas da Clínica</h3>
              <p className="text-[10px] md:text-xs text-slate-500 font-medium">Tolerância de atrasos e aviso prévio</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="space-y-2">
              <label className="text-[10px] md:text-xs font-black text-amber-500 uppercase tracking-widest pl-1">Aviso Prévio (Cancelamento)</label>
              <div className="relative">
                <input 
                  type="number" 
                  value={cancelNotice}
                  onChange={(e) => setCancelNotice(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 outline-none transition-all pr-12 text-sm md:text-base font-medium"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] md:text-xs font-black text-slate-600 uppercase">horas</span>
              </div>
              <p className="text-xs text-slate-500 mt-1 pl-1">Tempo mínimo para reagendamentos/cancelamentos.</p>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] md:text-xs font-black text-amber-500 uppercase tracking-widest pl-1">Tolerância de Atraso</label>
              <div className="relative">
                <input 
                  type="number" 
                  value={delayTolerance}
                  onChange={(e) => setDelayTolerance(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 outline-none transition-all pr-12 text-sm md:text-base font-medium"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] md:text-xs font-black text-slate-600 uppercase">min</span>
              </div>
              <p className="text-xs text-slate-500 mt-1 pl-1">Tolerância máxima aceita para atrasos.</p>
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
              <h3 className="text-sm md:text-base font-black text-white uppercase tracking-tight">Lembretes Automáticos</h3>
              <p className="text-[10px] md:text-xs text-slate-500 font-medium">Textos de confirmação (WhatsApp)</p>
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
          
          <div className={`space-y-4 pt-2 transition-opacity duration-300 ${reminderEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
            <div className="space-y-2">
              <label className="text-[10px] md:text-xs font-black text-cyan-500 uppercase tracking-widest pl-1">Mensagem de Lembrete</label>
              <textarea 
                value={reminderTemplate}
                onChange={(e) => setReminderTemplate(e.target.value)}
                rows={4}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/10 outline-none transition-all text-sm font-medium resize-none"
              />
              <div className="flex gap-2 flex-wrap text-xs font-mono text-slate-500">
                <span>Variáveis Suportadas:</span>
                <span className="text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">{`{nome}`}</span>
                <span className="text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">{`{data}`}</span>
                <span className="text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">{`{hora}`}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-6 md:pt-8 border-t border-slate-800/50 flex flex-col md:flex-row items-center justify-between gap-6 pb-10">
        <div className="flex-1 w-full">
          {status !== 'idle' && (
            <div className={`p-4 rounded-xl border flex items-center gap-3 ${
              status === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}>
              {status === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
              <span className="text-[10px] md:text-xs font-black uppercase tracking-wider">{message}</span>
            </div>
          )}
        </div>

        <Button 
          onClick={handleSave}
          disabled={isSaving}
          className="w-full md:w-auto bg-cyan-500 hover:bg-cyan-400 text-[#050B14] font-black uppercase tracking-widest px-8 md:px-10 py-5 md:py-6 rounded-xl md:rounded-2xl shadow-lg shadow-cyan-500/20 transition-all active:scale-95 text-xs md:text-sm"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin mr-2" />
              Salvando...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              Salvar Agenda
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
