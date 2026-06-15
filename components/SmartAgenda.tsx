"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Filter,
  Calendar as CalendarIcon,
  Search,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, addMonths, startOfDay, endOfDay, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AgendaEvent, AgendaCategory } from "@/types/agenda";
import { CalendarGrid } from "./CalendarGrid";
import { MonthCalendarGrid } from "./MonthCalendarGrid";
import { DayCalendarGrid } from "./DayCalendarGrid";
import { EventModal } from "./EventModal";
import { CreateEventModal } from "./CreateEventModal";

interface SmartAgendaProps {
  athleteId?: string;
}

export function SmartAgenda({ athleteId }: SmartAgendaProps = {}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('month');
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [initialEventForEdit, setInitialEventForEdit] = useState<AgendaEvent | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<AgendaEvent | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  
  const [filter, setFilter] = useState<AgendaCategory | 'all'>('all');

  const fetchEvents = useCallback(async () => {
    if (!supabase) return;
    
    try {
      setLoading(true);
      let rangeStart, rangeEnd;

      if (viewMode === 'day') {
        rangeStart = startOfDay(currentDate);
        rangeEnd = endOfDay(currentDate);
      } else if (viewMode === 'week') {
        rangeStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        rangeEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
      } else {
        rangeStart = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
        rangeEnd = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
      }

      let query = supabase
        .from('agenda_events')
        .select('*')
        .gte('start_time', rangeStart.toISOString())
        .lte('start_time', rangeEnd.toISOString())
        .order('start_time', { ascending: true });

      if (athleteId) {
        query = query.eq('athlete_id', athleteId);
      }

      const { data, error } = await query;

      if (error) {
        if (error.code === '42P01') {
          setError("Tabela 'agenda_events' não encontrada. Por favor, crie a tabela no Supabase.");
        } else {
          setError(error.message);
        }
        return;
      }

      // Fetch blocked dates
      let blockedEvents: AgendaEvent[] = [];
      try {
        const { data: settings, error: settingsError } = await supabase.from('agenda_settings').select('blocked_dates').maybeSingle();
        if (settingsError) {
          console.warn("Could not fetch agenda settings:", settingsError.message);
        } else if (settings?.blocked_dates && Array.isArray(settings.blocked_dates)) {
          blockedEvents = settings.blocked_dates.map((date: string) => ({
            id: `blocked-${date}`,
            title: 'Feriado / Bloqueado',
            category: 'block',
            start_time: `${date}T00:00:00.000Z`,
            end_time: `${date}T23:59:59.000Z`,
            is_all_day: true,
            status: 'confirmed',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })) as AgendaEvent[];
        }
      } catch (e) {
        console.warn("Could not fetch agenda settings blocked dates", e);
      }

      setEvents([...(data || []), ...blockedEvents]);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentDate, viewMode]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleSaveEvent = async (eventData: any) => {
    if (!supabase) return;

    try {
      if (eventData.id) {
        // Just update single event for simplicity (or we could ask if they want to update all).
        // Standard approach for MVP: edit edits just this one, unless they want all? 
        // We'll just edit this single one.
        const { error } = await supabase
          .from('agenda_events')
          .update(eventData)
          .eq('id', eventData.id);

        if (error) throw error;
      } else {
        if (eventData.recurrence_rule && eventData.recurrence_rule !== 'none') {
          // Generate multiple events
          const groupId = crypto.randomUUID();
          const eventsToInsert = [];
          const rule = eventData.recurrence_rule;
          
          let currentStart = new Date(eventData.start_time);
          let currentEnd = new Date(eventData.end_time);
          
          // Generate for up to 1 year
          const endDateLimit = new Date();
          endDateLimit.setFullYear(endDateLimit.getFullYear() + 1);

          while (currentStart < endDateLimit) {
            eventsToInsert.push({
              ...eventData,
              start_time: currentStart.toISOString(),
              end_time: currentEnd.toISOString(),
              recurrence_group_id: groupId,
            });

            // Advance date based on rule
            if (rule === 'daily') {
              currentStart.setDate(currentStart.getDate() + 1);
              currentEnd.setDate(currentEnd.getDate() + 1);
            } else if (rule === 'weekly') {
              currentStart.setDate(currentStart.getDate() + 7);
              currentEnd.setDate(currentEnd.getDate() + 7);
            } else if (rule === 'biweekly') {
              currentStart.setDate(currentStart.getDate() + 14);
              currentEnd.setDate(currentEnd.getDate() + 14);
            } else if (rule === 'weekly_custom') {
              const days = eventData.recurrence_days || [];
              if (days.length === 0) break; // Defensive
              let added = false;
              let loops = 0;
              while (!added && loops < 14) {
                currentStart.setDate(currentStart.getDate() + 1);
                currentEnd.setDate(currentEnd.getDate() + 1);
                if (days.includes(currentStart.getDay())) added = true;
                loops++;
              }
              if (!added) break;
            } else if (rule === 'monthly') {
              currentStart.setMonth(currentStart.getMonth() + 1);
              currentEnd.setMonth(currentEnd.getMonth() + 1);
            }
            
            // Safety cap: max 365 events
            if (eventsToInsert.length >= 365) break;
          }

          // Insert all in batch
          // Supabase supports batch insert with max of ~1000 items usually
          // We can slice it just in case, but 365 is safe.
          const { error } = await supabase
            .from('agenda_events')
            .insert(eventsToInsert);

          if (error) throw error;
        } else {
          // Single event
          const { error } = await supabase
            .from('agenda_events')
            .insert([eventData]);

          if (error) throw error;
        }
      }
      
      setIsCreateModalOpen(false);
      setInitialEventForEdit(null);
      fetchEvents();
    } catch (err: any) {
      console.error(err);
      throw err;
    }
  };

  const handleEditEvent = (event: AgendaEvent) => {
    setInitialEventForEdit(event);
    setIsCreateModalOpen(true);
  };

  const handleDeleteEvent = async (id: string, deleteAllSerie = false) => {
    if (!supabase) return;

    try {
      let query = supabase.from('agenda_events').delete();
      
      if (deleteAllSerie && selectedEvent?.recurrence_group_id) {
        query = query.eq('recurrence_group_id', selectedEvent.recurrence_group_id)
                     .gte('start_time', selectedEvent.start_time);
      } else {
        query = query.eq('id', id);
      }

      const { error } = await query;
      if (error) throw error;
      
      setIsEventModalOpen(false);
      setSelectedEvent(null);
      fetchEvents();
    } catch (err: any) {
      alert("Erro ao excluir evento: " + err.message);
    }
  };

  const filteredEvents = filter === 'all' 
    ? events 
    : events.filter(e => e.category === filter);

  const clinicalToday = events.filter(e => isSameDay(new Date(e.start_time), new Date()) && e.category === 'clinical');
  const confirmedToday = clinicalToday.filter(e => e.status === 'confirmed' || e.status === 'attended' || e.status === 'in_treatment').length;
  const pendingToday = clinicalToday.length - confirmedToday;

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl lg:text-4xl font-black text-white uppercase tracking-tight">
            Smart Agenda
          </h1>
          {clinicalToday.length > 0 ? (
            <div className="flex items-center gap-3 mt-3">
              <span className="px-3 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-lg text-xs font-black uppercase tracking-widest">
                {clinicalToday.length} Hoje
              </span>
              <span className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 rounded-lg text-xs font-black uppercase tracking-widest">
                {confirmedToday} Confirmados
              </span>
              <span className="px-3 py-1 bg-slate-800 text-slate-400 rounded-lg text-xs font-black uppercase tracking-widest">
                {pendingToday} Pendentes
              </span>
            </div>
          ) : (
            <p className="text-slate-400 mt-2">Gestão unificada e inteligência de decisão clínica.</p>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex flex-wrap items-center bg-slate-900/50 border border-slate-800 rounded-xl p-1 gap-1">
            {(['all', 'clinical', 'live', 'arbitration', 'professional', 'personal', 'competition', 'game', 'training'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat as any)}
                className={`px-3 py-2 rounded-lg text-xxs font-black uppercase tracking-widest transition-all ${
                  filter === cat 
                    ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {cat === 'all' ? 'Todos' : cat === 'clinical' ? 'Clínico' : cat === 'live' ? 'Live' : cat === 'arbitration' ? 'Arbitragem' : cat === 'competition' ? 'Competição' : cat === 'game' ? 'Jogo' : cat === 'training' ? 'Treino' : cat === 'professional' ? 'Profissional' : 'Pessoal'}
              </button>
            ))}
          </div>

          <button 
            onClick={() => {
              setInitialEventForEdit(null);
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl transition-all font-black text-xs uppercase tracking-widest shadow-xl shadow-cyan-500/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Evento</span>
          </button>
        </div>
      </header>

      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                if (viewMode === 'day') {
                  setCurrentDate(addDays(currentDate, -1));
                } else if (viewMode === 'week') {
                  setCurrentDate(addDays(currentDate, -7));
                } else {
                  setCurrentDate(subMonths(currentDate, 1));
                }
              }}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-black text-white uppercase tracking-tight min-w-[12.5rem] text-center">
              {viewMode === 'day' ? (
                format(currentDate, "dd 'de' MMMM", { locale: ptBR })
              ) : viewMode === 'week' ? (
                `${format(startOfWeek(currentDate, { weekStartsOn: 1 }), "dd MMM", { locale: ptBR })} - ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), "dd MMM", { locale: ptBR })}`
              ) : (
                format(currentDate, "MMMM yyyy", { locale: ptBR })
              )}
            </h2>
            <button 
              onClick={() => {
                if (viewMode === 'day') {
                  setCurrentDate(addDays(currentDate, 1));
                } else if (viewMode === 'week') {
                  setCurrentDate(addDays(currentDate, 7));
                } else {
                  setCurrentDate(addMonths(currentDate, 1));
                }
              }}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex bg-slate-800/50 p-1 rounded-xl border border-slate-700 overflow-x-auto min-w-0 mx-2 flex-shrink">
            <button
              onClick={() => setViewMode('day')}
              className={`px-4 py-2 rounded-lg text-xxs font-black uppercase tracking-widest transition-all ${
                viewMode === 'day' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Dia
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-4 py-2 rounded-lg text-xxs font-black uppercase tracking-widest transition-all ${
                viewMode === 'week' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-4 py-2 rounded-lg text-xxs font-black uppercase tracking-widest transition-all ${
                viewMode === 'month' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Mês
            </button>
          </div>
        </div>

        {error ? (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
            <div className="p-4 bg-rose-500/10 rounded-2xl border border-rose-500/20 text-rose-500">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-tight">Erro na Agenda</h3>
              <p className="text-slate-400 text-sm max-w-md mx-auto mt-2">{error}</p>
            </div>
            <button 
              onClick={() => fetchEvents()}
              className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all"
            >
              Tentar Novamente
            </button>
          </div>
        ) : loading ? (
          <div className="py-40 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : viewMode === 'day' ? (
          <DayCalendarGrid 
            events={filteredEvents}
            currentDate={currentDate}
            onEventClick={(event) => {
              if (event.id && event.id.startsWith('blocked-')) return;
              setSelectedEvent(event);
              setIsEventModalOpen(true);
            }}
            onTimeSlotClick={(date) => {
              setInitialEventForEdit(null);
              // Open modal with start time pre-filled? We can pass it to the Create modal via state if we wrap it, but for now just open it.
              setIsCreateModalOpen(true);
            }}
          />
        ) : viewMode === 'month' ? (
          <MonthCalendarGrid 
            events={filteredEvents} 
            currentDate={currentDate}
            onEventClick={(event) => {
              if (event.id && event.id.startsWith('blocked-')) return;
              setSelectedEvent(event);
              setIsEventModalOpen(true);
            }}
          />
        ) : (
          <CalendarGrid 
            events={filteredEvents} 
            currentDate={currentDate}
            onEventClick={(event) => {
              if (event.id && event.id.startsWith('blocked-')) return;
              setSelectedEvent(event);
              setIsEventModalOpen(true);
            }}
          />
        )}
      </div>

      <CreateEventModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleSaveEvent}
        initialEvent={initialEventForEdit}
      />

      <EventModal 
        event={selectedEvent}
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        onDelete={handleDeleteEvent}
        onEdit={handleEditEvent}
      />
    </div>
  );
}
