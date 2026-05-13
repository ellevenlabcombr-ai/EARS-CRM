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
    <div className="space-y-10 pb-10">
      {/* Header Section */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative bg-slate-950 border border-slate-800 p-8 rounded-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-2 italic">
                Ears <span className="text-cyan-500">Performance</span>
              </h2>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Sistema Ativo</span>
                </div>
                <span className="text-slate-500 text-sm font-medium">Unidade Central de Performance</span>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Data do Servidor</p>
                <p className="text-white font-mono font-bold">{new Date().toLocaleDateString('pt-BR')}</p>
              </div>
              <div className="w-px h-10 bg-slate-800"></div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Versão</p>
                <p className="text-white font-mono font-bold">v3.4.2</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="group bg-slate-900/50 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/30 p-8 rounded-[2.5rem] transition-all duration-300">
          <div className="flex items-start justify-between mb-6">
            <div className="w-14 h-14 bg-cyan-500/10 text-cyan-400 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300">
              <Users className="w-7 h-7" />
            </div>
            <span className="text-[10px] font-black text-cyan-500/50 uppercase tracking-[0.2em]">Registro Ativo</span>
          </div>
          <div>
            <p className="text-5xl font-black text-white tracking-tighter mb-2">{stats.athletesCount}</p>
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Atletas Federados</p>
          </div>
          <div className="mt-6 pt-6 border-t border-slate-800/50">
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className="w-3/4 h-full bg-cyan-500 rounded-full"></div>
            </div>
          </div>
        </div>

        <div className="group bg-slate-900/50 hover:bg-slate-900 border border-slate-800 hover:border-rose-500/30 p-8 rounded-[2.5rem] transition-all duration-300">
          <div className="flex items-start justify-between mb-6">
            <div className="w-14 h-14 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300">
              <Activity className="w-7 h-7" />
            </div>
            <span className="text-[10px] font-black text-rose-500/50 uppercase tracking-[0.2em]">Fluxo Diário</span>
          </div>
          <div>
            <p className="text-5xl font-black text-white tracking-tighter mb-2">{stats.checkinsCount}</p>
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Check-ins Brutos</p>
          </div>
          <div className="mt-6 pt-6 border-t border-slate-800/50">
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className="w-1/2 h-full bg-rose-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>

        <div className="group bg-slate-900/50 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/30 p-8 rounded-[2.5rem] transition-all duration-300">
          <div className="flex items-start justify-between mb-6">
            <div className="w-14 h-14 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300">
              <Calendar className="w-7 h-7" />
            </div>
            <span className="text-[10px] font-black text-indigo-500/50 uppercase tracking-[0.2em]">Ocupação</span>
          </div>
          <div>
            <p className="text-5xl font-black text-white tracking-tighter mb-2">{stats.appointmentsCount}</p>
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Consultas Agendadas</p>
          </div>
          <div className="mt-6 pt-6 border-t border-slate-800/50">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className={`h-1 flex-1 rounded-full ${i <= 4 ? 'bg-indigo-500' : 'bg-slate-800'}`}></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Security Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-amber-500/10 border border-amber-500/20 p-8 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
            <ShieldAlert className="w-48 h-48 text-amber-500" />
          </div>
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-amber-500 rounded-xl">
                <Settings className="w-6 h-6 text-slate-950" />
              </div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight">Privilégios de Acesso</h3>
            </div>
            <p className="text-amber-500/80 text-sm leading-relaxed mb-6 font-medium">
              Este terminal está configurado com permissões de administrador. Todas as alterações em dados financeiros e regras clínicas são logadas permanentemente para auditoria.
            </p>
            <div className="mt-auto">
              <button className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-widest rounded-lg transition-all active:scale-95">
                Revisar Documentação
              </button>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl">
          <h3 className="text-lg font-black text-white uppercase tracking-tight mb-6">Próximas Atualizações</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-2 h-2 rounded-full bg-cyan-500 mt-1.5"></div>
              <div>
                <p className="text-sm font-bold text-white uppercase tracking-tight">Sincronização Cloud</p>
                <p className="text-xs text-slate-500 mt-1">Backup automático em tempo real para múltiplos servidores.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-2 h-2 rounded-full bg-slate-700 mt-1.5"></div>
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-tight">Dashboard de Performance v4</p>
                <p className="text-xs text-slate-600 mt-1">Novos gráficos de análise biomecânica preditiva.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
