import React from 'react';
import { motion } from 'motion/react';

interface Sport {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  target_athletes?: number;
}

interface SportTargetsBarProps {
  sports: Sport[];
  athletes: any[];
}

export const SportTargetsBar: React.FC<SportTargetsBarProps> = ({ sports, athletes }) => {
  if (!sports || sports.length === 0) return null;

  return (
    <div className="px-6 py-3 bg-[#0A1120]/20 border-b border-slate-800/20 overflow-hidden shrink-0">
      <div className="flex items-center gap-6 overflow-x-auto pb-2 no-scrollbar font-sans scroll-smooth">
        {sports.map(sport => {
          const count = athletes.filter(a => (a as any).modalidade === sport.name || a.sport === sport.name).length;
          const target = sport.target_athletes || 20;
          const percentage = Math.min(100, (count / target) * 100);
          const color = sport.color || '#06b6d4';
          
          return (
            <div key={sport.id} className="min-w-[140px] flex flex-col gap-1.5 group cursor-default">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg leading-none shrink-0">{sport.icon || '🏆'}</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate max-w-[80px]">{sport.name}</span>
                </div>
                <span className="text-[10px] font-black text-slate-200 shrink-0">{count}/{target}</span>
              </div>
              <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  className="h-full rounded-full transition-all duration-1000"
                  style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}40` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
