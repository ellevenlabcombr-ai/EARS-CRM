"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'motion/react';
import { Plus, Trash, CheckCircle2, Lock, Target, TrendingUp, X } from 'lucide-react';
import { getLocalDateString } from '@/lib/utils';

export function FinanceSettings() {
  const [categories, setCategories] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [closures, setClosures] = useState<any[]>([]);
  
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState('income');
  
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!supabase) return;
    try {
      const [catsRes, goalsRes, closuresRes] = await Promise.all([
        supabase.from('financial_categories').select('*').order('name'),
        supabase.from('financial_goals').select('*').order('created_at', { ascending: false }),
        supabase.from('financial_closures').select('*').order('month', { ascending: false })
      ]);
      if (catsRes.data) setCategories(catsRes.data);
      if (goalsRes.data) setGoals(goalsRes.data);
      if (closuresRes.data) setClosures(closuresRes.data);
    } catch (err: any) {
      console.warn("Tabelas podem não existir ainda", err);
    }
  };

  const showMessage = (text: string, type: 'error'|'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const addCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      const { error } = await supabase.from('financial_categories').insert({ name: newCatName, type: newCatType });
      if (error) throw error;
      setNewCatName('');
      fetchData();
      showMessage('Categoria adicionada!', 'success');
    } catch (err: any) {
      showMessage('Erro: execute o SQL finance_extensions. ' + err.message, 'error');
    }
  };

  const deleteCategory = async (id: string, isDefault: boolean) => {
    if (isDefault) {
      showMessage('Não é possível apagar a categoria padrão.', 'error');
      return;
    }
    if (!confirm('Deseja excluir esta categoria?')) return;
    try {
      await supabase.from('financial_categories').delete().eq('id', id);
      fetchData();
    } catch (error: any) {
      showMessage(error.message, 'error');
    }
  };

  const addGoal = async () => {
    if (!newGoalName.trim() || !newGoalTarget) return;
    try {
      const { error } = await supabase.from('financial_goals').insert({ 
        name: newGoalName, 
        target_amount: parseFloat(newGoalTarget),
        current_amount: 0
      });
      if (error) throw error;
      setNewGoalName('');
      setNewGoalTarget('');
      fetchData();
      showMessage('Meta criada!', 'success');
    } catch (err: any) {
      showMessage('Erro: execute o SQL finance_extensions. ' + err.message, 'error');
    }
  };

  const deleteGoal = async (id: string) => {
    if (!confirm('Deseja excluir esta meta?')) return;
    try {
      await supabase.from('financial_goals').delete().eq('id', id);
      fetchData();
    } catch (error: any) {
      showMessage(error.message, 'error');
    }
  };

  const closeMonth = async () => {
    const currentMonth = getLocalDateString().substring(0, 7); // YYYY-MM
    if (!confirm(`Deseja realizar o fechamento do mês atual (${currentMonth})? Isso criará um registro do saldo final e impedirá transações retroativas.`)) return;
    try {
      // Calculates current real balance
      const { data: transactions } = await supabase.from('financial_transactions').select('amount, type, status').eq('status', 'paid');
      let balance = 0;
      transactions?.forEach(t => {
        if (t.type === 'income') balance += t.amount;
        if (t.type === 'expense') balance -= t.amount;
      });

      const { error } = await supabase.from('financial_closures').insert({
        month: currentMonth,
        final_balance: balance
      });
      if (error) throw error;
      fetchData();
      showMessage(`Mês ${currentMonth} fechado com sucesso! Saldo final: R$ ${balance.toFixed(2)}`, 'success');
    } catch (err: any) {
      if (err.message.includes('unique constraint')) {
        showMessage('Este mês já foi fechado.', 'error');
      } else {
        showMessage('Erro ao fechar mês. Verifique as tabelas.' + err.message, 'error');
      }
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 pb-10 text-white">
      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-2 font-bold ${message.type === 'error' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
          <CheckCircle2 size={16} /> {message.text}
        </div>
      )}

      {/* Caixinhas de Metas */}
      <section className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl">
        <div className="flex items-center gap-3 md:gap-4 mb-6 border-b border-slate-800/50 pb-4">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-500/10 text-amber-500 rounded-xl md:rounded-2xl flex items-center justify-center"><Target className="w-5 h-5 md:w-6 md:h-6" /></div>
          <div>
            <h3 className="text-sm md:text-base font-black text-white uppercase tracking-tight">Metas & Vaquinhas</h3>
            <p className="text-[10px] md:text-xs text-slate-500 font-medium">Crie metas de arrecadação para kit, torneios, etc.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h4 className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Nova Meta</h4>
            <div className="space-y-4">
              <input value={newGoalName} onChange={e=>setNewGoalName(e.target.value)} type="text" placeholder="Nome da meta (ex: Torneio Nacional)" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-sm md:text-base font-medium focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 outline-none transition-all placeholder:text-slate-600" />
              <input value={newGoalTarget} onChange={e=>setNewGoalTarget(e.target.value)} type="number" placeholder="Valor alvo (R$)" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-sm md:text-base font-medium focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 outline-none transition-all placeholder:text-slate-600" />
              <button onClick={addGoal} className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-[#050B14] rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors text-xs md:text-sm">
                <Plus size={18} /> Criar Caixinha
              </button>
            </div>
          </div>

          <div>
            <h4 className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Metas Ativas</h4>
            <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
              {goals.length === 0 ? <div className="border border-dashed border-slate-800 rounded-xl p-6 text-center"><p className="text-slate-500 text-[10px] md:text-xs font-medium">Nenhuma meta criada.</p></div> : goals.map(g => (
                <div key={g.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex justify-between items-center group hover:border-amber-500/30 transition-colors">
                  <div>
                    <h5 className="font-bold text-slate-300 text-sm">{g.name}</h5>
                    <p className="text-[10px] md:text-xs text-amber-500 font-bold mt-1 tracking-wider uppercase">Alvo: R$ {g.target_amount}</p>
                  </div>
                  <button onClick={() => deleteGoal(g.id)} className="text-slate-600 hover:text-rose-500 p-2 bg-slate-900 hover:bg-rose-500/10 rounded-lg transition-colors"><Trash size={16} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Regras e Fechamento */}
      <section className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl">
        <div className="flex items-center gap-3 md:gap-4 mb-6 border-b border-slate-800/50 pb-4">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-500/10 text-indigo-500 rounded-xl md:rounded-2xl flex items-center justify-center"><Lock className="w-5 h-5 md:w-6 md:h-6" /></div>
          <div>
            <h3 className="text-sm md:text-base font-black text-white uppercase tracking-tight">Fechamento Mensal</h3>
            <p className="text-[10px] md:text-xs text-slate-500 font-medium">Trave registros e importe saldo</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="flex-1 space-y-4">
            <p className="text-[10px] md:text-xs text-slate-400 font-medium leading-relaxed max-w-sm">Ao fechar o mês atual, impedimos que transações passadas retroativas modifiquem os relatórios consolidados.</p>
            <button onClick={closeMonth} className="px-6 py-4 md:py-5 w-full md:w-auto bg-indigo-500 hover:bg-indigo-400 text-white font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all rounded-xl z-20 active:scale-95 text-xs md:text-sm shadow-lg shadow-indigo-500/20">
              <Lock size={18} /> Finalizar Mês de {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </button>
          </div>

          <div className="flex-1 w-full">
             <h4 className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Meses Fechados</h4>
             <div className="space-y-2">
               {closures.length === 0 ? <div className="border border-dashed border-slate-800 rounded-xl p-6 text-center"><p className="text-slate-500 text-[10px] md:text-xs font-medium">Nenhum mês fechado.</p></div> : closures.map(c => (
                 <div key={c.id} className="flex justify-between items-center bg-slate-950 border border-slate-800 px-4 py-3 rounded-xl hover:border-indigo-500/30 transition-colors">
                   <span className="font-bold text-slate-300 text-xs md:text-sm">{c.month}</span>
                   <span className="text-[10px] md:text-xs font-black text-white uppercase tracking-widest">Saldo: R$ {c.final_balance}</span>
                 </div>
               ))}
             </div>
          </div>
        </div>
      </section>

      {/* Categorias Customizadas */}
      <section className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl">
        <div className="flex items-center gap-3 md:gap-4 mb-6 border-b border-slate-800/50 pb-4">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-500/10 text-emerald-500 rounded-xl md:rounded-2xl flex items-center justify-center"><TrendingUp className="w-5 h-5 md:w-6 md:h-6" /></div>
          <div>
            <h3 className="text-sm md:text-base font-black text-white uppercase tracking-tight">Categorias</h3>
            <p className="text-[10px] md:text-xs text-slate-500 font-medium">Adicione novas categorias para receitas e despesas.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h4 className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Nova Categoria</h4>
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button onClick={() => setNewCatType('income')} className={`flex-1 py-3 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-lg transition-colors ${newCatType === 'income' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}>Receita</button>
              <button onClick={() => setNewCatType('expense')} className={`flex-1 py-3 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-lg transition-colors ${newCatType === 'expense' ? 'bg-rose-500/20 text-rose-400' : 'text-slate-500 hover:text-slate-300'}`}>Despesa</button>
            </div>
            <div className="flex gap-2">
              <input value={newCatName} onChange={e=>setNewCatName(e.target.value)} type="text" placeholder="Nome da Categoria" className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-sm md:text-base font-medium focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-colors placeholder:text-slate-600" />
              <button onClick={addCategory} className="px-6 bg-emerald-500 transition-colors text-[#050B14] rounded-xl font-black flex items-center justify-center hover:bg-emerald-400 active:scale-95"><Plus size={20} /></button>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Categorias (Receitas)</h4>
            <div className="flex flex-wrap gap-2">
               {categories.filter(c => c.type === 'income').map(c => (
                 <span key={c.id} className="text-[10px] md:text-xs font-bold px-3 py-2 border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center gap-2">
                   {c.name} {!c.is_default && <button onClick={() => deleteCategory(c.id, c.is_default)} className="text-emerald-500 hover:text-emerald-300 bg-emerald-500/20 hover:bg-emerald-500/50 p-1 rounded-md transition-colors"><X size={12} /></button>}
                 </span>
               ))}
            </div>

            <h4 className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest mb-4 mt-8">Categorias (Despesas)</h4>
            <div className="flex flex-wrap gap-2">
               {categories.filter(c => c.type === 'expense').map(c => (
                 <span key={c.id} className="text-[10px] md:text-xs font-bold px-3 py-2 border border-rose-500/30 bg-rose-500/10 text-rose-400 rounded-xl flex items-center gap-2">
                   {c.name} {!c.is_default && <button onClick={() => deleteCategory(c.id, c.is_default)} className="text-rose-500 hover:text-rose-300 bg-rose-500/20 hover:bg-rose-500/50 p-1 rounded-md transition-colors"><X size={12} /></button>}
                 </span>
               ))}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
