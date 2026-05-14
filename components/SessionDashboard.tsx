'use client'

import React from 'react'
import { ArrowLeft, BrainCircuit, Sparkles } from 'lucide-react'
import { motion } from 'motion/react'

export function SessionDashboard({ onBack }: { onBack?: () => void }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30 overflow-hidden flex flex-col relative">
      {/* Premium Decorative Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-sky-500/5 blur-[100px] rounded-full" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] z-0" />
      </div>

      {/* Elegant Premium Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 sticky top-0 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 px-6 py-8"
      >
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <button 
            onClick={onBack}
            className="group flex items-center gap-3 py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/10 active:scale-95"
            aria-label="Voltar"
          >
            <ArrowLeft size={18} className="text-slate-400 group-hover:text-white transition-colors" />
            <span className="text-sm font-medium text-slate-300 group-hover:text-white">Voltar</span>
          </button>
          
          <div className="flex flex-col items-end text-right">
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
              <span className="bg-gradient-to-r from-indigo-400 to-sky-400 bg-clip-text text-transparent italic">Sessão Inteligente</span>
            </h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1">
              Modo operacional do atendimento
            </p>
          </div>
        </div>
      </motion.header>

      {/* Central Content Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-6 pb-20">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md"
        >
          <div className="relative group">
            {/* Animated Glow Border */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-sky-500 rounded-[32px] blur opacity-20 group-hover:opacity-40 transition duration-1000" />
            
            <div className="relative glass-panel backdrop-blur-2xl border border-white/10 rounded-[30px] p-12 text-center flex flex-col items-center shadow-2xl">
              <div className="relative mb-10">
                <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full animate-pulse" />
                <div className="relative w-24 h-24 rounded-[2rem] bg-slate-950/80 flex items-center justify-center border border-white/5 shadow-inner transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                  <BrainCircuit size={48} className="text-indigo-400" />
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Sparkles size={14} className="text-amber-400/60" />
                  <span className="text-[9px] font-black text-indigo-400/90 uppercase tracking-[0.4em] bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                    Sistema Pronto
                  </span>
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight leading-tight italic uppercase">
                  Selecione um atleta <br /> para iniciar
                </h2>
                <div className="flex gap-1.5 justify-center mt-6">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/30" />
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500/10" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer Branding */}
      <footer className="relative z-10 p-8 text-center">
        <p className="text-[9px] font-mono text-slate-700 uppercase tracking-[0.3em]">
          Operação Inteligente Ativa • v.2.4.0
        </p>
      </footer>
    </div>
  )
}
