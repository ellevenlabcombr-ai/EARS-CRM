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
    <div className="space-y-6 md:space-y-10 pb-10">
      {/* Header Section */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
        <div className="relative bg-slate-950 border border-slate-800 p-5 md:p-8 rounded-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter mb-1 italic">
                Ears <span className="text-cyan-500">Performance</span>
              </h2>
              <div className="flex items-center gap-2 md:gap-3">
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-[9px] md:text-[10px] font-black text-emerald-500 uppercase tracking-widest">Sistema Ativo</span>
                </div>
                <span className="text-slate-500 text-xs md:sm font-medium">Unidade Central</span>
              </div>
            </div>
            
            <div className="flex gap-4 border-t  pt-4 md:pt-0 md:border-0">
              <div className="text-right">
                <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">Servidor</p>
                <p className="text-white font-mono font-bold text-sm md:text-base">{new Date().toLocaleDateString('pt-BR')}</p>
              </div>
              <div className="w-px h-8 md:h-10 bg-slate-800"></div>
              <div className="text-right">
                <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">Versão</p>
                <p className="text-white font-mono font-bold text-sm md:text-base">v3.4.2</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <div className="group bg-slate-900/50 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/30 p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] transition-all duration-300">
          <div className="flex items-start justify-between mb-4 md:mb-6">
            <div className="w-10 h-10 md:w-14 md:h-14 bg-cyan-500/10 text-cyan-400 rounded-xl md:rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300">
              <Users className="w-5 h-5 md:w-7 md:h-7" />
            </div>
            <span className="text-[9px] md:text-[10px] font-black text-cyan-500/50 uppercase tracking-[0.2em]">Registro</span>
          </div>
          <div>
            <p className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-1 md:mb-2">{stats.athletesCount}</p>
            <p className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest">Atletas</p>
          </div>
          <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t ">
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className="w-3/4 h-full bg-cyan-500 rounded-full"></div>
            </div>
          </div>
        </div>

        <div className="group bg-slate-900/50 hover:bg-slate-900 border border-slate-800 hover:border-rose-500/30 p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] transition-all duration-300">
          <div className="flex items-start justify-between mb-4 md:mb-6">
            <div className="w-10 h-10 md:w-14 md:h-14 bg-rose-500/10 text-rose-400 rounded-xl md:rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300">
              <Activity className="w-5 h-5 md:w-7 md:h-7" />
            </div>
            <span className="text-[9px] md:text-[10px] font-black text-rose-500/50 uppercase tracking-[0.2em]">Fluxo</span>
          </div>
          <div>
            <p className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-1 md:mb-2">{stats.checkinsCount}</p>
            <p className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest">Check-ins</p>
          </div>
          <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t ">
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className="w-1/2 h-full bg-rose-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>

        <div className="group bg-slate-900/50 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/30 p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] transition-all duration-300 sm:col-span-2 md:col-span-1">
          <div className="flex items-start justify-between mb-4 md:mb-6">
            <div className="w-10 h-10 md:w-14 md:h-14 bg-indigo-500/10 text-indigo-400 rounded-xl md:rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300">
              <Calendar className="w-5 h-5 md:w-7 md:h-7" />
            </div>
            <span className="text-[9px] md:text-[10px] font-black text-indigo-500/50 uppercase tracking-[0.2em]">Agenda</span>
          </div>
          <div>
            <p className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-1 md:mb-2">{stats.appointmentsCount}</p>
            <p className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest">Consultas</p>
          </div>
          <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t ">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className={`h-1 flex-1 rounded-full ${i <= 3 ? 'bg-indigo-500' : 'bg-slate-800'}`}></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Security and Updates Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-amber-500/10 border border-amber-500/20 p-6 md:p-8 rounded-2xl md:rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
            <ShieldAlert className="w-32 md:w-48 h-32 md:h-48 text-amber-500" />
          </div>
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
              <div className="p-2 md:p-3 bg-amber-500 rounded-lg md:rounded-xl">
                <Settings className="w-5 h-5 md:w-6 md:h-6 text-slate-950" />
              </div>
              <h3 className="text-base md:text-xl font-black text-white uppercase tracking-tight">Privilégios de Acesso</h3>
            </div>
            <p className="text-amber-500/80 text-[11px] md:text-sm leading-relaxed mb-4 md:mb-6 font-medium">
              Este terminal está configurado com permissões de administrador. Todas as alterações em dados financeiros e regras clínicas são logadas permanentemente para auditoria.
            </p>
            <div className="mt-auto">
              <button 
                onClick={() => alert('Documentação de Segurança v2.0 carregada: \n1. MFA Opcional \n2. Role Based Access \n3. AES-256 Encryption')}
                className="w-full md:w-auto px-4 md:px-6 py-2 md:py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[9px] md:text-xs font-black uppercase tracking-widest rounded-lg transition-all active:scale-95"
              >
                Revisar Documentação
              </button>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl flex flex-col">
          <h3 className="text-lg font-black text-white uppercase tracking-tight mb-6 mt-1 text-center md:text-left">Próximas Atualizações</h3>
          <div className="space-y-4 flex-1 flex flex-col justify-center">
            <div className="flex items-start gap-4 p-4 bg-slate-950/50 rounded-2xl  transition-colors hover:border-cyan-500/30">
              <div className="w-10 h-10 bg-cyan-500/10 text-cyan-400 rounded-lg flex items-center justify-center flex-shrink-0">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-white uppercase tracking-tight">Sincronização Cloud</p>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">Backup automático em tempo real para múltiplos servidores com redundância global.</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-slate-950/50 rounded-2xl border  opacity-60 transition-opacity hover:opacity-100">
              <div className="w-10 h-10 bg-slate-800 text-slate-400 rounded-lg flex items-center justify-center flex-shrink-0">
                <Settings className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-tight">AI Engine v4</p>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">Novos gráficos de análise biomecânica preditiva e análise de fadiga por sensores IoT.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
