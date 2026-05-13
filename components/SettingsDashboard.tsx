"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Palette, Calendar, HeartPulse, Database, Code, Tag, DollarSign, Settings2 } from 'lucide-react';
import { BrandingSettings } from './BrandingSettings';
import { AgendaSettings } from './AgendaSettings';
import { ClinicalSettings } from './ClinicalSettings';
import { ClinicalTagsSettings } from './ClinicalTagsSettings';
import { SportsSettings } from './SportsSettings';
import { DatabaseSeeder } from './DatabaseSeeder';
import { FinanceSettings } from './FinanceSettings';

type SettingsSection = 'branding' | 'agenda' | 'clinical' | 'tags' | 'data' | 'dev' | 'finance';

export function SettingsDashboard() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('finance');

  const sections = [
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
      title: 'Identidade Visual',
      icon: Palette,
      color: 'bg-cyan-500',
      textColor: 'text-cyan-500',
      component: <BrandingSettings />
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
      id: 'clinical' as const,
      title: 'Regras Clínicas',
      icon: HeartPulse,
      color: 'bg-rose-500',
      textColor: 'text-rose-500',
      component: <ClinicalSettings />
    },
    {
      id: 'tags' as const,
      title: 'Tags Clínicas',
      icon: Tag,
      color: 'bg-purple-500',
      textColor: 'text-purple-500',
      component: <ClinicalTagsSettings />
    },
    {
      id: 'data' as const,
      title: 'Esportes/Dados',
      icon: Database,
      color: 'bg-blue-500',
      textColor: 'text-blue-500',
      component: <SportsSettings />
    },
    {
      id: 'dev' as const,
      title: 'Dev / Avançado',
      icon: Code,
      color: 'bg-amber-500',
      textColor: 'text-amber-500',
      component: <DatabaseSeeder />
    }
  ];

  const activeComponent = sections.find(s => s.id === activeSection);

  return (
    <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto space-y-8 flex flex-col h-[calc(100vh-theme(spacing.20))]">
      <header className="flex-shrink-0 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center border border-slate-800">
          <Settings2 className="w-6 h-6 text-slate-400" />
        </div>
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-white uppercase tracking-tight">
            Configurações
          </h1>
          <p className="text-sm text-slate-400 mt-1 uppercase tracking-widest font-bold">Ajustes Globais e Preferências</p>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 flex-1 min-h-0">
        {/* Sidebar Nav */}
        <aside className="w-full lg:w-64 flex-shrink-0 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 scrollbar-hide">
          {sections.map((section) => {
            const isActive = activeSection === section.id;
            const Icon = section.icon;

            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center gap-3 w-full p-3 sm:p-4 rounded-xl text-left transition-all flex-shrink-0 lg:flex-shrink ${
                  isActive 
                    ? 'bg-slate-800/80 border border-slate-700 shadow-md' 
                    : 'bg-transparent border border-transparent hover:bg-slate-800/40 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isActive ? section.color + ' bg-opacity-20 ' + section.textColor : 'bg-slate-900 border border-slate-800 text-slate-500'
                }`}>
                  <Icon size={16} />
                </div>
                <span className={`text-xs sm:text-sm font-black uppercase tracking-wider whitespace-nowrap ${isActive ? 'text-white' : ''}`}>
                  {section.title}
                </span>
                {isActive && (
                  <ChevronRight size={16} className="ml-auto text-slate-500 hidden lg:block" />
                )}
              </button>
            );
          })}
        </aside>

        {/* Main Content */}
        <main className="flex-1 bg-slate-900/40 border border-slate-800/80 rounded-3xl overflow-y-auto relative min-h-[500px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="p-6 lg:p-8 h-full"
            >
              <div className="mb-8 pb-4 border-b border-slate-800/50 flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-opacity-20 flex items-center justify-center ${activeComponent?.color} ${activeComponent?.textColor}`}>
                    {activeComponent && <activeComponent.icon size={20} />}
                  </div>
                  <h2 className="text-xl font-black text-white uppercase tracking-wider">
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
