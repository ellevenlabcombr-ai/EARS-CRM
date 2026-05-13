import React from "react";
import { format, isSameDay, startOfDay, addHours } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AgendaEvent } from "@/types/agenda";
import { EventCard } from "./EventCard";

interface DayCalendarGridProps {
  events: AgendaEvent[];
  currentDate: Date;
  onEventClick: (event: AgendaEvent) => void;
  onTimeSlotClick: (time: Date) => void;
}

export function DayCalendarGrid({ events, currentDate, onEventClick, onTimeSlotClick }: DayCalendarGridProps) {
  const START_HOUR = 8;
  const END_HOUR = 20;
  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

  const dayEvents = events.filter(e => isSameDay(new Date(e.start_time), currentDate));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
      <div className="flex-1 overflow-y-auto relative min-h-[600px]">
        {/* Pass lines */}
        {hours.map((hour, i) => (
          <div key={hour} className="flex border-b border-slate-800/50" style={{ height: '60px' }}>
            <div className="w-16 flex-shrink-0 border-r border-slate-800/50 pr-2 pt-1 text-right">
              <span className="text-xs font-medium text-slate-500">{`${hour.toString().padStart(2, '0')}:00`}</span>
            </div>
            <div 
              className="flex-1 relative group cursor-pointer hover:bg-slate-800/30 transition-colors"
              onClick={() => onTimeSlotClick(addHours(startOfDay(currentDate), hour))}
            >
              {/* Event slot */}
            </div>
          </div>
        ))}
        
        {/* Render Events Absolute */}
        <div className="absolute inset-0 left-16 ml-2 mr-2">
          {dayEvents.map(event => {
            const startStr = new Date(event.start_time);
            const endStr = new Date(event.end_time);
            
            // Calculate absolute positions
            const startMins = startStr.getHours() * 60 + startStr.getMinutes() - (START_HOUR * 60);
            const durationMins = (endStr.getTime() - startStr.getTime()) / 60000;
            
            // If it's before our start hour, we don't render correctly or we clamp it
            if (startMins + durationMins < 0) return null;
            
            const topPosition = Math.max(0, startMins);
            const height = durationMins;

            return (
              <div
                key={event.id}
                className="absolute w-full px-1"
                style={{ top: `${topPosition}px`, height: `${height}px`, minHeight: '20px' }}
              >
                <EventCard event={event} onClick={onEventClick} isMultiDay={event.is_all_day} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
