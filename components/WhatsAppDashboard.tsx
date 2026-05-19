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
      className="flex w-full rounded-2xl overflow-hidden bg-[#0a1014] border border-[#222d34]"
      style={{ height: 'calc(100dvh - 180px)' }}
    >
      {/* Sidebar with Contacts */}
      <div className="w-1/3 border-r border-[#222d34] flex flex-col bg-[#111b21]">
        <div className="p-4 border-b border-[#222d34] bg-[#202c33]">
          <h2 className="font-semibold text-[#e9edef] flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#00a884]" />
            Contatos (Atletas)
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#8696a0]" />
            </div>
          ) : athletes.length === 0 ? (
            <div className="p-8 text-center text-[#8696a0] text-sm">
              Nenhum atleta com telefone cadastrado.
            </div>
          ) : (
            <div className="divide-y divide-[#222d34]">
              {athletes.map(athlete => (
                <button
                  key={athlete.id}
                  onClick={() => setSelectedAthlete(athlete)}
                  className={`w-full text-left p-4 hover:bg-[#202c33] transition-colors ${
                    selectedAthlete?.id === athlete.id ? 'bg-[#2a3942]' : ''
                  }`}
                >
                  <div className="font-medium text-sm text-[#e9edef]">{athlete.name}</div>
                  <div className="text-xs text-[#8696a0] flex items-center gap-1 mt-1">
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
      <div className="flex-1 flex flex-col bg-[#0b141a] overflow-hidden">
        {selectedAthlete ? (
          <ChatBox 
            athleteId={selectedAthlete.id} 
            athletePhone={selectedAthlete.phone} 
            athleteName={selectedAthlete.name} 
            inline={true} 
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-[#8696a0]">
            <div className="w-16 h-16 bg-[#202c33] rounded-full flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-[#8696a0]" />
            </div>
            <p>Selecione um contato para iniciar o chat</p>
          </div>
        )}
      </div>
    </div>
  );
}
