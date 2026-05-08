import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface SessionDashboardProps {
  onBack?: () => void;
}

export function SessionDashboard({ onBack }: SessionDashboardProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-4">
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={onBack}
          className="p-2 rounded-full bg-slate-900 hover:bg-slate-800 transition-colors border border-slate-800"
          aria-label="Voltar"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold">Sessão Inteligente</h1>
      </div>
    </div>
  );
}

