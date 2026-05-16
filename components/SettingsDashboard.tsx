"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home, ChevronRight, Palette, Calendar, HeartPulse, Database, Code, Tag, DollarSign, Settings2 } from 'lucide-react';
import { GeneralSettings } from './GeneralSettings';
import { BrandingSettings } from './BrandingSettings';
import { AgendaSettings } from './AgendaSettings';
import { ClinicalSettings } from './ClinicalSettings';
import { ClinicalTagsSettings } from './ClinicalTagsSettings';
import { SportsSettings } from './SportsSettings';
import { DatabaseSeeder } from './DatabaseSeeder';
import { FinanceSettings } from './FinanceSettings';
import { AutomationSettings } from './AutomationSettings';
import { MessageCircle } from 'lucide-react';

type SettingsSection = 'general' | 'finance' | 'branding' | 'agenda' | 'clinical' | 'tags' | 'data' | 'dev' | 'automation';

export function SettingsDashboard() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('general');

  const sections = [
    {
      id: 'general' as const,
      title: 'Geral',
      icon: Home,
      color: 'bg-slate-500',
      textColor: 'text-slate-500',
      component: <GeneralSettings />
    },
    {
      id: 'agenda' as const,
      title: 'Agenda',
      icon: Calendar,
      color: 'bg-indigo-500',
      textColor: 'text-indigo-500',
      component: <AgendaSettings />
    },
    {
      id: 'automation' as const,
      title: 'Automação',
      icon: MessageCircle,
      color: 'bg-cyan-500',
      textColor: 'text-cyan-500',
      component: <AutomationSettings />
    },
    {
      id: 'dev' as const,
      title: 'Desenv.',
      icon: Code,
      color: 'bg-amber-500',
      textColor: 'text-amber-500',
      component: <DatabaseSeeder />
    },
    {
      id: 'data' as const,
      title: 'Esportes',
      icon: Database,
      color: 'bg-blue-500',
      textColor: 'text-blue-500',
      component: <SportsSettings />
    },
    {
      id: 'finance' as const,
      title: 'Financeiro',
      icon: DollarSign,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-500',
      component: <FinanceSettings />
    },
    {
      id: 'branding' as const,
      title: 'Identidade',
      icon: Palette,
      color: 'bg-cyan-500',
      textColor: 'text-cyan-500',
      component: <BrandingSettings />
    },
    {
      id: 'clinical' as const,
      title: 'Regras',
      icon: HeartPulse,
      color: 'bg-rose-500',
      textColor: 'text-rose-500',
      component: <ClinicalSettings />
    },
    {
      id: 'tags' as const,
      title: 'Tags',
      icon: Tag,
      color: 'bg-purple-500',
      textColor: 'text-purple-500',
      component: <ClinicalTagsSettings />
    }
  ];

  const activeComponent = sections.find(s => s.id === activeSection);

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto space-y-8 flex flex-col">
      <header className="flex-shrink-0 flex items-center gap-4 mb-4">
        <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center border border-slate-800">
          <Settings2 className="w-7 h-7 text-slate-400" />
        </div>
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-white uppercase tracking-tight">
            Configurações
          </h1>
          <p className="text-sm text-slate-400 mt-1 uppercase tracking-widest font-bold">Ajustes Globais e Preferências</p>
        </div>
      </header>

      {/* Horizontal Nav - Timeline Style */}
      <div className="overflow-x-auto custom-scrollbar pb-6 pt-2 w-full flex justify-center">
        <div className="flex items-center justify-start sm:justify-center min-w-max px-2 gap-3 md:gap-5">
          {sections.map((section, i, arr) => {
            const activeIndex = arr.findIndex(t => t.id === activeSection);
            const isActive = activeSection === section.id;
            const Icon = section.icon;

            return (
              <React.Fragment key={section.id}>
                <div 
                  className={`flex flex-col items-center gap-2 cursor-pointer transition-all ${isActive ? 'scale-110' : 'opacity-60 hover:opacity-100'}`}
                  onClick={() => setActiveSection(section.id)}
                >
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border-[2px] md:border-[3px] ${isActive ? 'border-cyan-500 bg-cyan-500/10 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]' : 'border-slate-700 bg-slate-900/50 text-slate-400'}`}>
                    <Icon className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  <span className={`text-[0.6rem] md:text-[0.65rem] font-black uppercase tracking-widest text-center max-w-[5rem] leading-tight whitespace-pre-line ${isActive ? 'text-cyan-400' : 'text-slate-500'}`}>
                    {section.title}
                  </span>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-6 w-full items-start">
        {/* Main Content */}
        <main className="flex-1 w-full bg-slate-900/40 border border-slate-800/80 rounded-3xl relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: -10 }}
              transition={{ duration: 0.2 }}
              className="p-6 lg:p-8"
            >
              <div className="mb-8 pb-4 border-b border-slate-800/50 flex flex-col gap-2">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-opacity-20 flex items-center justify-center ${activeComponent?.color} ${activeComponent?.textColor}`}>
                    {activeComponent && <activeComponent.icon size={26} />}
                  </div>
                  <h2 className="text-xl lg:text-2xl font-black text-white uppercase tracking-wider whitespace-pre-line">
                    {activeComponent?.title}
                  </h2>
                </div>
              </div>
              
              <div className="nested-settings-wrapper">
                {activeComponent?.component}
              </div>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
