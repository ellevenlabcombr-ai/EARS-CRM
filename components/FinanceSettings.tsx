"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { motion } from 'motion/react';
import { Plus, Trash, CircleCheck, Lock, Target, TrendingUp, X } from 'lucide-react';
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
    <div className="space-y-8 text-white">
      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-2 font-bold ${message.type === 'error' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
          <CircleCheck size={16} /> {message.text}
        </div>
      )}

      {/* Caixinhas de Metas */}
      <section className="bg-[#050B14] border border-slate-800/50 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6 border-b border-slate-800/50 pb-4">
          <div className="w-10 h-10 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center"><Target size={20} /></div>
          <div>
            <h3 className="font-black uppercase tracking-wider text-lg">Metas & Vaquinhas (Caixinhas)</h3>
            <p className="text-sm text-slate-500">Crie metas de arrecadação para kit, torneios, etc.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Nova Meta</h4>
            <div className="space-y-4">
              <input value={newGoalName} onChange={e=>setNewGoalName(e.target.value)} type="text" placeholder="Nome da meta (ex: Torneio Nacional)" className="w-full bg-[#0A1120] border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-amber-500 outline-none" />
              <input value={newGoalTarget} onChange={e=>setNewGoalTarget(e.target.value)} type="number" placeholder="Valor alvo (R$)" className="w-full bg-[#0A1120] border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-amber-500 outline-none" />
              <button onClick={addGoal} className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-[#050B14] rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors">
                <Plus size={16} /> Criar Caixinha
              </button>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Metas Ativas</h4>
            <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
              {goals.length === 0 ? <p className="text-slate-500 text-sm italic">Nenhuma meta criada.</p> : goals.map(g => (
                <div key={g.id} className="bg-[#0A1120] border border-slate-800 p-4 rounded-xl flex justify-between items-center group">
                  <div>
                    <h5 className="font-bold text-slate-300">{g.name}</h5>
                    <p className="text-xs text-amber-500 font-bold mt-1">Alvo: R$ {g.target_amount}</p>
                  </div>
                  <button onClick={() => deleteGoal(g.id)} className="text-slate-600 hover:text-rose-500 p-2"><Trash size={16} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Regras e Fechamento */}
      <section className="bg-[#050B14] border border-slate-800/50 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6 border-b border-slate-800/50 pb-4">
          <div className="w-10 h-10 bg-indigo-500/10 text-indigo-500 rounded-xl flex items-center justify-center"><Lock size={20} /></div>
          <div>
            <h3 className="font-black uppercase tracking-wider text-lg">Fechamento Mensal</h3>
            <p className="text-sm text-slate-500">Trave registros antigos e importe saldo para o próximo mês.</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="flex-1 space-y-4">
            <p className="text-sm text-slate-400">Ao fechar o mês atual, impedimos que transações passadas retroativas modifiquem os relatórios consolidados.</p>
            <button onClick={closeMonth} className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors">
              <Lock size={16} /> Finalizar Mês de {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </button>
          </div>

          <div className="flex-1 w-full">
             <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Meses Fechados</h4>
             <div className="space-y-2">
               {closures.length === 0 ? <p className="text-slate-500 text-sm italic">Nenhum mês fechado.</p> : closures.map(c => (
                 <div key={c.id} className="flex justify-between items-center bg-[#0A1120] border border-slate-800 px-4 py-2 rounded-lg">
                   <span className="font-bold text-slate-300">{c.month}</span>
                   <span className="text-sm font-black text-white">Saldo: R$ {c.final_balance}</span>
                 </div>
               ))}
             </div>
          </div>
        </div>
      </section>

      {/* Categorias Customizadas */}
      <section className="bg-[#050B14] border border-slate-800/50 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6 border-b border-slate-800/50 pb-4">
          <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center"><TrendingUp size={20} /></div>
          <div>
            <h3 className="font-black uppercase tracking-wider text-lg">Categorias</h3>
            <p className="text-sm text-slate-500">Adicione novas categorias para receitas e despesas.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Nova Categoria</h4>
            <div className="flex bg-[#0A1120] p-1 rounded-xl border border-slate-800/50">
              <button onClick={() => setNewCatType('income')} className={`flex-1 py-1.5 text-xs font-bold uppercase rounded-lg ${newCatType === 'income' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500'}`}>Receita</button>
              <button onClick={() => setNewCatType('expense')} className={`flex-1 py-1.5 text-xs font-bold uppercase rounded-lg ${newCatType === 'expense' ? 'bg-rose-500/20 text-rose-400' : 'text-slate-500'}`}>Despesa</button>
            </div>
            <div className="flex gap-2">
              <input value={newCatName} onChange={e=>setNewCatName(e.target.value)} type="text" placeholder="Nome" className="flex-1 bg-[#0A1120] border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-emerald-500 outline-none" />
              <button onClick={addCategory} className="px-4 bg-emerald-500 text-[#050B14] rounded-xl font-bold flex items-center justify-center hover:bg-emerald-600"><Plus size={16} /></button>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Categorias (Receitas)</h4>
            <div className="flex flex-wrap gap-2">
               {categories.filter(c => c.type === 'income').map(c => (
                 <span key={c.id} className="text-xs font-bold px-3 py-1.5 border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center gap-1">
                   {c.name} {!c.is_default && <button onClick={() => deleteCategory(c.id, c.is_default)} className="text-emerald-500 hover:text-white ml-1"><X size={10} /></button>}
                 </span>
               ))}
            </div>

            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 mt-6">Categorias (Despesas)</h4>
            <div className="flex flex-wrap gap-2">
               {categories.filter(c => c.type === 'expense').map(c => (
                 <span key={c.id} className="text-xs font-bold px-3 py-1.5 border border-rose-500/30 bg-rose-500/10 text-rose-400 rounded-full flex items-center gap-1">
                   {c.name} {!c.is_default && <button onClick={() => deleteCategory(c.id, c.is_default)} className="text-rose-500 hover:text-white ml-1"><X size={10} /></button>}
                 </span>
               ))}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
