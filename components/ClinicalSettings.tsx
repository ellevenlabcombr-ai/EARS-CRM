"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Activity, 
  AlertTriangle, 
  MessageSquare, 
  CheckCircle, 
  Loader2, 
  AlertCircle,
  HeartPulse
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ClinicalSettings() {
  // Critical Thresholds
  const [criticalReadiness, setCriticalReadiness] = useState(50);
  const [criticalPain, setCriticalPain] = useState(7);

  // Attention Range
  const [attentionReadinessMin, setAttentionReadinessMin] = useState(50);
  const [attentionReadinessMax, setAttentionReadinessMax] = useState(75);
  const [attentionPainMin, setAttentionPainMin] = useState(4);
  const [attentionPainMax, setAttentionPainMax] = useState(6);

  // Messages
  const [riskMessage, setRiskMessage] = useState('Atleta em risco crítico. Avaliação médica e fisioterapêutica imediata necessária.');
  const [attentionMessage, setAttentionMessage] = useState('Atleta em estado de atenção. Monitorar carga de treino e recuperação.');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    if (!supabase) return;
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('clinical_settings')
        .select('*')
        .maybeSingle();
      
      if (error) {
        console.error("CLINICAL SETTINGS FETCH ERROR:", {
          message: error?.message,
          code: error?.code,
          details: error?.details,
          hint: error?.hint,
          full: error
        });

        const isTableMissing = error.message?.includes('relation "clinical_settings" does not exist') || 
                               error.message?.includes('schema cache') ||
                               error.details?.includes('schema cache');

        if (isTableMissing) {
          console.warn('Clinical settings table not found. Please run the database seeder.');
          setStatus('error');
          setMessage('A tabela "clinical_settings" não foi encontrada. Por favor, vá em Configurações > Desenvolvimento e clique em "Otimizar Banco (Auto-Fix)".');
          return; // Exit early, use default state
        } else {
          throw error;
        }
      }
      
      if (data) {
        setCriticalReadiness(data.critical_readiness_threshold ?? 50);
        setCriticalPain(data.critical_pain_threshold ?? 7);
        setAttentionReadinessMin(data.attention_readiness_min ?? 50);
        setAttentionReadinessMax(data.attention_readiness_max ?? 75);
        setAttentionPainMin(data.attention_pain_min ?? 4);
        setAttentionPainMax(data.attention_pain_max ?? 6);
        setRiskMessage(data.risk_message || 'Atleta em risco crítico. Avaliação médica e fisioterapêutica imediata necessária.');
        setAttentionMessage(data.attention_message || 'Atleta em estado de atenção. Monitorar carga de treino e recuperação.');
      }
    } catch (err: any) {
      console.error("CLINICAL SETTINGS CATCH ERROR:", {
        message: err?.message,
        code: err?.code,
        details: err?.details,
        hint: err?.hint,
        full: err
      });
      setStatus('error');
      setMessage(`Erro ao carregar: ${err.message || 'Erro desconhecido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!supabase) return;
    setIsSaving(true);
    setStatus('idle');

    try {
      const { data: existing, error: selectError } = await supabase
        .from('clinical_settings')
        .select('id')
        .maybeSingle();

      if (selectError) {
        console.error("CLINICAL SETTINGS SAVE SELECT ERROR:", {
          message: selectError?.message,
          code: selectError?.code,
          details: selectError?.details,
          hint: selectError?.hint,
          full: selectError
        });

        const isTableMissing = selectError.message?.includes('relation "clinical_settings" does not exist') || 
                               selectError.message?.includes('schema cache') ||
                               selectError.details?.includes('schema cache');

        if (isTableMissing) {
          throw new Error('A tabela "clinical_settings" não foi encontrada. Por favor, vá em Configurações > Desenvolvimento e clique em "Otimizar Banco (Auto-Fix)".');
        }
        throw selectError;
      }

      const payload = {
        critical_readiness_threshold: criticalReadiness,
        critical_pain_threshold: criticalPain,
        attention_readiness_min: attentionReadinessMin,
        attention_readiness_max: attentionReadinessMax,
        attention_pain_min: attentionPainMin,
        attention_pain_max: attentionPainMax,
        risk_message: riskMessage,
        attention_message: attentionMessage,
        updated_at: new Date().toISOString()
      };

      let error;
      if (existing) {
        const { error: updateError } = await supabase
          .from('clinical_settings')
          .update(payload)
          .eq('id', existing.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('clinical_settings')
          .insert([payload]);
        error = insertError;
      }

      if (error) {
        console.error("CLINICAL SETTINGS SAVE OPERATION ERROR:", {
          message: error?.message,
          code: error?.code,
          details: error?.details,
          hint: error?.hint,
          full: error
        });
        throw error;
      }

      setStatus('success');
      setMessage('Regras clínicas salvas com sucesso!');
    } catch (err: any) {
      console.error("CLINICAL SETTINGS SAVE CATCH ERROR:", {
        message: err?.message,
        code: err?.code,
        details: err?.details,
        hint: err?.hint,
        full: err
      });
      setStatus('error');
      const errorMessage = err.message || (typeof err === 'object' ? JSON.stringify(err) : String(err));
      setMessage(`Erro ao salvar: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-12 flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Carregando regras clínicas...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 pb-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        
        {/* Limites Críticos */}
        <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl space-y-6">
          <div className="flex items-center gap-3 md:gap-4 mb-2">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-rose-500/10 text-rose-500 rounded-xl md:rounded-2xl flex items-center justify-center">
              <HeartPulse className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-black text-white uppercase tracking-tight">Limites Críticos</h3>
              <p className="text-[10px] md:text-xs text-slate-500 font-medium">Define estado de risco</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Prontidão menor que</label>
              <div className="relative">
                <input 
                  type="number" 
                  value={criticalReadiness}
                  onChange={(e) => setCriticalReadiness(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-rose-500/50 focus:ring-2 focus:ring-rose-500/10 outline-none transition-all text-sm md:text-base font-medium"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] md:text-xs font-black text-slate-600">%</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Dor maior ou igual a</label>
              <input 
                type="number" 
                value={criticalPain}
                onChange={(e) => setCriticalPain(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-rose-500/50 focus:ring-2 focus:ring-rose-500/10 outline-none transition-all text-sm md:text-base font-medium"
                min="0"
                max="10"
              />
            </div>
          </div>
        </div>

        {/* Faixa de Atenção */}
        <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl space-y-6">
          <div className="flex items-center gap-3 md:gap-4 mb-2">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-500/10 text-amber-500 rounded-xl md:rounded-2xl flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-black text-white uppercase tracking-tight">Faixa de Atenção</h3>
              <p className="text-[10px] md:text-xs text-slate-500 font-medium">Define estado de alerta leve</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Prontidão</label>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  value={attentionReadinessMin}
                  onChange={(e) => setAttentionReadinessMin(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-3 text-white focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 outline-none transition-all text-center text-sm md:text-base font-medium"
                />
                <span className="text-slate-600 font-bold">-</span>
                <input 
                  type="number" 
                  value={attentionReadinessMax}
                  onChange={(e) => setAttentionReadinessMax(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-3 text-white focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 outline-none transition-all text-center text-sm md:text-base font-medium"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Dor</label>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  value={attentionPainMin}
                  onChange={(e) => setAttentionPainMin(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-3 text-white focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 outline-none transition-all text-center text-sm md:text-base font-medium"
                  min="0" max="10"
                />
                <span className="text-slate-600 font-bold">-</span>
                <input 
                  type="number" 
                  value={attentionPainMax}
                  onChange={(e) => setAttentionPainMax(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-3 text-white focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 outline-none transition-all text-center text-sm md:text-base font-medium"
                  min="0" max="10"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mensagens Padrão */}
      <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl space-y-6">
        <div className="flex items-center gap-3 md:gap-4 mb-2">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-cyan-500/10 text-cyan-400 rounded-xl md:rounded-2xl flex items-center justify-center">
            <MessageSquare className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <h3 className="text-sm md:text-base font-black text-white uppercase tracking-tight">Mensagens Padrão</h3>
            <p className="text-[10px] md:text-xs text-slate-500 font-medium">Textos automáticos na avaliação</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] md:text-xs font-black text-rose-400 uppercase tracking-widest pl-1">Mensagem de Risco</label>
            <textarea 
              value={riskMessage}
              onChange={(e) => setRiskMessage(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-rose-500/50 focus:ring-2 focus:ring-rose-500/10 outline-none transition-all resize-none h-24 text-sm md:text-base font-medium placeholder:text-slate-600"
              placeholder="Ex: Atleta em risco crítico..."
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] md:text-xs font-black text-amber-400 uppercase tracking-widest pl-1">Mensagem de Atenção</label>
            <textarea 
              value={attentionMessage}
              onChange={(e) => setAttentionMessage(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 outline-none transition-all resize-none h-24 text-sm md:text-base font-medium placeholder:text-slate-600"
              placeholder="Ex: Atleta em estado de atenção..."
            />
          </div>
        </div>
      </div>

      <div className="pt-6 md:pt-8 border-t border-slate-800/50 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex-1 w-full">
          {status !== 'idle' && (
            <div className={`p-4 rounded-xl border flex items-center gap-3 ${
              status === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}>
              {status === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
              <span className="text-[10px] md:text-xs font-black uppercase tracking-wider">{message}</span>
            </div>
          )}
        </div>

        <Button 
          onClick={handleSave}
          disabled={isSaving}
          className="w-full md:w-auto bg-rose-500 hover:bg-rose-400 text-white font-black uppercase tracking-widest px-8 md:px-10 py-5 md:py-6 rounded-xl md:rounded-2xl shadow-lg shadow-rose-500/20 transition-all active:scale-95 text-xs md:text-sm"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Salvando...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 md:w-5 md:h-5 mr-2" />
              Salvar Regras
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
