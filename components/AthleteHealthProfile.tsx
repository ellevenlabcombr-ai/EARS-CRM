"use client";

import React, { useState } from 'react';
import { SessionModePanel } from './ears/SessionModePanel';

export const AthleteHealthProfile = ({ athlete = { id: '1', name: 'Cristina Jorge', status: 'Ativo', riskLevel: 'Baixo', readiness: 52 }, onBack = () => {} }) => {
  const [isSessionMode, setIsSessionMode] = useState(true);

  // Mocking the data for the session panel
  const clinicalSessionData = { masterScore: 52, acwr: 1.73, painLevel: 5, fatigue: 3, sleepQuality: 4, readinessTrend: -1 };
  const wellnessHistory = [{}];
  const clinicalAssessments = [];
  const prontuarioNotes = [{
    date: new Date().toISOString(),
    text: "Sessão Anterior - Controle de Dor",
    professional: "Fisioterapeuta EAR/S"
  }];

  const handleSaveSession = async (data: any) => {
    alert("Sessão Salva com Sucesso: " + JSON.stringify(data));
    setIsSessionMode(false);
  };

  const renderEvolutionFormBody = () => (
    <div className="space-y-4 p-4">
      <h3 className="text-xl font-bold text-white mb-4">Nova Evolução Completa</h3>
      <div className="space-y-4">
          <h4 className="text-sm font-bold text-slate-400">Contexto</h4>
          <textarea className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white" placeholder="Subjetivo..."></textarea>
          
          <button 
           onClick={() => handleSaveSession({ evolution: "mock" })}
           className="w-full py-4 mt-4 bg-emerald-500 hover:bg-emerald-400 rounded-xl font-bold text-slate-900 text-lg uppercase">
            Confirmar Registro
          </button>
      </div>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#020617] text-slate-200 overflow-x-hidden font-sans">
      <div className="p-8">
        <button className="bg-cyan-500 text-black px-6 py-3 rounded-full font-bold" onClick={() => setIsSessionMode(true)}>Abrir Sessão Inteligente</button>
      </div>
      
      {isSessionMode && (
        <SessionModePanel 
          athlete={athlete}
          clinicalSessionData={clinicalSessionData}
          wellnessHistory={wellnessHistory}
          clinicalAssessments={clinicalAssessments}
          prontuarioNotes={prontuarioNotes}
          isLoading={false}
          onSaveSession={handleSaveSession}
          onClose={() => setIsSessionMode(false)}
          onViewFullProntuario={() => {}}
          evolutionForm={renderEvolutionFormBody()}
        />
      )}
    </div>
  );
};

export default AthleteHealthProfile;
