import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { Plus, Calendar as CalendarIcon, Clock, MapPin, Tag, Stethoscope, Trophy, Scale, Plane, Briefcase, UserCircle, Activity } from "lucide-react";
import { Button } from "./ui/button";
import { CreateEventModal } from "./CreateEventModal";
import { EventModal } from "./EventModal";
import { AgendaEvent, getCategoryColor } from "@/types/agenda";

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'clinical': return Stethoscope;
    case 'competition': return Trophy;
    case 'arbitration': return Scale;
    case 'travel': return Plane;
    case 'professional': return Briefcase;
    case 'personal': return UserCircle;
    default: return Activity;
  }
};

interface AthleteAgendaListProps {
  athleteId: string;
  lang: "pt" | "en";
}

export function AthleteAgendaList({ athleteId, lang }: AthleteAgendaListProps) {
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AgendaEvent | null>(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const today = new Date();
      // start of today
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('agenda_events')
        .select('*')
        .eq('athlete_id', athleteId)
        .gte('start_time', today.toISOString())
        .order('start_time', { ascending: true })
        .limit(20);

      if (error) {
        throw error;
      }

      setEvents(data || []);
    } catch (err: any) {
      console.error("Failed to fetch agenda_events:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [athleteId]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-widest">
            {lang === 'pt' ? 'Próximos Eventos' : 'Upcoming Events'}
          </h3>
        </div>
        <Button 
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black uppercase tracking-widest border-none px-4 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.4)]"
        >
          <Plus className="w-4 h-4 mr-2" />
          {lang === 'pt' ? 'Novo Evento' : 'New Event'}
        </Button>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="text-center p-8 text-slate-500">
            {lang === 'pt' ? 'Carregando eventos...' : 'Loading events...'}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center p-8 bg-slate-900/30 rounded-2xl border border-slate-800/50">
            <CalendarIcon className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">
              {lang === 'pt' ? 'Nenhum evento agendado.' : 'No events scheduled.'}
            </p>
          </div>
        ) : (
          events.map((event) => {
            const Icon = getCategoryIcon(event.category as any);
            const colorClass = getCategoryColor(event.category as any);
            
            return (
              <div 
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 hover:border-cyan-500/50 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${colorClass.bg} ${colorClass.activeBorder} border border-transparent`}>
                      <Icon className={`w-6 h-6 ${colorClass.color}`} />
                    </div>
                    <div>
                      <h4 className="text-white font-bold">{event.title}</h4>
                      <p className="text-sm text-slate-400 line-clamp-1">{event.description}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs font-medium text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {format(new Date(event.start_time), "dd 'de' MMMM, HH:mm", { locale: lang === 'pt' ? ptBR : enUS })}
                        </span>
                        {event.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {event.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${colorClass.bg} ${colorClass.color}`}>
                    {event.category}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <CreateEventModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={() => {
          setIsCreateModalOpen(false);
          fetchEvents();
        }}
        fixedAthleteId={athleteId}
        initialEvent={{
          athlete_id: athleteId
        } as any}
      />
      
      {selectedEvent && (
        <EventModal
          isOpen={!!selectedEvent}
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onDelete={() => {
            setSelectedEvent(null);
            fetchEvents();
          }}
          onEdit={() => {
            setSelectedEvent(null);
            setIsCreateModalOpen(true); // Ideally would pass event to edit, but for simplicity
          }}
        />
      )}
    </div>
  );
}
