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
  Timer
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AgendaSettings() {
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('18:00');
  const [duration, setDuration] = useState(30);
  const [breakInterval, setBreakInterval] = useState(0);
  const [appointmentTypes, setAppointmentTypes] = useState<string[]>([]);
  const [newType, setNewType] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

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
        appointment_types: appointmentTypes,
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

          <div className="grid grid-cols-2 gap-4 pt-2">
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
                className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 group hover:border-rose-500/30 transition-colors"
              >
                <span className="text-xs md:text-sm font-medium text-slate-300">{type}</span>
                <button 
                  onClick={() => removeType(type)}
                  className="text-slate-600 hover:text-rose-500 transition-colors bg-slate-900 hover:bg-rose-500/10 p-1.5 rounded-lg"
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
