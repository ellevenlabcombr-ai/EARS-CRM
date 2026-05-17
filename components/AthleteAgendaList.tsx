import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { ptBR, enUS } from "date-fns/locale";
import { Plus, Calendar as CalendarIcon, Clock, MapPin, Tag, Stethoscope, Trophy, Scale, Plane, Briefcase, UserCircle, Activity, Video } from "lucide-react";
import { Button } from "./ui/button";
import { CreateEventModal } from "./CreateEventModal";
import { EventModal } from "./EventModal";
import { AgendaEvent, getCategoryColor } from "@/types/agenda";

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'clinical': return Stethoscope;
    case 'competition': return Trophy;
    case 'game': return Trophy;
    case 'training': return Activity;
    case 'live': return Video;
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
  onEventChanged?: () => void;
  isBlocked?: boolean;
}

export function AthleteAgendaList({ athleteId, lang, onEventChanged, isBlocked = false }: AthleteAgendaListProps) {
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AgendaEvent | null>(null);
  const [eventToEdit, setEventToEdit] = useState<AgendaEvent | null>(null);

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

  const handleSaveEvent = async (eventData: any) => {
    try {
      if (eventData.id) {
        const { error } = await supabase
          .from('agenda_events')
          .update(eventData)
          .eq('id', eventData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('agenda_events')
          .insert([eventData]);
        if (error) throw error;
      }
      setIsCreateModalOpen(false);
      setEventToEdit(null);
      fetchEvents();
      onEventChanged?.();
    } catch (err: any) {
      throw err;
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
          {isBlocked && (
             <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest mt-1">
                Bloqueado (Inadimplência)
             </p>
          )}
        </div>
        <Button 
          onClick={() => {
             if (isBlocked) {
                 alert("Por favor, entre em contato com a administração para regularizar o pagamento e desbloquear o agendamento.");
             } else {
                 setIsCreateModalOpen(true);
             }
          }}
          className={`font-black uppercase tracking-widest border-none px-4 rounded-xl ${isBlocked ? 'bg-rose-500 hover:bg-rose-600 text-slate-100 shadow-[0_0_15px_rgba(244,63,94,0.4)]' : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]'}`}
        >
          {isBlocked ? (
             <>
               {lang === 'pt' ? 'Regularizar Pagamento' : 'Pay Overdue'}
             </>
          ) : (
             <>
               <Plus className="w-4 h-4 mr-2" />
               {lang === 'pt' ? 'Novo Evento' : 'New Event'}
             </>
          )}
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
            const colorClassString = getCategoryColor(event);
            
            return (
              <div 
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-4 hover:border-cyan-500/50 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${colorClassString} border border-transparent`}>
                      <Icon className={`w-6 h-6`} />
                    </div>
                    <div>
                      <h4 className="text-white font-bold">{event.title}</h4>
                      <p className="text-sm text-slate-400 line-clamp-1">{event.description}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs font-medium text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {format(new Date(event.start_time), "dd 'de' MMMM, HH:mm", { locale: lang === 'pt' ? ptBR : enUS })}
                        </span>
                        {event.meet_link && (
                          <span className="flex items-center gap-1 text-indigo-400">
                            <Video className="w-3.5 h-3.5" />
                            Live
                          </span>
                        )}
                        {event.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {event.location}
                          </span>
                        )}
                        {event.category === 'clinical' && event.status && event.status !== 'scheduled' && (
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                            event.status === 'confirmed' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                            event.status === 'attended' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            event.status === 'no_show' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                            event.status === 'cancelled' ? 'bg-slate-500/10 text-slate-400 border border-slate-500/20' :
                            ''
                          }`}>
                            {event.status === 'confirmed' ? 'Confirmado' :
                             event.status === 'attended' ? 'Compareceu' :
                             event.status === 'no_show' ? 'Faltou' :
                             'Cancelado'}
                          </span>
                        )}
                        {event.category === 'clinical' && event.payment_status && event.payment_status !== 'pending' && (
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                            event.payment_status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {event.payment_status === 'paid' ? 'Pago' : 'Pago Parcial'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${colorClassString}`}>
                    {event.category === 'clinical' ? 'Clínico' : event.category === 'competition' ? 'Competição' : event.category === 'game' ? 'Jogo' : event.category === 'training' ? 'Treino' : event.category === 'live' ? 'Live' : event.category === 'arbitration' ? 'Arbitragem' : event.category === 'travel' ? 'Viagem' : event.category === 'professional' ? 'Profissional' : 'Pessoal'}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <CreateEventModal 
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEventToEdit(null);
        }}
        onSave={handleSaveEvent}
        fixedAthleteId={athleteId}
        initialEvent={eventToEdit || {
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
            onEventChanged?.();
          }}
          onEdit={() => {
            setEventToEdit(selectedEvent);
            setSelectedEvent(null);
            setIsCreateModalOpen(true);
          }}
        />
      )}
    </div>
  );
}
