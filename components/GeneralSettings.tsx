"use client";

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Users, Calendar, Settings, Activity } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function GeneralSettings() {
  const [stats, setStats] = useState({
    athletesCount: 0,
    checkinsCount: 0,
    appointmentsCount: 0
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const { count: athletesCount } = await supabase
          .from('athletes')
          .select('*', { count: 'exact', head: true });
          
        const { count: checkinsCount } = await supabase
          .from('check_ins')
          .select('*', { count: 'exact', head: true });
          
        const { count: appointmentsCount } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true });

        setStats({
          athletesCount: athletesCount || 0,
          checkinsCount: checkinsCount || 0,
          appointmentsCount: appointmentsCount || 0
        });
      } catch (error) {
        console.error('Error fetching global stats:', error);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="space-y-8 pb-10">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Visão Geral do Sistema</h2>
        <p className="text-slate-400">Resumo da sua organização e configurações de acesso.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem]">
          <div className="w-12 h-12 bg-cyan-500/10 text-cyan-400 rounded-full flex items-center justify-center mb-4">
            <Users className="w-6 h-6" />
          </div>
          <p className="text-3xl font-black text-white">{stats.athletesCount}</p>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Atletas Registrados</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem]">
          <div className="w-12 h-12 bg-rose-500/10 text-rose-400 rounded-full flex items-center justify-center mb-4">
            <Activity className="w-6 h-6" />
          </div>
          <p className="text-3xl font-black text-white">{stats.checkinsCount}</p>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Check-ins Realizados</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem]">
          <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center mb-4">
            <Calendar className="w-6 h-6" />
          </div>
          <p className="text-3xl font-black text-white">{stats.appointmentsCount}</p>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Agendamentos</p>
        </div>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
          <ShieldAlert className="w-32 h-32 text-amber-500" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="w-6 h-6 text-amber-500" />
            <h3 className="text-lg font-black text-white uppercase tracking-tight">Painel de Configurações</h3>
          </div>
          <p className="text-amber-500/80 max-w-xl text-sm leading-relaxed mb-6">
            Você está na área de administração do sistema. Use o menu de navegação acima para acessar módulos específicos, como dados financeiros, relatórios clínicos e identidade visual. 
          </p>
          <p className="text-amber-500/80 max-w-xl text-sm leading-relaxed font-bold">
            Páginas com informações sensíveis, como o módulo Financeiro e Regras Clínicas, estão protegidas e requerem navegação explícita.
          </p>
        </div>
      </div>
    </div>
  );
}
