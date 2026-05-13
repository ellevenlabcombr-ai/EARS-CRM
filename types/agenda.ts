export type AgendaCategory = 'clinical' | 'professional' | 'personal' | 'competition' | 'travel' | 'arbitration' | 'game' | 'training' | 'live' | 'block';

export interface AgendaEvent {
  id: string;
  title: string;
  description: string | null;
  start_time: string;
  end_time: string;
  status?: 'scheduled' | 'confirmed' | 'cancelled' | 'attended' | 'no_show';
  category: AgendaCategory;
  subcategory: string | null;
  location?: string | null;
  address?: string | null;
  meet_link?: string | null;
  payment_status?: 'pending' | 'paid' | 'partially_paid';
  event_value?: number | null;
  is_all_day?: boolean;
  athlete_id: string | null;
  risk_score: number | null;
  priority: number;
  origin: 'manual' | 'system' | 'sync';
  result?: string | null;
  feedback?: string | null;
  created_at: string;
  reminder_minutes?: number | null;
  recurrence_rule?: string;
  recurrence_group_id?: string;
  recurrence_days?: number[];
}

export const calculatePriority = (event: Partial<AgendaEvent>): number => {
  let priority = 0;
  
  if (event.category === 'clinical') {
    priority = (Number(event.risk_score) || 0) * 0.7 + 5;
  } else if (event.category === 'competition') {
    priority = 10;
  } else if (event.category === 'game') {
    priority = 10;
  } else if (event.category === 'arbitration') {
    priority = 9;
  } else if (event.category === 'travel') {
    priority = 8;
  } else if (event.category === 'live') {
    priority = 8;
  } else if (event.category === 'professional') {
    priority = 5;
  } else if (event.category === 'training') {
    priority = 6;
  } else {
    priority = 3;
  }

  return Math.min(10, Math.max(0, priority));
};

export const getCategoryColor = (event: AgendaEvent): string => {
  if (event.category === 'block') {
    return 'bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.05)_10px,rgba(0,0,0,0.05)_20px)] bg-slate-200 text-slate-600 border-dashed border-slate-400 opacity-80';
  }
  if (event.category === 'clinical') {
    return 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-500/20';
  }
  if (event.category === 'competition') {
    return 'bg-amber-500 text-white border-amber-400 shadow-lg shadow-amber-500/20';
  }
  if (event.category === 'game') {
    return 'bg-orange-500 text-white border-orange-400 shadow-lg shadow-orange-500/20';
  }
  if (event.category === 'training') {
    return 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20';
  }
  if (event.category === 'arbitration') {
    return 'bg-fuchsia-600 text-white border-fuchsia-500 shadow-lg shadow-fuchsia-500/20';
  }
  if (event.category === 'travel') {
    return 'bg-violet-600 text-white border-violet-500 shadow-lg shadow-violet-500/20';
  }
  if (event.category === 'live') {
    return 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-500/20';
  }
  if (event.category === 'professional') {
    return 'bg-cyan-600 text-white border-cyan-500 shadow-lg shadow-cyan-500/20';
  }
  if (event.category === 'personal') {
    return 'bg-emerald-500 text-white border-emerald-400 shadow-lg shadow-emerald-500/20';
  }
  return 'bg-slate-700 text-white border-slate-600';
};
