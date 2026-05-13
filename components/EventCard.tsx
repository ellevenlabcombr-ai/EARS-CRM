"use client";

import React from "react";
import { AgendaEvent, getCategoryColor } from "@/types/agenda";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Bell, Check, CheckCircle2, XCircle } from "lucide-react";

interface EventCardProps {
  event: AgendaEvent;
  onClick: (event: AgendaEvent) => void;
  isMultiDay?: boolean;
}

export function EventCard({ event, onClick, isMultiDay }: EventCardProps) {
  const colorClass = getCategoryColor(event);
  let startTimeStr = "00:00";
  try {
    if (event.start_time) {
      const parsed = new Date(event.start_time);
      if (!isNaN(parsed.getTime())) startTimeStr = format(parsed, "HH:mm");
    }
  } catch {}
  
  const getStatusIcon = () => {
    if (event.category === 'clinical' && event.status) {
       if (event.status === 'confirmed' || event.status === 'attended') return <CheckCircle2 className="w-3 h-3 shrink-0" />;
       if (event.status === 'no_show' || event.status === 'cancelled') return <XCircle className="w-3 h-3 shrink-0 opacity-50" />;
    }
    return null;
  }
  
  if (isMultiDay) {
    return (
      <div 
        onClick={() => onClick(event)}
        className={`px-2 py-1 rounded border text-left cursor-pointer transition-all hover:brightness-110 active:scale-95 ${colorClass} h-full overflow-hidden flex items-center shrink-0`}
      >
        {getStatusIcon()}
        <span className={`text-[10px] font-black leading-none truncate block w-full ${getStatusIcon() ? 'ml-1' : ''}`}>{event.title}</span>
      </div>
    );
  }

  return (
    <div 
      onClick={() => onClick(event)}
      className={`px-2 py-1 rounded border text-left cursor-pointer transition-all hover:brightness-110 active:scale-95 ${colorClass} h-full overflow-hidden flex flex-col justify-center relative`}
    >
      <div className="flex items-center justify-between gap-1.5 w-full">
        <span className="text-[10px] font-black leading-none truncate flex-1 min-w-0 flex items-center gap-1">
          {event.reminder_minutes !== null && event.reminder_minutes !== undefined && (
            <Bell className="w-3 h-3 shrink-0 opacity-70" />
          )}
          {getStatusIcon()}
          <span className="truncate">{event.title}</span>
        </span>
        {!event.is_all_day && (
          <span className="text-[9px] font-black uppercase tracking-tighter opacity-70 shrink-0">
            {startTimeStr}
          </span>
        )}
      </div>
    </div>
  );
}
