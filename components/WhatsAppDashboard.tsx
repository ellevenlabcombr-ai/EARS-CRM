"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ChatBox } from './ChatBox';
import { MessageSquare, Users, Loader2, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function WhatsAppDashboard() {
  const [athletes, setAthletes] = useState<any[]>([]);
  const [selectedAthlete, setSelectedAthlete] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAthletesWithContacts = async () => {
      setIsLoading(true);
      const { data: athletesData, error: athletesError } = await supabase
        .from('athletes')
        .select('id, name, phone')
        .order('name');
        
      if (athletesError || !athletesData) {
        setIsLoading(false);
        return;
      }

      setAthletes(athletesData.filter(a => a.phone));
      setIsLoading(false);
    };

    fetchAthletesWithContacts();
  }, []);

  return (
    <div 
      className="flex w-full h-full rounded-2xl overflow-hidden bg-[#050B14] border border-slate-800/50"
    >
      {/* Sidebar with Contacts */}
      <div className="w-1/3 border-r border-slate-800/50 flex flex-col bg-[#0A1120]/50">
        <div className="p-4 border-b border-slate-800/50">
          <h2 className="font-semibold text-slate-200 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-green-500" />
            Contatos (Atletas)
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : athletes.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              Nenhum atleta com telefone cadastrado.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/30">
              {athletes.map(athlete => (
                <button
                  key={athlete.id}
                  onClick={() => setSelectedAthlete(athlete)}
                  className={`w-full text-left p-4 hover:bg-slate-800/30 transition-colors ${
                    selectedAthlete?.id === athlete.id ? 'bg-slate-800/50 border-l-4 border-green-500' : 'border-l-4 border-transparent'
                  }`}
                >
                  <div className="font-medium text-sm text-slate-100">{athlete.name}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    <Phone className="w-3 h-3" />
                    {athlete.phone}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-[#050B14] overflow-hidden">
        {selectedAthlete ? (
          <ChatBox 
            athleteId={selectedAthlete.id} 
            athletePhone={selectedAthlete.phone} 
            athleteName={selectedAthlete.name} 
            inline={true} 
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
            <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-slate-500" />
            </div>
            <p>Selecione um contato para iniciar o chat</p>
          </div>
        )}
      </div>
    </div>
  );
}
