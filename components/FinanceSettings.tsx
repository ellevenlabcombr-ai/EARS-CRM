"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash, CheckCircle2, Lock, Target, TrendingUp, X, DollarSign, CreditCard, AlertTriangle, Save, Tag } from 'lucide-react';
import { getLocalDateString } from '@/lib/utils';

export function FinanceSettings() {
  const [categories, setCategories] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [closures, setClosures] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [billingRules, setBillingRules] = useState<any>({});
  
  // States for forms
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState('income');
  
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newGoalType, setNewGoalType] = useState('saving');
  
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductType, setNewProductType] = useState('monthly');

  const [newPaymentName, setNewPaymentName] = useState('');
  const [newPaymentType, setNewPaymentType] = useState('credit_card');
  const [newPaymentFee, setNewPaymentFee] = useState('');
  
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!supabase) return;
    try {
      const [catsRes, goalsRes, closuresRes, productsRes, paymentRes, rulesRes] = await Promise.all([
        supabase.from('financial_categories').select('*').order('name'),
        supabase.from('financial_goals').select('*').order('created_at', { ascending: false }),
        supabase.from('financial_closures').select('*').order('month', { ascending: false }),
        supabase.from('financial_products').select('*').order('name'),
        supabase.from('financial_payment_methods').select('*').order('name'),
        supabase.from('financial_billing_rules').select('*').limit(1).single()
      ]);
      
      if (catsRes.data) setCategories(catsRes.data);
      if (goalsRes.data) setGoals(goalsRes.data);
      if (closuresRes.data) setClosures(closuresRes.data);
      if (productsRes.data) setProducts(productsRes.data);
      if (paymentRes.data) setPaymentMethods(paymentRes.data);
      
      if (rulesRes.data) {
        setBillingRules(rulesRes.data);
      } else {
        // Init default rules if none exists
        const { data: newRules } = await supabase.from('financial_billing_rules').insert({}).select().single();
        if (newRules) setBillingRules(newRules);
      }
    } catch (err: any) {
      console.warn("Algumas tabelas financeiras podem não existir ainda:", err.message);
    }
  };

  const showMessage = (text: string, type: 'error'|'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  // CATEGORIES
  const addCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      const { error } = await supabase.from('financial_categories').insert({ name: newCatName, type: newCatType });
      if (error) throw error;
      setNewCatName('');
      fetchData();
      showMessage('Categoria adicionada!', 'success');
    } catch (err: any) {
      showMessage('Erro ao adicionar categoria.', 'error');
    }
  };

  const deleteCategory = async (id: string, isDefault: boolean) => {
    if (isDefault) return showMessage('Não é possível apagar categoria padrão.', 'error');
    if (!confirm('Deseja excluir esta categoria?')) return;
    try {
      await supabase.from('financial_categories').delete().eq('id', id);
      fetchData();
    } catch (error: any) {
      showMessage('Erro ao excluir categoria.', 'error');
    }
  };

  // GOALS & BUDGETS
  const addGoal = async () => {
    if (!newGoalName.trim() || !newGoalTarget) return;
    try {
      const { error } = await supabase.from('financial_goals').insert({ 
        name: newGoalName, 
        target_amount: parseFloat(newGoalTarget),
        type: newGoalType
      });
      if (error) throw error;
      setNewGoalName('');
      setNewGoalTarget('');
      fetchData();
      showMessage('Meta/Orçamento criado!', 'success');
    } catch (err: any) {
      showMessage('Erro ao criar meta. (Execute Dashboard>Desenv caso a tabela não esteja atualizada)', 'error');
    }
  };

  const deleteGoal = async (id: string) => {
    if (!confirm('Deseja excluir?')) return;
    try {
      await supabase.from('financial_goals').delete().eq('id', id);
      fetchData();
    } catch (error: any) {
      showMessage('Erro ao excluir meta.', 'error');
    }
  };

  // PRODUCTS
  const addProduct = async () => {
    if (!newProductName.trim() || !newProductPrice) return;
    try {
      const { error } = await supabase.from('financial_products').insert({
        name: newProductName,
        default_price: parseFloat(newProductPrice),
        type: newProductType
      });
      if (error) throw error;
      setNewProductName('');
      setNewProductPrice('');
      fetchData();
      showMessage('Produto/Plano criado!', 'success');
    } catch (err: any) {
      showMessage('Erro ao criar produto.', 'error');
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Deseja excluir este plano?')) return;
    try {
      await supabase.from('financial_products').delete().eq('id', id);
      fetchData();
    } catch (error: any) {
      showMessage('Erro ao excluir plano.', 'error');
    }
  };

  // PAYMENT METHODS
  const addPaymentMethod = async () => {
    if (!newPaymentName.trim()) return;
    try {
      const { error } = await supabase.from('financial_payment_methods').insert({
        name: newPaymentName,
        type: newPaymentType,
        fee_percentage: newPaymentFee ? parseFloat(newPaymentFee) : 0
      });
      if (error) throw error;
      setNewPaymentName('');
      setNewPaymentFee('');
      fetchData();
      showMessage('Forma de pagamento adicionada!', 'success');
    } catch (err: any) {
      showMessage('Erro ao adicionar forma de pagamento.', 'error');
    }
  };

  const deletePaymentMethod = async (id: string) => {
    if (!confirm('Deseja excluir esta forma de pagamento?')) return;
    try {
      await supabase.from('financial_payment_methods').delete().eq('id', id);
      fetchData();
    } catch (error: any) {
      showMessage('Erro ao excluir.', 'error');
    }
  };

  // BILLING RULES
  const saveBillingRules = async () => {
    if (!billingRules.id) return;
    try {
      const { error } = await supabase.from('financial_billing_rules').update({
        default_due_day: parseInt(billingRules.default_due_day || 5),
        reminder_days_before: parseInt(billingRules.reminder_days_before || 3),
        warn_after_days_late: parseInt(billingRules.warn_after_days_late || 1),
        penalty_rate: parseFloat(billingRules.penalty_rate || 2),
        interest_rate_monthly: parseFloat(billingRules.interest_rate_monthly || 1)
      }).eq('id', billingRules.id);
      if (error) throw error;
      showMessage('Regras salvas com sucesso!', 'success');
    } catch (err: any) {
      showMessage('Erro ao salvar regras.', 'error');
    }
  };

  // CLOSURES
  const closeMonth = async () => {
    const currentMonth = getLocalDateString().substring(0, 7);
    if (!confirm(`Deseja fechar o mês (${currentMonth})? Isso impede transações retroativas e salva seu saldo final.`)) return;
    try {
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
      showMessage(`Mês fechado! Saldo: R$ ${balance.toFixed(2)}`, 'success');
    } catch (err: any) {
      if (err.message.includes('unique constraint')) showMessage('Este mês já foi fechado.', 'error');
      else showMessage('Erro ao fechar mês.', 'error');
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 pb-10 text-white">
      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-2 font-bold z-50 fixed bottom-4 right-4 shadow-xl ${message.type === 'error' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'}`}>
          <CheckCircle2 size={16} /> {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 md:gap-8">
        
        {/* CATEGORIES SECTION */}
        <section className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl flex flex-col h-full">
          <div className="flex items-center gap-3 md:gap-4 mb-6 border-b border-slate-800/50 pb-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-500/10 text-emerald-500 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-black text-white uppercase tracking-tight">Plano de Contas</h3>
              <p className="text-[10px] md:text-xs text-slate-500 font-medium">Personalize Entradas e Saídas</p>
            </div>
          </div>

          <div className="space-y-6 flex-1">
            <div className="space-y-4">
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button onClick={() => setNewCatType('income')} className={`flex-1 py-3 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-lg transition-colors ${newCatType === 'income' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}>Receita</button>
                <button onClick={() => setNewCatType('expense')} className={`flex-1 py-3 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-lg transition-colors ${newCatType === 'expense' ? 'bg-rose-500/20 text-rose-400' : 'text-slate-500 hover:text-slate-300'}`}>Despesa</button>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input value={newCatName} onChange={e=>setNewCatName(e.target.value)} type="text" placeholder="Nome (Ex: Mensalidades)" className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-medium focus:border-emerald-500/50 outline-none placeholder:text-slate-600" />
                <button onClick={addCategory} className="px-6 py-3 sm:py-0 bg-emerald-500 text-[#050B14] rounded-xl font-black flex items-center justify-center hover:bg-emerald-400"><Plus size={18} /> <span className="sm:hidden ml-2">Adicionar</span></button>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-[10px] md:text-xs font-black text-emerald-500/50 uppercase tracking-widest">Receitas</h4>
              <div className="flex flex-wrap gap-2">
                 {categories.filter(c => c.type === 'income').map(c => (
                   <span key={c.id} className="text-[10px] md:text-xs font-bold px-3 py-1.5 border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 rounded-xl flex items-center gap-2">
                     {c.name} {!c.is_default && <button onClick={() => deleteCategory(c.id, c.is_default)} className="text-emerald-500 hover:text-emerald-300 transition-colors"><X size={12} /></button>}
                   </span>
                 ))}
                 {categories.filter(c => c.type === 'income').length === 0 && <span className="text-xs text-slate-600">Nenhuma registrada</span>}
              </div>

              <h4 className="text-[10px] md:text-xs font-black text-rose-500/50 uppercase tracking-widest pt-3">Despesas</h4>
              <div className="flex flex-wrap gap-2">
                 {categories.filter(c => c.type === 'expense').map(c => (
                   <span key={c.id} className="text-[10px] md:text-xs font-bold px-3 py-1.5 border border-rose-500/20 bg-rose-500/5 text-rose-400 rounded-xl flex items-center gap-2">
                     {c.name} {!c.is_default && <button onClick={() => deleteCategory(c.id, c.is_default)} className="text-rose-500 hover:text-rose-300 transition-colors"><X size={12} /></button>}
                   </span>
                 ))}
                 {categories.filter(c => c.type === 'expense').length === 0 && <span className="text-xs text-slate-600">Nenhuma registrada</span>}
              </div>
            </div>
          </div>
        </section>

        {/* PRODUCTS & PLANS SECTION */}
        <section className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl flex flex-col h-full">
          <div className="flex items-center gap-3 md:gap-4 mb-6 border-b border-slate-800/50 pb-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-cyan-500/10 text-cyan-500 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0">
              <Tag className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-black text-white uppercase tracking-tight">Planos & Serviços</h3>
              <p className="text-[10px] md:text-xs text-slate-500 font-medium">Tabela base de preços</p>
            </div>
          </div>

          <div className="space-y-6 flex-1">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="col-span-2">
                <input value={newProductName} onChange={e=>setNewProductName(e.target.value)} type="text" placeholder="Ex: Mensalidade Elite" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-medium focus:border-cyan-500/50 outline-none placeholder:text-slate-600" />
              </div>
              <div className="col-span-2 md:col-span-1">
                <input value={newProductPrice} onChange={e=>setNewProductPrice(e.target.value)} type="number" placeholder="Valor (R$)" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-medium focus:border-cyan-500/50 outline-none placeholder:text-slate-600" />
              </div>
              <div className="col-span-2 md:col-span-1">
                <button onClick={addProduct} className="w-full h-full py-3 bg-cyan-500 text-[#050B14] rounded-xl font-black flex items-center justify-center hover:bg-cyan-400 gap-2"><Plus size={18} /> <span className="md:hidden">Add</span></button>
              </div>
            </div>

            <div className="space-y-2 mt-4 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
              {products.length === 0 ? <div className="text-center p-4"><span className="text-xs text-slate-600">Nenhum plano cadastrado.</span></div> : products.map(p => (
                <div key={p.id} className="bg-slate-950 border border-slate-800 px-4 py-3 rounded-xl flex justify-between items-center group hover:border-cyan-500/30">
                  <span className="font-bold text-slate-300 text-xs md:text-sm">{p.name}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] md:text-xs font-black text-white uppercase tracking-widest">R$ {p.default_price}</span>
                    <button onClick={() => deleteProduct(p.id)} className="text-slate-600 hover:text-rose-500 transition-colors"><Trash size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* GOALS & BUDGETS SECTION */}
        <section className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl flex flex-col h-full">
          <div className="flex items-center gap-3 md:gap-4 mb-6 border-b border-slate-800/50 pb-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-500/10 text-amber-500 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0">
              <Target className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-black text-white uppercase tracking-tight">Metas e Orçamentos</h3>
              <p className="text-[10px] md:text-xs text-slate-500 font-medium">Metas de receita, teto de despesa e caixinhas</p>
            </div>
          </div>

          <div className="space-y-6 flex-1">
            <div className="space-y-4">
              <select value={newGoalType} onChange={e=>setNewGoalType(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-medium focus:border-amber-500/50 outline-none text-slate-300">
                <option value="saving">Caixinha / Arrecadação Específica</option>
                <option value="income_goal">Meta de Receita Mensal</option>
                <option value="expense_limit">Teto de Gastos / Despesas</option>
              </select>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 flex gap-2">
                  <input value={newGoalName} onChange={e=>setNewGoalName(e.target.value)} type="text" placeholder="Ex: Meta Faturamento" className="w-[60%] bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-medium focus:border-amber-500/50 outline-none placeholder:text-slate-600" />
                  <input value={newGoalTarget} onChange={e=>setNewGoalTarget(e.target.value)} type="number" placeholder="Alvo(R$)" className="w-[40%] bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-medium focus:border-amber-500/50 outline-none placeholder:text-slate-600" />
                </div>
                <button onClick={addGoal} className="px-6 py-3 bg-amber-500 text-[#050B14] rounded-xl font-black flex items-center justify-center hover:bg-amber-400 gap-2"><Plus size={18} /> <span className="sm:hidden">Criar</span></button>
              </div>
            </div>

            <div className="space-y-2 mt-4 max-h-[250px] overflow-y-auto custom-scrollbar pr-2">
              {goals.length === 0 ? <div className="text-center p-4"><span className="text-xs text-slate-600">Nenhuma meta configurada.</span></div> : goals.map(g => (
                <div key={g.id} className="bg-slate-950 border border-slate-800 px-4 py-3 rounded-xl flex justify-between items-center group hover:border-amber-500/30">
                  <div>
                    <h5 className="font-bold text-slate-300 text-xs md:text-sm">{g.name}</h5>
                    <span className={`text-[9px] uppercase tracking-widest font-black ${g.type === 'income_goal' ? 'text-emerald-500' : g.type === 'expense_limit' ? 'text-rose-500' : 'text-cyan-500'}`}>
                      {g.type === 'income_goal' ? 'Meta Mensal' : g.type === 'expense_limit' ? 'Teto de Gastos' : 'Caixinha'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] md:text-xs font-black text-amber-500 uppercase tracking-widest">R$ {g.target_amount}</span>
                    <button onClick={() => deleteGoal(g.id)} className="text-slate-600 hover:text-rose-500 transition-colors"><Trash size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PAYMENT METHODS SECTION */}
        <section className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl flex flex-col h-full">
          <div className="flex items-center gap-3 md:gap-4 mb-6 border-b border-slate-800/50 pb-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-500/10 text-blue-500 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0">
              <CreditCard className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-black text-white uppercase tracking-tight">Formas & Taxas</h3>
              <p className="text-[10px] md:text-xs text-slate-500 font-medium">Tipos de pagamento aceitos e descontos de maquineta</p>
            </div>
          </div>

          <div className="space-y-6 flex-1">
             <div className="flex flex-col gap-2">
                <input value={newPaymentName} onChange={e=>setNewPaymentName(e.target.value)} type="text" placeholder="Ex: Cartão de Crédito (PagSeguro)" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-medium focus:border-blue-500/50 outline-none placeholder:text-slate-600" />
                <div className="flex gap-2">
                  <select value={newPaymentType} onChange={e=>setNewPaymentType(e.target.value)} className="w-[45%] bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-medium focus:border-blue-500/50 outline-none text-slate-300">
                    <option value="credit_card">Cartão Crédito</option>
                    <option value="pix">PIX</option>
                    <option value="boleto">Boleto</option>
                    <option value="cash">Dinheiro</option>
                  </select>
                  <input value={newPaymentFee} onChange={e=>setNewPaymentFee(e.target.value)} type="number" placeholder="Taxa (%)" className="w-[35%] bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-medium focus:border-blue-500/50 outline-none placeholder:text-slate-600" />
                  <button onClick={addPaymentMethod} className="w-[20%] py-3 bg-blue-500 text-white rounded-xl font-black flex items-center justify-center hover:bg-blue-400"><Plus size={18} /></button>
                </div>
            </div>

            <div className="space-y-2 mt-4 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
              {paymentMethods.length === 0 ? <div className="text-center p-4"><span className="text-xs text-slate-600">Nenhum meio de pagamento.</span></div> : paymentMethods.map(p => (
                <div key={p.id} className="bg-slate-950 border border-slate-800 px-4 py-3 rounded-xl flex justify-between items-center group hover:border-blue-500/30">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-300 text-xs md:text-sm">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">{p.fee_percentage}% taxa</span>
                    <button onClick={() => deletePaymentMethod(p.id)} className="text-slate-600 hover:text-rose-500 transition-colors"><Trash size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* BILLING RULES SECTION */}
        <section className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl flex flex-col h-full xl:col-span-2">
          <div className="flex items-center gap-3 md:gap-4 mb-6 border-b border-slate-800/50 pb-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-rose-500/10 text-rose-500 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm md:text-base font-black text-white uppercase tracking-tight">Cobrança e Inadimplência</h3>
              <p className="text-[10px] md:text-xs text-slate-500 font-medium">Dias de vencimento, juros, multas e lembretes automáticos</p>
            </div>
            <button onClick={saveBillingRules} className="px-4 py-2.5 bg-rose-500 hover:bg-rose-400 text-white rounded-xl font-black uppercase tracking-widest text-[10px] md:text-xs flex items-center gap-2 transition-all">
              <Save size={16} /> Salvar Regras
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div className="space-y-5">
              <div>
                <label className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block">Vencimento Padrão (Dia do Mês)</label>
                <input value={billingRules?.default_due_day || ''} onChange={e=>setBillingRules({...billingRules, default_due_day: e.target.value})} type="number" min="1" max="31" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-medium focus:border-rose-500/50 outline-none text-slate-300" />
              </div>
              <div>
                <label className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block">Multa por Atraso (%)</label>
                <input value={billingRules?.penalty_rate || ''} onChange={e=>setBillingRules({...billingRules, penalty_rate: e.target.value})} type="number" step="0.1" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-medium focus:border-rose-500/50 outline-none text-slate-300" />
              </div>
              <div>
                <label className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block">Juros ao Mês (%)</label>
                <input value={billingRules?.interest_rate_monthly || ''} onChange={e=>setBillingRules({...billingRules, interest_rate_monthly: e.target.value})} type="number" step="0.1" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-medium focus:border-rose-500/50 outline-none text-slate-300" />
              </div>
            </div>

            <div className="space-y-5">
              <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-5 mb-2">
                <p className="text-xs text-rose-300/80 font-medium leading-relaxed">
                  Estas regras comunicam-se com a <strong>Automação (WhatsApp)</strong>. O sistema lembrará o atleta "X" dias antes, e enviará aviso de cobrança com a multa "Y" dias depois do atraso.
                </p>
              </div>
              <div>
                <label className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block">Lembrar (Dias antes de vencer)</label>
                <input value={billingRules?.reminder_days_before || ''} onChange={e=>setBillingRules({...billingRules, reminder_days_before: e.target.value})} type="number" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-medium focus:border-rose-500/50 outline-none text-slate-300" />
              </div>
              <div>
                <label className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block">Cobrar (Dias após vencimento)</label>
                <input value={billingRules?.warn_after_days_late || ''} onChange={e=>setBillingRules({...billingRules, warn_after_days_late: e.target.value})} type="number" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-medium focus:border-rose-500/50 outline-none text-slate-300" />
              </div>
            </div>
          </div>
        </section>

        {/* MONTHLY CLOSURE (existing) */}
        <section className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl xl:col-span-2">
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

      </div>
    </div>
  );
}
