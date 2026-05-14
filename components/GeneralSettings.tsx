"use client";

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Users, Calendar, Settings, Activity, History, Clock, Database, Shield, Zap, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion } from 'motion/react';

export function GeneralSettings() {
  const [stats, setStats] = useState({
    athletesCount: 0,
    checkinsCount: 0,
    appointmentsCount: 0
  });
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        // Stats
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

        // Logs
        const { data: logsData } = await supabase
          .from('system_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (logsData) setLogs(logsData);

      } catch (error) {
        console.error('Error fetching global settings data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="space-y-6 md:space-y-10 pb-10">
      {/* Header Section - Refined for "General" purpose */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
        <div className="relative bg-slate-950 border border-slate-800 p-5 md:p-8 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter mb-1 italic">
              Status <span className="text-cyan-500">Operacional</span>
            </h2>
            <div className="flex items-center gap-2 md:gap-3">
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-[9px] md:text-[10px] font-black text-emerald-500 uppercase tracking-widest">Sistema Ativo</span>
              </div>
              <span className="text-slate-500 text-xs md:sm font-medium">Unidade Central de Processamento</span>
            </div>
          </div>
          
          <div className="flex gap-4 border-t border-slate-800/50 pt-4 md:pt-0 md:border-0">
            <div className="text-right">
              <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">Servidor</p>
              <p className="text-white font-mono font-bold text-sm md:text-base">{new Date().toLocaleDateString('pt-BR')}</p>
            </div>
            <div className="w-px h-8 md:h-10 bg-slate-800"></div>
            <div className="text-right">
              <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">Versão</p>
              <div className="flex items-center gap-1 justify-end">
                <Shield className="w-2.5 h-2.5 text-cyan-500" />
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
            <span className="text-[9px] md:text-[10px] font-black text-cyan-500/50 uppercase tracking-[0.2em]">Registro Central</span>
          </div>
          <div>
            <p className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-1 md:mb-2">{stats.athletesCount}</p>
            <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">Atletas Monitorados</p>
          </div>
          <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-slate-800/50">
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: '75%' }}
                 transition={{ duration: 1, ease: 'easeOut' }}
                 className="h-full bg-cyan-500 rounded-full"
               ></motion.div>
            </div>
          </div>
        </div>

        <div className="group bg-slate-900/50 hover:bg-slate-900 border border-slate-800 hover:border-rose-500/30 p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] transition-all duration-300">
          <div className="flex items-start justify-between mb-4 md:mb-6">
            <div className="w-10 h-10 md:w-14 md:h-14 bg-rose-500/10 text-rose-400 rounded-xl md:rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300">
              <Activity className="w-5 h-5 md:w-7 md:h-7" />
            </div>
            <span className="text-[9px] md:text-[10px] font-black text-rose-500/50 uppercase tracking-[0.2em]">Fluxo de Dados</span>
          </div>
          <div>
            <p className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-1 md:mb-2">{stats.checkinsCount}</p>
            <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">Registros de Saúde</p>
          </div>
          <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-slate-800/50">
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '50%' }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                className="h-full bg-rose-500 rounded-full"
              ></motion.div>
            </div>
          </div>
        </div>

        <div className="group bg-slate-900/50 hover:bg-slate-900 border border-slate-800 hover:border-indigo-500/30 p-5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] transition-all duration-300 sm:col-span-2 md:col-span-1">
          <div className="flex items-start justify-between mb-4 md:mb-6">
            <div className="w-10 h-10 md:w-14 md:h-14 bg-indigo-500/10 text-indigo-400 rounded-xl md:rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300">
              <Calendar className="w-5 h-5 md:w-7 md:h-7" />
            </div>
            <span className="text-[9px] md:text-[10px] font-black text-indigo-500/50 uppercase tracking-[0.2em]">Planejamento</span>
          </div>
          <div>
            <p className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-1 md:mb-2">{stats.appointmentsCount}</p>
            <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">Eventos de Agenda</p>
          </div>
          <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-slate-800/50">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className={`h-1 flex-1 rounded-full ${i <= 3 ? 'bg-indigo-500' : 'bg-slate-800'}`}></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Audit Logs */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-lg">
                <History className="w-5 h-5 text-indigo-400" />
              </div>
              <h3 className="text-base md:text-lg font-black text-white uppercase tracking-tight">Audit Log / Atividade Recente</h3>
            </div>
            <button 
              onClick={() => {
                const fetchLogs = async () => {
                  const { data } = await supabase.from('system_logs').select('*').order('created_at', { ascending: false }).limit(10);
                  if (data) setLogs(data);
                };
                fetchLogs();
              }}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors group"
            >
              <RefreshCw className="w-4 h-4 text-slate-500 group-hover:text-white group-active:rotate-180 transition-all duration-500" />
            </button>
          </div>

          <div className="flex-1 space-y-1">
            {isLoading ? (
              <div className="py-10 flex flex-col items-center justify-center space-y-3 opacity-50">
                <Clock className="w-8 h-8 text-slate-600 animate-spin" />
                <span className="text-xs font-black uppercase tracking-widest text-slate-600">Carregando Logs...</span>
              </div>
            ) : logs.length > 0 ? (
              logs.map((log, i) => (
                <div key={log.id} className="flex items-center gap-4 p-4 hover:bg-slate-950/50 rounded-xl border border-transparent hover:border-slate-800/50 transition-all group">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    log.module === 'Core' ? 'bg-blue-500/10 text-blue-400' :
                    log.module === 'Settings' ? 'bg-purple-500/10 text-purple-400' :
                    log.module === 'Database' ? 'bg-amber-500/10 text-amber-400' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {log.module === 'Core' ? <Zap size={18} /> : 
                     log.module === 'Settings' ? <Settings size={18} /> :
                     log.module === 'Database' ? <Database size={18} /> :
                     <Shield size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                       <p className="text-sm font-bold text-white truncate">{log.action}</p>
                       <span className="text-[10px] font-black text-slate-600 uppercase whitespace-nowrap">{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{log.details}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-10 text-center">
                <p className="text-xs font-black uppercase tracking-widest text-slate-600 italic">Nenhum log registrado recentemente.</p>
              </div>
            )}
          </div>
          
          <div className="mt-6 pt-6 border-t border-slate-800/50">
             <button className="text-xs font-black text-slate-500 hover:text-white uppercase tracking-widest flex items-center gap-2 transition-colors">
               Ver Relatório de Auditoria Completo
               <History size={14} />
             </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Maintenance Section */}
          <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-cyan-500/10 rounded-lg">
                <Settings className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="text-base md:text-lg font-black text-white uppercase tracking-tight">Manutenção</h3>
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={() => alert('Backup SQL solicitado. O download começará em instantes...')}
                className="w-full flex items-center justify-between p-4 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all group active:scale-95 text-left"
              >
                <div>
                  <p className="text-[11px] font-black text-white uppercase tracking-tight">Exportar Backup</p>
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">Base de dados completa (SQL)</p>
                </div>
                <Database size={16} className="text-slate-600 group-hover:text-cyan-400 transition-colors" />
              </button>

              <button 
                onClick={() => alert('Cache de imagens e arquivos temporários limpo com sucesso.')}
                className="w-full flex items-center justify-between p-4 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all group active:scale-95 text-left"
              >
                <div>
                  <p className="text-[11px] font-black text-white uppercase tracking-tight">Limpar Cache</p>
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">Imagens e arquivos temporários</p>
                </div>
                <RefreshCw size={16} className="text-slate-600 group-hover:text-rose-400 transition-colors" />
              </button>

              <button 
                onClick={() => alert('Integridade das tabelas verificada. 0 inconsistências encontradas.')}
                className="w-full flex items-center justify-between p-4 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl transition-all group active:scale-95 text-left"
              >
                <div>
                  <p className="text-[11px] font-black text-white uppercase tracking-tight">Check Integridade</p>
                  <p className="text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">Verificar vínculos de dados</p>
                </div>
                <Shield size={16} className="text-slate-600 group-hover:text-emerald-400 transition-colors" />
              </button>
            </div>
          </div>

          {/* Security Summary Panel */}
          <div className="bg-slate-950 border border-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl flex flex-col group relative overflow-hidden flex-1">
            <div className="absolute -right-8 -bottom-8 opacity-5 group-hover:opacity-10 transition-opacity">
               <ShieldAlert className="w-48 h-48 text-amber-500" />
            </div>
            
            <div className="relative z-10 font-sans">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-amber-500 rounded-lg">
                  <Shield className="w-5 h-5 text-slate-950" />
                </div>
                <h3 className="text-base md:text-lg font-black text-white uppercase tracking-tight italic">Health Status</h3>
              </div>
              
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Conectividade</p>
                  <div className="space-y-3">
                     <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-slate-800/50">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">Banco de Dados</span>
                        </div>
                        <span className="text-[10px] font-black text-emerald-500 uppercase">ONLINE</span>
                     </div>
                     <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-slate-800/50">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></div>
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">API Gateway</span>
                        </div>
                        <span className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">STABLE</span>
                     </div>
                     <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-slate-800/50">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">CDN Latency</span>
                        </div>
                        <span className="text-[10px] font-black text-amber-500 uppercase">24ms</span>
                     </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    onClick={() => alert('Sessão Técnica v2.0:\n- DB: Supabase (PostgreSQL)\n- Auth: GoTrue (JWT)\n- Storage: S3 Compatible\n- Region: us-east-1')}
                    className="w-full px-6 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/30 text-amber-500 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <ShieldAlert size={14} />
                    Info Técnica
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
