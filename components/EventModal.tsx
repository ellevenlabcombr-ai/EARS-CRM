"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "motion/react";
import { X, Clock, Tag, User, AlertTriangle, Trash2, MapPin, Bell, Repeat, AlignLeft, Link as LinkIcon, DollarSign, MessageCircle } from "lucide-react";
import { AgendaEvent, getCategoryColor } from "@/types/agenda";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

interface EventModalProps {
  event: AgendaEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (id: string, deleteAllSerie?: boolean) => void;
  onEdit?: (event: AgendaEvent) => void;
}

export function EventModal({ event, isOpen, onClose, onDelete, onEdit }: EventModalProps) {
  const [athleteName, setAthleteName] = useState<string>("");
  const [athletePhone, setAthletePhone] = useState<string>("");
  const [showDeleteOptions, setShowDeleteOptions] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setShowDeleteOptions(false);
    }
    const fetchAthlete = async () => {
      if (event?.athlete_id) {
        const { data } = await supabase.from('athletes').select('name, phone').eq('id', event.athlete_id).single();
        if (data) {
          setAthleteName(data.name);
          setAthletePhone(data.phone || "");
        }
      }
    };
    if (isOpen && event?.athlete_id) {
      fetchAthlete();
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAthleteName("");
      setAthletePhone("");
    }
  }, [event?.athlete_id, isOpen]);

  if (!event) return null;

  const colorClass = getCategoryColor(event);
  const startTime = new Date(event.start_time);
  const endTime = new Date(event.end_time);
  const isMultiDay = !isSameDay(startTime, endTime) || event.is_all_day;

  const generateWhatsAppLink = () => {
    if (!athletePhone) return "#";
    
    const cleanPhone = athletePhone.replace(/\D/g, '');
    const phoneWithCode = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
    
    const dateStr = format(startTime, "dd/MM", { locale: ptBR });
    const timeStr = format(startTime, "HH:mm", { locale: ptBR });
    const nameStr = athleteName ? athleteName.split(' ')[0] : 'Atleta';
    
    const message = `Olá ${nameStr}, seu atendimento está agendado para o dia ${dateStr} às ${timeStr}, confirma?`;
    
    return `https://api.whatsapp.com/send?phone=${phoneWithCode}&text=${encodeURIComponent(message)}`;
  };

  const paymentColors: any = {
    paid: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    partially_paid: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    pending: 'bg-rose-500/10 text-rose-600 border-rose-500/20'
  };

  const getPaymentStatusText = () => {
    if (event.payment_status === 'paid') return 'Pago';
    if (event.payment_status === 'partially_paid') return 'Pago Parcialmente';
    return 'Pendente';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="w-full max-w-sm bg-white rounded-xl overflow-hidden shadow-2xl flex flex-col"
          >
            {/* Minimal Header with Category Color */}
            <div className={`h-2 ${colorClass.split(' ')[0]}`} />
            
            <div className="p-0">
              <div className="flex justify-end p-2 relative">
                <div className="flex gap-1">
                  {onDelete && (
                    <button 
                      onClick={() => {
                        if (event.recurrence_group_id) {
                          setShowDeleteOptions(true);
                        } else {
                          onDelete(event.id);
                        }
                      }}
                      className="p-2 hover:bg-rose-50 text-rose-500 rounded-full transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button 
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 text-gray-600 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Recurring Deletion Options Overlay */}
                <AnimatePresence>
                  {showDeleteOptions && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="absolute top-12 right-2 z-10 w-64 bg-white border border-gray-200 rounded-xl shadow-xl p-3 space-y-2 overflow-hidden"
                    >
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 px-1">Este evento é recorrente</p>
                      <button 
                        onClick={() => {
                          setShowDeleteOptions(false);
                          onDelete?.(event.id, false);
                        }}
                        className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-3 border border-transparent hover:border-gray-100"
                      >
                        <Trash2 className="w-4 h-4 text-rose-500" />
                        <div>
                          <p className="text-xs font-black text-gray-900 uppercase">Apenas este evento</p>
                          <p className="text-[10px] text-gray-500 font-medium">Remove apenas o agendamento de hoje</p>
                        </div>
                      </button>
                      <button 
                        onClick={() => {
                          setShowDeleteOptions(false);
                          onDelete?.(event.id, true);
                        }}
                        className="w-full text-left p-3 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-3 border border-transparent hover:border-rose-100 group"
                      >
                        <Repeat className="w-4 h-4 text-rose-500 group-hover:rotate-180 transition-transform duration-500" />
                        <div>
                          <p className="text-xs font-black text-rose-600 uppercase">Toda a série</p>
                          <p className="text-[10px] text-rose-400 font-medium">Remove este e os próximos eventos</p>
                        </div>
                      </button>
                      <div className="pt-2 border-t border-gray-50">
                        <button 
                          onClick={() => setShowDeleteOptions(false)}
                          className="w-full py-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="px-6 pb-6 space-y-5">
                <div className="flex gap-4">
                  <div className={`w-4 h-4 mt-1.5 rounded-sm shrink-0 shadow-sm ${colorClass.split(' ')[0]}`} />
                  <div className="space-y-1">
                    <h2 className="text-xl font-black text-gray-900 leading-tight tracking-tight">
                      {event.title}
                    </h2>
                    <p className="text-sm text-gray-700 font-medium">
                      {isMultiDay && !event.is_all_day ? (
                        `${format(startTime, "EEEE, d 'de' MMMM", { locale: ptBR })} • ${format(startTime, "HH:mm")} – ${format(endTime, "EEEE, d 'de' MMMM", { locale: ptBR })} • ${format(endTime, "HH:mm")}`
                      ) : event.is_all_day ? (
                        `${format(startTime, "EEEE, d 'de' MMMM", { locale: ptBR })}${!isSameDay(startTime, endTime) ? ` – ${format(endTime, "EEEE, d 'de' MMMM", { locale: ptBR })}` : ''} • Dia Todo`
                      ) : (
                        `${format(startTime, "EEEE, d 'de' MMMM", { locale: ptBR })} • ${format(startTime, "HH:mm")} – ${format(endTime, "HH:mm")}`
                      )}
                    </p>
                  </div>
                </div>

                {event.location && (
                  <div className="flex gap-4">
                    <MapPin className="w-4 h-4 mt-1 text-gray-500 shrink-0" />
                    <div className="space-y-0.5">
                      <p className="text-sm text-gray-900 font-bold">{event.location}</p>
                      {event.address && (
                        <p className="text-xs text-gray-500 leading-relaxed">{event.address}</p>
                      )}
                    </div>
                  </div>
                )}

                {event.meet_link && (
                  <div className="flex gap-4">
                    <LinkIcon className="w-4 h-4 mt-1 text-indigo-500 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-0.5">Meet / Vídeo</p>
                      <a href={event.meet_link} target="_blank" rel="noreferrer" className="text-sm text-indigo-600 font-bold hover:underline truncate block">
                        {event.meet_link}
                      </a>
                    </div>
                  </div>
                )}

                {event.category === 'clinical' && (event.event_value || event.payment_status) && (
                  <div className="flex gap-4">
                    <DollarSign className="w-4 h-4 mt-1 text-emerald-500 shrink-0" />
                    <div className="flex flex-col gap-2">
                      {event.event_value && (
                        <div>
                          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-0.5">Valor</p>
                          <p className="text-sm text-gray-900 font-bold">R$ {Number(event.event_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                      )}
                      {event.payment_status && (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border w-max ${paymentColors[event.payment_status] || paymentColors.pending}`}>
                          {getPaymentStatusText()}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {event.athlete_id && (
                  <div className="flex gap-4">
                    <User className="w-4 h-4 mt-1 text-gray-500 shrink-0" />
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-cyan-600 flex items-center justify-center text-[10px] text-white font-black uppercase">
                        {(athleteName || 'A').charAt(0)}
                      </div>
                      <span className="text-sm text-gray-800 font-bold">{athleteName || 'Atleta Associado'}</span>
                    </div>
                  </div>
                )}

                {event.description && (
                  <div className="flex gap-4">
                    <Tag className="w-4 h-4 mt-1 text-gray-500 shrink-0" />
                    <p className="text-sm text-gray-800 leading-relaxed font-medium bg-gray-50 p-2 rounded-lg border border-gray-100">{event.description}</p>
                  </div>
                )}

                {(event.result || event.feedback) && (
                  <div className="flex gap-4 pt-4 border-t border-gray-100">
                    <AlignLeft className="w-4 h-4 mt-1 text-gray-500 shrink-0" />
                    <div className="space-y-3 font-medium text-sm">
                      {event.result && (
                        <div>
                          <span className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-0.5">Resultado</span>
                          <span className="text-gray-900 bg-gray-100 px-2 py-0.5 rounded font-bold">{event.result}</span>
                        </div>
                      )}
                      {event.feedback && (
                        <div>
                          <span className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-0.5">Feedback</span>
                          <p className="text-gray-800 leading-relaxed italic border-l-2 border-gray-300 pl-2">{event.feedback}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <Clock className="w-4 h-4 mt-1 text-gray-500 shrink-0" />
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-2.5 py-1 rounded shadow-sm text-[10px] font-black uppercase tracking-widest ${colorClass}`}>
                      {event.category === 'arbitration' ? 'Arbitragem' : 
                       event.category === 'clinical' ? 'Clínico' : 
                       event.category === 'competition' ? 'Competição' : 
                       event.category === 'game' ? 'Jogo' : 
                       event.category === 'training' ? 'Treino' :
                       event.category === 'live' ? 'Live' :
                       event.category === 'professional' ? 'Profissional' : 
                       event.category === 'travel' ? 'Viagem' : 'Pessoal'}
                    </span>
                    {event.category === 'clinical' && event.status && event.status !== 'scheduled' && (
                      <span className={`px-2.5 py-1 rounded shadow-sm text-[10px] font-black uppercase tracking-widest ${
                        event.status === 'confirmed' ? 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/20' :
                        event.status === 'attended' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                        event.status === 'no_show' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                        event.status === 'cancelled' ? 'bg-slate-500/10 text-slate-500 border border-slate-500/20' :
                        ''
                      }`}>
                        {event.status === 'confirmed' ? 'Confirmado' :
                         event.status === 'attended' ? 'Compareceu' :
                         event.status === 'no_show' ? 'Faltou' :
                         'Cancelado'}
                      </span>
                    )}
                    {event.subcategory && (
                      <span className="px-2.5 py-1 bg-gray-200 rounded text-[10px] font-black text-gray-700 border border-gray-300 uppercase tracking-widest">
                        {event.subcategory}
                      </span>
                    )}
                    {event.reminder_minutes !== null && event.reminder_minutes !== undefined && (
                      <span className="px-2 py-1 bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <Bell className="w-3 h-3" />
                        Lembrete {event.reminder_minutes === 0 ? 'no horário' : `${event.reminder_minutes} min antes`}
                      </span>
                    )}
                    {event.recurrence_rule && event.recurrence_rule !== 'none' && (
                      <span className="px-2 py-1 bg-violet-100 text-violet-700 border border-violet-200 rounded text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                        <Repeat className="w-3 h-3" />
                        {event.recurrence_rule === 'daily' ? 'Diário' : 
                         event.recurrence_rule === 'weekly' ? 'Semanal' : 
                         event.recurrence_rule === 'biweekly' ? 'Quinzenal' : 
                         event.recurrence_rule === 'weekly_custom' ? 'Seman. (Personalizado)' : 
                         'Mensal'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-gray-100/50 flex flex-wrap items-center justify-between gap-3 px-6 pb-6">
                <div className="flex gap-2 flex-1 min-w-[150px]">
                   {athletePhone && (
                     <a 
                        href={generateWhatsAppLink()}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border border-emerald-200 text-xs font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-sm"
                        title="Lembrar via WhatsApp"
                     >
                       <MessageCircle className="w-4 h-4" /> Avisar
                     </a>
                   )}
                </div>
                {onEdit && (
                  <button
                    onClick={() => {
                      onClose();
                      onEdit(event);
                    }}
                    className="flex-1 min-w-[100px] px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-lg shadow-slate-900/20"
                  >
                    Editar
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
