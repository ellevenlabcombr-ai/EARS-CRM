"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion } from "motion/react";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock,
  MoreHorizontal,
  Wallet,
  CreditCard,
  Building2,
  Paperclip,
  Download,
  User,
  Repeat,
  Printer,
  Target
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getLocalDateString } from "@/lib/utils";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts";
import { createAsaasCustomer, createAsaasPayment, getAsaasPixQrCode } from "@/app/actions/asaas";

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  date: string;
  status: 'paid' | 'pending';
  account?: string;
  is_recurring?: boolean;
  receipt_filename?: string;
  athlete_id?: string;
  asaas_payment_id?: string;
  asaas_invoice_url?: string;
  created_at: string;
}

const ACCOUNTS = ['Débito', 'Crédito', 'PIX', 'Dinheiro'];
const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'];

export function FinanceDashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [athletes, setAthletes] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingMode, setIsAddingMode] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [activeTab, setActiveTab] = useState<'geral' | 'metas' | 'inadimplencia' | 'assinaturas' | 'dre'>('geral');

  const [transactionToEdit, setTransactionToEdit] = useState<Transaction | null>(null);
  const [receiptTransaction, setReceiptTransaction] = useState<Transaction | null>(null);
  const [asaasTransaction, setAsaasTransaction] = useState<Transaction | null>(null);

  useEffect(() => {
    fetchTransactions();
    fetchAthletes();
    fetchExtras();
  }, []);

  const fetchExtras = async () => {
    try {
      if (!supabase) return;
      const [catsRes, goalsRes] = await Promise.all([
        supabase.from('financial_categories').select('*').order('name'),
        supabase.from('financial_goals').select('*').order('created_at', { ascending: false })
      ]);
      
      let fetchedCats = catsRes.data || [];
      if (!catsRes.error && fetchedCats.length === 0) {
        // Seed some defaults
        const defaultCats = [
          { name: 'Mensalidade', type: 'income', is_default: true },
          { name: 'Avaliação Clínica', type: 'income', is_default: true },
          { name: 'Patrocínio', type: 'income', is_default: true },
          { name: 'Venda de Produto', type: 'income', is_default: true },
          { name: 'Salário', type: 'expense', is_default: true },
          { name: 'Aluguel', type: 'expense', is_default: true },
          { name: 'Software', type: 'expense', is_default: true },
          { name: 'Impostos', type: 'expense', is_default: true },
          { name: 'Materiais', type: 'expense', is_default: true },
          { name: 'Outros', type: 'expense', is_default: true },
          { name: 'Outros', type: 'income', is_default: true }
        ];
        const { data: newCats, error: seedErr } = await supabase.from('financial_categories').insert(defaultCats).select();
        if (!seedErr && newCats) {
             fetchedCats = newCats;
        }
      }
      
      setCategories(fetchedCats);
      if (goalsRes.data) setGoals(goalsRes.data);
    } catch (err) {
      console.warn("Extras (categorias/metas) podem não existir:", err);
    }
  };

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      if (!supabase) return;
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .order('date', { ascending: false });
        
      if (error) {
        console.warn("Table financial_transactions might not exist yet:", error.message);
        setTransactions([]);
        return;
      }
      
      if (data) {
        setTransactions(data);
      }
    } catch (err) {
      console.error("Error fetching transactions:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAthletes = async () => {
    try {
      if (!supabase) return;
      const { data } = await supabase.from('athletes').select('id, name').order('name');
      if (data) setAthletes(data);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchAccount = selectedAccount === 'all' || t.account === selectedAccount;
      const matchSearch = (t.description || '').toLowerCase().includes(searchQuery.toLowerCase()) || (t.category || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchAccount && matchSearch;
    });
  }, [transactions, selectedAccount, searchQuery]);

  const balance = useMemo(() => {
    let inc = 0, exp = 0, pendingInc = 0, pendingExp = 0;
    filteredTransactions.forEach(t => {
      if (t.status === 'paid') {
        if (t.type === 'income') inc += t.amount;
        if (t.type === 'expense') exp += t.amount;
      } else {
        if (t.type === 'income') pendingInc += t.amount;
        if (t.type === 'expense') pendingExp += t.amount;
      }
    });
    return { incomes: inc, expenses: exp, pendingIncomes: pendingInc, pendingExpenses: pendingExp, total: inc - exp };
  }, [filteredTransactions]);

  const expensesByCategory = useMemo(() => {
    const expenses = filteredTransactions.filter(t => t.type === 'expense' && t.status === 'paid');
    const grouped = expenses.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(grouped).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  const monthlyFlowData = useMemo(() => {
    const monthlyMap: Record<string, { month: string, Entradas: number, Saídas: number }> = {};
    
    [...filteredTransactions].reverse().forEach(t => {
      if (t.status !== 'paid') return;
      const d = new Date(t.date);
      const mStr = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }); // ex: "mai., 26"
      
      if (!monthlyMap[mStr]) {
        monthlyMap[mStr] = { month: mStr, Entradas: 0, Saídas: 0 };
      }
      if (t.type === 'income') monthlyMap[mStr].Entradas += t.amount;
      else monthlyMap[mStr].Saídas += t.amount;
    });

    return Object.values(monthlyMap);
  }, [filteredTransactions]);

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta transação?')) return;
    try {
      const { error } = await supabase.from('financial_transactions').delete().eq('id', id);
      if (error) throw error;
      fetchTransactions();
    } catch (err: any) {
      console.error(err);
      alert('Erro ao excluir: ' + err.message);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const exportCSV = () => {
    const headers = ['Data', 'Tipo', 'Descrição', 'Categoria', 'Conta', 'Status', 'Recorrente', 'Valor Base', 'Anexo'];
    const rows = filteredTransactions.map(t => [
      new Date(t.date).toLocaleDateString('pt-BR'),
      t.type === 'income' ? 'Receita' : 'Despesa',
      (t.description || '').replace(/,/g, ''),
      t.category,
      t.account || '-',
      t.status === 'paid' ? 'Pago' : 'Pendente',
      t.is_recurring ? 'Sim' : 'Não',
      t.amount.toString().replace('.', ','),
      t.receipt_filename ? 'Sim' : 'Não'
    ]);
    
    let csvContent = headers.join(';') + '\n' + rows.map(r => r.join(';')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_financeiro_${getLocalDateString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#050B14] relative">
      <header className="bg-[#0A1120] border-b border-slate-800/50 shrink-0 z-10 flex flex-col">
        <div className="px-4 md:px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 shrink-0">
              <DollarSign size={20} />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-black text-white uppercase tracking-tight">Financeiro</h1>
              <p className="text-[10px] md:text-xs text-slate-400 font-medium line-clamp-1">Gestão de receitas e despesas</p>
            </div>
          </div>
          
          <div className="flex items-center w-full md:w-auto gap-2 shrink-0">
            <button 
              onClick={exportCSV}
              className="flex-1 md:flex-none h-11 md:h-10 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
            >
              <Download size={16} /> Exportar
            </button>
            <button 
              onClick={() => { setTransactionToEdit(null); setIsAddingMode(true); }}
              className="flex-1 md:flex-none h-11 md:h-10 px-4 bg-emerald-500 hover:bg-emerald-600 text-[#050B14] rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] whitespace-nowrap"
            >
              <Plus size={16} /> Nova Transação
            </button>
          </div>
        </div>
        
        <div className="px-4 md:px-6 flex overflow-x-auto custom-scrollbar no-scrollbar-mobile gap-6 w-full">
          <button onClick={() => setActiveTab('geral')} className={`py-3 text-sm font-bold transition-all whitespace-nowrap border-b-2 ${activeTab === 'geral' ? 'border-emerald-500 text-emerald-500' : 'border-transparent text-slate-400 hover:text-slate-300'}`}>Visão Geral</button>
          <button onClick={() => setActiveTab('metas')} className={`py-3 text-sm font-bold transition-all whitespace-nowrap border-b-2 ${activeTab === 'metas' ? 'border-emerald-500 text-emerald-500' : 'border-transparent text-slate-400 hover:text-slate-300'}`}>Caixinhas</button>
          <button onClick={() => setActiveTab('inadimplencia')} className={`py-3 text-sm font-bold transition-all whitespace-nowrap border-b-2 ${activeTab === 'inadimplencia' ? 'border-emerald-500 text-emerald-500' : 'border-transparent text-slate-400 hover:text-slate-300'}`}>Inadimplência</button>
          <button onClick={() => setActiveTab('assinaturas')} className={`py-3 text-sm font-bold transition-all whitespace-nowrap border-b-2 ${activeTab === 'assinaturas' ? 'border-emerald-500 text-emerald-500' : 'border-transparent text-slate-400 hover:text-slate-300'}`}>Assinaturas</button>
          <button onClick={() => setActiveTab('dre')} className={`py-3 text-sm font-bold transition-all whitespace-nowrap border-b-2 ${activeTab === 'dre' ? 'border-emerald-500 text-emerald-500' : 'border-transparent text-slate-400 hover:text-slate-300'}`}>DRE & Info</button>
        </div>
      </header>

      {activeTab === 'geral' && (
        <>
          <div className="bg-[#080d1a] px-4 md:px-6 py-4 border-b border-slate-800/50 flex flex-col md:flex-row md:items-center gap-4 shrink-0">
            <span className="text-xs font-black text-slate-500 uppercase tracking-widest whitespace-nowrap shrink-0">Forma de Pagamento:</span>
            <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-2 md:pb-0 w-full">
              <button 
                onClick={() => setSelectedAccount('all')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${selectedAccount === 'all' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:text-slate-300 bg-slate-800/50 hover:bg-slate-800 border border-transparent'}`}
              >
                Geral
              </button>
              {ACCOUNTS.map(acc => (
                <button 
                  key={acc}
                  onClick={() => setSelectedAccount(acc)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 shrink-0 ${selectedAccount === acc ? 'bg-slate-800 text-white border border-slate-600 shadow-sm' : 'text-slate-400 hover:text-slate-300 bg-slate-800/50 hover:bg-slate-800 border border-transparent'}`}
                >
                  {acc === 'Débito' && <CreditCard size={14} className="opacity-70" />}
                  {acc === 'Crédito' && <CreditCard size={14} className="opacity-70" />}
                  {acc === 'PIX' && <Wallet size={14} className="opacity-70" />}
                  {acc === 'Dinheiro' && <Building2 size={14} className="opacity-70" />}
                  {acc}
                </button>
              ))}
            </div>
          </div>

          <main className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#0A1120] border border-slate-800/50 rounded-2xl p-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-5 opacity-10">
              <ArrowUpRight size={80} className="text-emerald-500" />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Entradas (Pagas)</p>
            <h2 className="text-2xl font-black text-emerald-400">{formatCurrency(balance.incomes)}</h2>
            {balance.pendingIncomes > 0 && <p className="text-xs text-slate-500 mt-1">+{formatCurrency(balance.pendingIncomes)} pendentes</p>}
          </div>
          <div className="bg-[#0A1120] border border-slate-800/50 rounded-2xl p-5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-5 opacity-10">
              <ArrowDownRight size={80} className="text-rose-500" />
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Saídas (Pagas)</p>
            <h2 className="text-2xl font-black text-rose-400">{formatCurrency(balance.expenses)}</h2>
            {balance.pendingExpenses > 0 && <p className="text-xs text-slate-500 mt-1">+{formatCurrency(balance.pendingExpenses)} pendentes</p>}
          </div>
          <div className="bg-[#0A1120] border border-emerald-500/20 rounded-2xl p-5 relative overflow-hidden group col-span-1 md:col-span-2 flex items-center justify-between">
            <div className="absolute top-0 right-0 p-5 opacity-5">
              <DollarSign size={80} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-500/70 uppercase tracking-wider mb-2">Saldo Atual</p>
              <h2 className="text-3xl font-black text-white">{formatCurrency(balance.total)}</h2>
            </div>
            <div className="text-right">
               <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Pagamento Ativo</p>
               <p className="text-sm font-black text-slate-300">{selectedAccount === 'all' ? 'Todas as Formas' : selectedAccount}</p>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#0A1120] border border-slate-800/50 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Fluxo de Caixa (Mensal)</h3>
            <div className="h-64">
              {monthlyFlowData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyFlowData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="month" stroke="#64748b" tick={{fill: '#64748b', fontSize: 12}} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" tick={{fill: '#64748b', fontSize: 12}} tickLine={false} axisLine={false} tickFormatter={(value) => `R$ ${value}`} />
                    <RechartsTooltip 
                      cursor={{fill: '#1e293b'}} 
                      contentStyle={{backgroundColor: '#0A1120', borderColor: '#1e293b', color: '#fff'}}
                      itemStyle={{color: '#fff'}}
                    />
                    <Legend iconType="circle" wrapperStyle={{fontSize: '12px'}} />
                    <Bar dataKey="Entradas" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Saídas" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 text-sm">Dados insuficientes para o gráfico</div>
              )}
            </div>
          </div>
          
          <div className="bg-[#0A1120] border border-slate-800/50 rounded-2xl p-5 flex flex-col">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Despesas por Categoria (Pagas)</h3>
            <div className="h-64 flex-1">
              {expensesByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expensesByCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {expensesByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0)" />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{backgroundColor: '#0A1120', borderColor: '#1e293b', color: '#fff'}}
                    />
                    <Legend 
                      verticalAlign="middle" 
                      align="right"
                      layout="vertical"
                      iconType="circle"
                      wrapperStyle={{fontSize: '12px', color: '#94a3b8'}}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-500 text-sm">Sem despesas pagas no período</div>
              )}
            </div>
          </div>
        </div>

        {/* Filters and List */}
        <div className="bg-[#0A1120] border border-slate-800/50 rounded-2xl flex flex-col">
          <div className="p-4 border-b border-slate-800/50 flex flex-wrap gap-4 items-center justify-between">
            <h3 className="font-bold text-white uppercase tracking-wider flex items-center gap-2">
              Histórico de Transações 
              <span className="bg-slate-800 text-slate-400 py-0.5 px-2 rounded-full text-xs">{filteredTransactions.length}</span>
            </h3>
            <div className="flex gap-2">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Buscar..." 
                  className="pl-9 pr-4 py-2 bg-[#050B14] border border-slate-800 rounded-lg text-sm text-white focus:border-emerald-500 outline-none transition-colors"
                />
              </div>
            </div>
          </div>
          
          <div className="p-2">
            {isLoading ? (
              <div className="p-8 text-center text-slate-500">
                <div className="animate-spin w-6 h-6 border-2 border-emerald-500/50 border-t-emerald-500 rounded-full mx-auto mb-4"></div>
                Carregando transações...
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="p-12 text-center text-slate-500 flex flex-col items-center">
                <DollarSign size={48} className="mb-4 opacity-20" />
                <p>Nenhuma transação encontrada para os filtros atuais</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-slate-800/50">
                      <th className="p-4 font-semibold">Descrição</th>
                      <th className="p-4 font-semibold">Categoria / Forma de Pag.</th>
                      <th className="p-4 font-semibold">Data</th>
                      <th className="p-4 font-semibold">Status</th>
                      <th className="p-4 font-semibold text-right">Valor</th>
                      <th className="p-4 text-center">Infos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map(t => (
                      <tr key={t.id} className="border-b border-slate-800/20 hover:bg-white/[0.01] transition-colors group">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex shrink-0 items-center justify-center ${
                              t.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                            }`}>
                              {t.type === 'income' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                            </div>
                            <div>
                              <span className="font-medium text-white block truncate max-w-[200px]">{t.description || <span className="text-slate-500 italic">Sem descrição</span>}</span>
                              {t.athlete_id && (
                                <span className="text-[10px] text-emerald-500 font-medium flex items-center gap-1 mt-0.5">
                                  <User size={10} /> Atleta Vinculado
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-slate-300 text-sm">{t.category}</div>
                          <div className="text-slate-500 text-xs mt-0.5 flex items-center gap-1">
                            {t.account === 'Débito' && <CreditCard size={10} />}
                            {t.account === 'Crédito' && <CreditCard size={10} />}
                            {t.account === 'PIX' && <Wallet size={10} />}
                            {t.account === 'Dinheiro' && <Building2 size={10} />}
                            {t.account || 'Não informada'}
                          </div>
                        </td>
                        <td className="p-4 text-slate-400 text-sm">
                          {new Date(t.date).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                            t.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-500'
                          }`}>
                            {t.status === 'paid' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                            {t.status === 'paid' ? 'Pago' : 'Pendente'}
                          </span>
                        </td>
                        <td className={`p-4 text-right font-bold ${t.type === 'income' ? 'text-emerald-400' : 'text-white'}`}>
                          {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                        </td>
                        <td className="p-4">
                           <div className="flex justify-center gap-2">
                             {t.is_recurring && (
                               <div className="text-indigo-400 bg-indigo-500/10 p-1.5 rounded-lg tooltip" title="Transação Recorrente">
                                 <Repeat size={14} />
                               </div>
                             )}
                             {t.receipt_filename && (
                               <div className="text-slate-400 bg-slate-800 p-1.5 rounded-lg tooltip" title={`Anexo: ${t.receipt_filename}`}>
                                 <Paperclip size={14} />
                               </div>
                             )}
                             
                             {t.type === 'income' && t.status === 'paid' && (
                               <button
                                 onClick={() => setReceiptTransaction(t)}
                                 className="text-slate-400 hover:text-emerald-400 p-1.5 rounded-lg transition-colors ml-2"
                                 title="Gerar Recibo"
                               >
                                 <Printer size={14} />
                               </button>
                             )}

                             {t.type === 'income' && t.status === 'pending' && !t.asaas_payment_id && (
                               <button
                                 onClick={() => setAsaasTransaction(t)}
                                 className="text-slate-400 hover:text-blue-400 p-1.5 rounded-lg transition-colors ml-2 flex items-center justify-center p-0"
                                 title="Cobrar via Asaas"
                               >
                                 <span className="text-base leading-none block pt-0.5">🪽</span>
                               </button>
                             )}
                             
                             {t.asaas_invoice_url && (
                               <button
                                 onClick={() => window.open(t.asaas_invoice_url, '_blank')}
                                 className="text-blue-400 hover:text-blue-300 p-1.5 rounded-lg transition-colors ml-2 tooltip flex items-center justify-center p-0"
                                 title="Abrir Fatura Asaas"
                               >
                                 <span className="text-base leading-none block pt-0.5">🪽</span>
                               </button>
                             )}

                             <button
                               onClick={() => { setTransactionToEdit(t); setIsAddingMode(true); }}
                               className="text-slate-400 hover:text-emerald-400 p-1.5 rounded-lg transition-colors ml-2"
                               title="Editar Transação"
                             >
                               <MoreHorizontal size={14} />
                             </button>
                             <button
                               onClick={() => handleDelete(t.id)}
                               className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg transition-colors"
                               title="Excluir Transação"
                             >
                               X
                             </button>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
        </>
      )}

      {activeTab === 'metas' && (
        <FinanceGoals goals={goals} transactions={transactions} />
      )}

      {activeTab === 'inadimplencia' && (
        <LatePayments athletes={athletes} transactions={transactions} />
      )}

      {activeTab === 'assinaturas' && (
        <SubscriptionsTab athletes={athletes} transactions={transactions} />
      )}

      {activeTab === 'dre' && (
        <DREReport transactions={transactions} />
      )}
      
      {(isAddingMode || !!transactionToEdit) && (
         <AddTransactionDrawer 
           initialData={transactionToEdit}
           onClose={() => { setIsAddingMode(false); setTransactionToEdit(null); }} 
           onSave={() => {
             setIsAddingMode(false);
             setTransactionToEdit(null);
             fetchTransactions();
           }} 
           athletes={athletes}
           categories={categories}
         />
      )}

      {receiptTransaction && (
        <ReceiptModal
          transaction={receiptTransaction}
          onClose={() => setReceiptTransaction(null)}
        />
      )}

      {asaasTransaction && (
        <AsaasPaymentModal
          transaction={asaasTransaction}
          onClose={() => { setAsaasTransaction(null); fetchTransactions(); }}
        />
      )}
    </div>
  );
}

function AddTransactionDrawer({ onClose, onSave, athletes, categories, initialData }: { onClose: () => void, onSave: () => void, athletes: any[], categories: any[], initialData?: Transaction | null }) {
  const [type, setType] = useState<'income'|'expense'>(initialData?.type || 'income');
  const [description, setDescription] = useState(initialData?.description || '');
  const [amount, setAmount] = useState(initialData?.amount?.toString() || '');
  const [category, setCategory] = useState(initialData?.category || '');
  const [date, setDate] = useState(initialData?.date || getLocalDateString());
  const [status, setStatus] = useState<'paid'|'pending'>(initialData?.status || 'paid');
  const [account, setAccount] = useState(initialData?.account || 'PIX');
  const [isRecurring, setIsRecurring] = useState(initialData?.is_recurring || false);
  const [athleteId, setAthleteId] = useState(initialData?.athlete_id || '');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const amountParsed = amount ? parseFloat(amount.replace(',', '.')) : 0;
      
      const payload = {
        type,
        description,
        amount: isNaN(amountParsed) ? 0 : amountParsed,
        category,
        date,
        status,
        account,
        is_recurring: isRecurring,
        athlete_id: athleteId || null,
        receipt_filename: receiptFile ? receiptFile.name : initialData?.receipt_filename || null,
      };

      const doOperation = async () => {
        if (initialData?.id) {
           const { error } = await supabase.from('financial_transactions').update(payload).eq('id', initialData.id);
           if (error) throw error;
        } else {
           const { error } = await supabase.from('financial_transactions').insert({
              ...payload,
              created_at: new Date().toISOString()
           });
           if (error) throw error;
        }
      };

      try {
        await doOperation();
      } catch (opErr: any) {
        console.error("OpErr:", opErr);
        if (opErr.message && (opErr.message.includes('does not exist') || opErr.message.includes('column') || opErr.message.includes('relation'))) {
          throw new Error("Tabela ou coluna ausente! Acesse a aba Configurações e execute o Database Seeder para criar as tabelas financeiras. Erro original: " + opErr.message);
        } else {
          throw opErr;
        }
      }
      
      onSave();
    } catch (err: any) {
      console.error(err);
      alert('Erro ao salvar transação: ' + (err.message || JSON.stringify(err)));
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setReceiptFile(e.target.files[0]);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" onClick={onClose} />
      <motion.div 
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed top-0 right-0 bottom-0 w-full md:w-[480px] bg-[#0A1120] border-l border-slate-800/50 shadow-2xl z-[110] flex flex-col"
      >
        <div className="p-6 border-b border-slate-800/50 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white uppercase tracking-tight">{initialData ? 'Editar Transação' : 'Nova Transação'}</h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg bg-slate-800/50">
            <ArrowUpRight className="rotate-45" size={16} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex bg-[#050B14] p-1 rounded-xl border border-slate-800/50">
            <button 
              type="button"
              onClick={() => {setType('income'); setCategory('')}}
              className={`flex-1 py-2 text-sm font-bold uppercase tracking-wider rounded-lg transition-colors ${type === 'income' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Receita
            </button>
            <button 
              type="button"
              onClick={() => {setType('expense'); setCategory('')}}
              className={`flex-1 py-2 text-sm font-bold uppercase tracking-wider rounded-lg transition-colors ${type === 'expense' ? 'bg-rose-500/20 text-rose-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Despesa
            </button>
          </div>
          
          <div className="space-y-5">
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">Valor</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">R$</span>
                <input required type="number" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)} className="w-full bg-[#050B14] border border-slate-800 rounded-xl px-4 py-4 pl-10 text-white font-black text-2xl focus:border-emerald-500 transition-colors outline-none" placeholder="0,00" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">Forma de Pagamento</label>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setAccount('Débito')} className={`flex flex-col items-center justify-center p-2 rounded-xl text-xs font-bold transition-all ${account === 'Débito' ? 'bg-slate-700 text-white shadow-lg' : 'bg-[#050B14] text-slate-500 border border-slate-800 hover:bg-slate-800'}`}>
                      <CreditCard size={16} className="mb-1" /> Débito
                    </button>
                    <button type="button" onClick={() => setAccount('Crédito')} className={`flex flex-col items-center justify-center p-2 rounded-xl text-xs font-bold transition-all ${account === 'Crédito' ? 'bg-slate-700 text-white shadow-lg' : 'bg-[#050B14] text-slate-500 border border-slate-800 hover:bg-slate-800'}`}>
                      <CreditCard size={16} className="mb-1" /> Crédito
                    </button>
                    <button type="button" onClick={() => setAccount('PIX')} className={`flex flex-col items-center justify-center p-2 rounded-xl text-xs font-bold transition-all ${account === 'PIX' ? 'bg-slate-700 text-white shadow-lg' : 'bg-[#050B14] text-slate-500 border border-slate-800 hover:bg-slate-800'}`}>
                      <Wallet size={16} className="mb-1" /> PIX
                    </button>
                    <button type="button" onClick={() => setAccount('Dinheiro')} className={`flex flex-col items-center justify-center p-2 rounded-xl text-xs font-bold transition-all ${account === 'Dinheiro' ? 'bg-slate-700 text-white shadow-lg' : 'bg-[#050B14] text-slate-500 border border-slate-800 hover:bg-slate-800'}`}>
                      <Building2 size={16} className="mb-1" /> Dinheiro
                    </button>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">Categoria</label>
                <select required value={category} onChange={e=>setCategory(e.target.value)} className="w-full h-[68px] bg-[#050B14] border border-slate-800 rounded-xl px-4 text-white focus:border-emerald-500 transition-colors outline-none">
                  <option value="">Selecione...</option>
                  {categories.filter(c => c.type === type).map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">Descrição (Opcional)</label>
              <input type="text" value={description} onChange={e=>setDescription(e.target.value)} className="w-full bg-[#050B14] border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 transition-colors outline-none" placeholder="Ex: Referente a..." />
            </div>

            {type === 'income' && category === 'Mensalidade' && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="overflow-hidden">
                <label className="text-xs font-black text-emerald-500 uppercase tracking-widest block mb-2 flex items-center gap-1">
                  <User size={12} /> Vincular Atleta (Opcional)
                </label>
                <select value={athleteId} onChange={e=>setAthleteId(e.target.value)} className="w-full bg-[#050B14] border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 transition-colors outline-none">
                  <option value="">Não vincular...</option>
                  {athletes.map(acc => (
                     <option key={acc.id} value={acc.id}>{acc.name}</option>
                  ))}
                </select>
              </motion.div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">Data</label>
                <input required type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full bg-[#050B14] border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 transition-colors outline-none [color-scheme:dark]" />
              </div>
              
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">Status</label>
                <select value={status} onChange={e=>setStatus(e.target.value as any)} className="w-full bg-[#050B14] border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-emerald-500 transition-colors outline-none">
                  <option value="paid">Pago</option>
                  <option value="pending">Pendente</option>
                </select>
              </div>
            </div>
            
            <div className="bg-[#050B14] border border-slate-800 rounded-xl p-4 flex flex-col gap-4">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-6 h-6 rounded flex items-center justify-center border transition-colors ${isRecurring ? 'bg-indigo-500 border-indigo-500' : 'bg-transparent border-slate-600 group-hover:border-slate-400'}`}>
                  {isRecurring && <CheckCircle2 size={14} className="text-white" />}
                </div>
                <input type="checkbox" checked={isRecurring} onChange={e => setIsRecurring(e.target.checked)} className="hidden" />
                <div>
                  <p className="text-sm font-bold text-white">Transação Recorrente</p>
                  <p className="text-xs text-slate-500">Repetir esta transação mensalmente</p>
                </div>
              </label>

              <div className="h-px w-full bg-slate-800"></div>

              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2 flex justify-between">
                  <span>Anexo / Comprovante</span>
                </label>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  accept="image/*,.pdf"
                />
                
                {receiptFile ? (
                  <div className="flex items-center justify-between bg-[#0A1120] border border-slate-800 p-3 rounded-lg">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Paperclip size={14} className="text-emerald-500 shrink-0" />
                      <span className="text-sm text-slate-300 truncate">{receiptFile.name}</span>
                    </div>
                    <button type="button" onClick={() => setReceiptFile(null)} className="text-xs text-rose-500 font-bold hover:underline shrink-0">Remover</button>
                  </div>
                ) : (
                  <button 
                    type="button" 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 bg-[#0A1120] border border-slate-800 border-dashed p-4 rounded-lg text-slate-400 hover:text-white hover:border-slate-600 hover:bg-slate-800/50 transition-all text-sm"
                  >
                    <Plus size={16} /> Adicionar Arquivo
                  </button>
                )}
              </div>
            </div>

          </div>
          
          <div className="pt-6">
            <button disabled={isSubmitting} type="submit" className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-wider transition-colors ${type === 'income' ? 'bg-emerald-500 hover:bg-emerald-600 text-[#050B14]' : 'bg-rose-500 hover:bg-rose-600 text-white'}`}>
              {isSubmitting ? 'Salvando...' : 'Salvar Transação'}
            </button>
          </div>
        </form>
      </motion.div>
    </>
  );
}

function ReceiptModal({ transaction, onClose }: { transaction: Transaction, onClose: () => void }) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = printRef.current?.innerHTML;
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Recibo - ${transaction.description || ''}</title>
              <script src="https://cdn.tailwindcss.com"></script>
              <style>
                @media print {
                  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
              </style>
            </head>
            <body class="p-8 flex justify-center bg-gray-100" onload="window.print();">
              <div class="bg-white w-full max-w-3xl">
                ${printContent}
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white text-black w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800 uppercase tracking-widest text-sm flex items-center gap-2">
            <Printer size={16} /> Gerador de Recibos
          </h3>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg font-bold text-sm hover:bg-slate-100 transition-colors">
              Fechar
            </button>
            <button onClick={handlePrint} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold text-sm flex items-center gap-2 transition-colors">
              Imprimir Recibo
            </button>
          </div>
        </div>
        
        <div className="p-8 bg-slate-100 overflow-y-auto max-h-[70vh]">
           <div ref={printRef} className="bg-white border-[2px] border-slate-300 p-10 rounded-xl relative shadow-sm">
             {/* Textura ou marca invisível de fundo (opcional) */}
             <div className="text-center mb-10 pb-6 border-b border-slate-200">
                <h1 className="text-4xl font-black uppercase tracking-widest text-slate-800">RECIBO</h1>
                <div className="inline-block mt-4 px-6 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <p className="text-emerald-800 font-bold text-xl tracking-tight">R$ {transaction.amount.toFixed(2).replace('.', ',')}</p>
                </div>
             </div>

             <div className="space-y-6 text-lg text-slate-700 leading-relaxed max-w-xl mx-auto text-justify">
                <p>Recebemos de <strong>{(transaction.description || 'NÃO INFORMADO').toUpperCase()}</strong>, a quantia expressa de <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(transaction.amount)}</strong>.</p>
                
                <p>Referente a <strong>{transaction.category.toUpperCase()}</strong>, pago via <strong>{transaction.account}</strong>.</p>
                
                <div className="pt-6 text-slate-600 text-base italic">
                  &quot;Para maior clareza, firmamos o presente recibo, declarando total quitação deste valor.&quot;
                </div>
             </div>

             <div className="mt-20 pt-8 flex justify-between items-end">
                <div className="text-slate-500 text-sm">
                  <p className="font-bold text-slate-600 mb-1">Data da Emissão</p>
                  <p>{new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
                <div className="text-center flex flex-col items-center">
                  <div className="w-64 border-b border-slate-800 mb-3"></div>
                  <p className="font-bold text-slate-800">Assinatura / Responsável</p>
                  <p className="text-xs text-slate-500 mt-1">CNPJ / CPF do Credor</p>
                </div>
             </div>
           </div>
        </div>
      </motion.div>
    </div>
  )
}

function FinanceGoals({ goals, transactions }: { goals: any[], transactions: Transaction[] }) {
  const [addingAmountForGoal, setAddingAmountForGoal] = useState<any>(null);
  const [newAmount, setNewAmount] = useState('');

  const handleAddAmount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingAmountForGoal || !newAmount) return;
    try {
       const val = parseFloat(newAmount);
       const { error } = await supabase.from('financial_goals').update({ current_amount: addingAmountForGoal.current_amount + val}).eq('id', addingAmountForGoal.id);
       if (error) throw error;
       alert('Valor aportado com sucesso (Atualize a página para ver)');
       setAddingAmountForGoal(null);
       setNewAmount('');
    } catch (err: any) {
      alert("Erro ao depositar: " + err.message);
    }
  };

  return (
    <main className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {goals.length === 0 ? (
          <div className="bg-[#0A1120] border border-slate-800 rounded-xl p-8 col-span-full text-center text-slate-500 font-bold">
             Nenhuma meta customizada. Crie nas configurações financeiras!
          </div>
        ) : goals.map(g => {
          const progress = Math.min(100, Math.round((g.current_amount / g.target_amount) * 100));
          return (
            <div key={g.id} className="bg-[#0A1120] border border-amber-500/30 rounded-2xl p-6 relative overflow-hidden flex flex-col group">
              <div className="absolute top-0 right-0 p-5 opacity-5 pointer-events-none">
                <Target size={80} className="text-amber-500" />
              </div>
              <h3 className="font-black text-white text-lg relative z-10">{g.name}</h3>
              <p className="text-sm font-bold text-amber-500 mt-1 relative z-10">Arrecadado: R$ {g.current_amount} / R$ {g.target_amount}</p>
              
              <div className="mt-6 mb-2 bg-slate-800 rounded-full h-3 w-full overflow-hidden relative z-10 shadow-inner">
                <div className="bg-amber-500 h-full rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
              </div>
              <p className="text-xs text-right font-bold text-slate-400 mb-6 relative z-10">{progress}%</p>

              <div className="mt-auto relative z-10">
                <button onClick={() => setAddingAmountForGoal(g)} className="w-full bg-slate-800 hover:bg-slate-700 text-white rounded-xl py-3 font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-md">
                  <ArrowUpRight size={16} /> Fazer Aporte
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {addingAmountForGoal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#0A1120] border border-slate-800/50 rounded-2xl w-full max-w-sm p-6 relative shadow-2xl z-[110]">
             <h2 className="text-lg font-black text-white mb-4">Aporte para {addingAmountForGoal.name}</h2>
             <form onSubmit={handleAddAmount} className="space-y-4">
                <div>
                   <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">Valor a adicionar (R$)</label>
                   <input required autoFocus type="number" step="0.01" value={newAmount} onChange={e=>setNewAmount(e.target.value)} className="w-full bg-[#050B14] border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-amber-500 outline-none font-bold" />
                </div>
                <div className="flex gap-2 pt-2">
                   <button type="button" onClick={() => setAddingAmountForGoal(null)} className="flex-1 py-3 text-white bg-slate-800 hover:bg-slate-700 rounded-xl font-bold transition-colors">Cancelar</button>
                   <button type="submit" className="flex-1 py-3 text-[#050B14] bg-amber-500 hover:bg-amber-600 rounded-xl font-bold transition-colors shadow-lg shadow-amber-500/20">Depositar</button>
                </div>
             </form>
          </div>
        </div>
      )}
    </main>
  );
}

function LatePayments({ athletes, transactions }: { athletes: any[], transactions: Transaction[] }) {
  const currentMonthDate = new Date();
  const currentMonth = currentMonthDate.getMonth();
  const currentYear = currentMonthDate.getFullYear();

  const lateList = (() => {
    const paidAthleteIds = transactions.filter(t => {
       if (t.type !== 'income') return false;
       if (t.category !== 'Mensalidade') return false;
       if (t.status !== 'paid') return false;
       const d = new Date(t.date);
       return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).map(t => t.athlete_id);

    return athletes.filter(a => !paidAthleteIds.includes(a.id));
  })();

  const sendWhatsApp = (name: string) => {
     const defaultAmount = 150.00;
     const message = `Olá, ${name}! Notamos que a sua mensalidade deste mês (${currentMonthDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}) encontra-se pendente. Valor sugerido: R$ ${defaultAmount}. Chave PIX: nossoemail@gmail.com`;
     window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <main className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
      <div className="bg-[#0A1120] border border-slate-800/50 rounded-2xl flex flex-col p-6 shadow-xl">
         <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
            </div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">Gestão de Mensalidades</h2>
         </div>
         <p className="text-sm text-slate-500 mb-8 max-w-2xl">Aqui você visualiza os alunos que ainda não possuem um registro de &quot;Mensalidade&quot; pago no sistema no decorrer do mês atual.</p>

         <div className="space-y-4">
            {lateList.length === 0 ? (
               <div className="p-10 text-center text-emerald-500 font-bold bg-emerald-500/5 rounded-2xl border border-emerald-500/10 flex flex-col items-center">
                 <CheckCircle2 size={40} className="mb-4" />
                 <p className="text-lg">Excelente! Todos os alunos estão em dia.</p>
               </div>
            ) : lateList.map(a => (
               <div key={a.id} className="flex flex-col md:flex-row md:items-center justify-between bg-[#050B14] p-5 rounded-2xl border border-rose-500/20 hover:border-rose-500/40 transition-colors shadow-sm">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500 shadow-inner">
                        <User size={24} />
                     </div>
                     <div>
                        <h4 className="font-bold text-white text-lg tracking-tight mb-1">{a.name}</h4>
                        <span className="text-[10px] text-rose-500 font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-rose-500/10">Pendente</span>
                     </div>
                  </div>

                  <button onClick={() => sendWhatsApp(a.name)} className="mt-5 md:mt-0 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-[#050B14] rounded-xl font-black text-sm uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20">
                     <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                       <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
                     </svg>
                     Cobrar no WhatsApp
                  </button>
               </div>
            ))}
         </div>
      </div>
    </main>
  );
}

function SubscriptionsTab({ athletes, transactions }: { athletes: any[], transactions: Transaction[] }) {
  return (
    <main className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
      <div className="bg-[#0A1120] border border-slate-800/50 rounded-2xl flex flex-col p-6 shadow-xl">
         <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
               <Repeat size={20} />
            </div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">Gestão de Assinaturas API</h2>
         </div>
         <p className="text-sm text-slate-500 mb-8 max-w-2xl">Módulo de pagamento recorrente. Controle plano de alunos, faturamento automático via cartão de crédito e conciliação.</p>

         <div className="p-10 text-center text-slate-400 font-bold bg-[#050B14] rounded-2xl border border-slate-800 flex flex-col items-center">
            <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-500 mb-4">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-lg text-white mb-2">Nenhuma assinatura ativa</h3>
            <p className="max-w-md mx-auto text-sm font-medium pr-1 pl-1">Configure o seu Gateway de Pagamento (Stripe, Asaas, etc) no menu de Configurações para que as cobranças recorrentes apareçam aqui automaticamente.</p>
         </div>
      </div>
    </main>
  );
}

function DREReport({ transactions }: { transactions: Transaction[] }) {
  const currentMonthDate = new Date();
  const currentMonth = currentMonthDate.getMonth();
  const currentYear = currentMonthDate.getFullYear();

  const currentMonthTransactions = transactions.filter(t => {
     if (t.status !== 'paid') return false;
     const d = new Date(t.date);
     return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const receitaBruta = currentMonthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  
  const isTax = (c: string) => /imposto|taxa/i.test(c);
  const isCogs = (c: string) => /equipamento|kit|insumo/i.test(c);

  let impostos = 0;
  let custoVariavel = 0;
  let custoFixo = 0;

  currentMonthTransactions.filter(t => t.type === 'expense').forEach(t => {
    if (isTax(t.category)) impostos += t.amount;
    else if (isCogs(t.category)) custoVariavel += t.amount;
    else custoFixo += t.amount;
  });

  const lucroLiquido = receitaBruta - impostos - custoVariavel - custoFixo;
  const margem = receitaBruta > 0 ? (lucroLiquido / receitaBruta) * 100 : 0;

  return (
    <main className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
      <div className="bg-[#0A1120] border border-slate-800/50 rounded-2xl flex flex-col p-6 shadow-xl">
         <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
               <TrendingUp size={20} />
            </div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">DRE Gerencial (Mês Atual)</h2>
         </div>
         <p className="text-sm text-slate-500 mb-6 max-w-2xl">Demonstrativo de Resultado do Exercício. Acompanhe a saúde financeira, margem de lucro e os gargalos de custos.</p>

         <div className="space-y-4 max-w-3xl">
            <div className="flex justify-between items-center p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
               <span className="font-bold text-emerald-400">Receita Bruta</span>
               <span className="font-black text-emerald-400 text-lg">R$ {receitaBruta.toFixed(2)}</span>
            </div>
            
            <div className="pl-8 space-y-3 relative before:content-[''] before:absolute before:left-4 before:top-0 before:bottom-0 before:w-px before:bg-slate-800">
               <div className="flex justify-between items-center p-3 bg-[#050B14] border border-slate-800 rounded-lg">
                  <span className="text-sm font-bold text-rose-400">(-) Impostos & Taxas</span>
                  <span className="text-sm font-black text-rose-400">R$ {impostos.toFixed(2)}</span>
               </div>
               <div className="flex justify-between items-center p-3 bg-[#050B14] border border-slate-800 rounded-lg">
                  <span className="text-sm font-bold text-rose-400">(-) Custos Variáveis</span>
                  <span className="text-sm font-black text-rose-400">R$ {custoVariavel.toFixed(2)}</span>
               </div>
               <div className="flex justify-between items-center p-3 bg-[#050B14] border border-slate-800 rounded-lg">
                  <span className="text-sm font-bold text-rose-400">(-) Custos Fixos (Salários, Infraestrutura, etc)</span>
                  <span className="text-sm font-black text-rose-400">R$ {custoFixo.toFixed(2)}</span>
               </div>
            </div>

            <div className={`mt-6 flex justify-between items-center p-5 rounded-xl border ${lucroLiquido >= 0 ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
               <div>
                 <span className={`block font-black uppercase tracking-wider ${lucroLiquido >= 0 ? 'text-indigo-400' : 'text-rose-400'}`}>Lucro Líquido</span>
                 <span className="text-xs font-bold text-slate-400 mt-1">Margem: {margem.toFixed(1)}%</span>
               </div>
               <span className={`font-black text-2xl ${lucroLiquido >= 0 ? 'text-indigo-400' : 'text-rose-400'}`}>R$ {lucroLiquido.toFixed(2)}</span>
            </div>
         </div>
      </div>
    </main>
  );
}

function AsaasPaymentModal({ transaction, onClose }: { transaction: Transaction, onClose: () => void }) {
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [name, setName] = useState(transaction.description || 'Cliente Varejo');
  const [billingType, setBillingType] = useState<'PIX'|'BOLETO'>('PIX');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successData, setSuccessData] = useState<{ qrCodePic?: string, invoiceUrl?: string } | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      if (!cpfCnpj) throw new Error("CPF ou CNPJ é obrigatório para emissão.");
      
      const customer = await createAsaasCustomer({ 
         name, 
         cpfCnpj: cpfCnpj.replace(/\D/g, '') 
      });

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dueDate = tomorrow.toISOString().split('T')[0];

      const payment = await createAsaasPayment({
         customer: customer.id,
         billingType,
         value: transaction.amount,
         dueDate,
         description: transaction.description || 'Cobrança do Sistema',
         externalReference: transaction.id
      });

      let qrCodePic = undefined;
      if (billingType === 'PIX') {
         const pixData = await getAsaasPixQrCode(payment.id);
         qrCodePic = pixData.encodedImage;
      }

      await supabase.from('financial_transactions').update({
         asaas_payment_id: payment.id,
         asaas_invoice_url: payment.invoiceUrl
      }).eq('id', transaction.id);

      setSuccessData({
         qrCodePic,
         invoiceUrl: payment.invoiceUrl
      });
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erro ao gerar cobrança.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#0A1120] border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="p-5 border-b border-slate-800/50 flex justify-between items-center bg-[#050B14]">
          <h3 className="font-bold text-white uppercase tracking-widest text-sm flex items-center gap-2">
            <span className="text-xl leading-none">🪽</span> Cobrança Asaas
          </h3>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors">
             X
          </button>
        </div>
        
        <div className="p-6">
          {!successData ? (
             <form onSubmit={handleGenerate} className="space-y-4">
                {errorMsg && (
                   <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-lg text-xs font-bold">
                      {errorMsg}
                   </div>
                )}
                
                <div>
                   <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">Nome do Pagador</label>
                   <input required type="text" value={name} onChange={e=>setName(e.target.value)} className="w-full bg-[#050B14] border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none" />
                </div>

                <div>
                   <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">CPF ou CNPJ</label>
                   <input required type="text" value={cpfCnpj} onChange={e=>setCpfCnpj(e.target.value)} placeholder="Apenas os números" className="w-full bg-[#050B14] border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none" />
                </div>

                <div>
                   <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">Forma de Emissão</label>
                   <select required value={billingType} onChange={e=>setBillingType(e.target.value as any)} className="w-full bg-[#050B14] border border-slate-800 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none">
                      <option value="PIX">PIX</option>
                      <option value="BOLETO">Boleto Bancário</option>
                   </select>
                </div>

                <div className="pt-4">
                   <button disabled={isSubmitting} type="submit" className="w-full py-4 rounded-xl font-black text-sm uppercase tracking-wider text-[#050B14] bg-blue-500 hover:bg-blue-600 transition-colors disabled:opacity-50">
                      {isSubmitting ? 'Gerando...' : 'Gerar Cobrança'}
                   </button>
                </div>
             </form>
          ) : (
             <div className="text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 mb-4">
                   <CheckCircle2 size={32} />
                </div>
                <h4 className="text-white font-bold text-lg mb-2">Cobrança Gerada!</h4>
                <p className="text-sm text-slate-400 mb-6">A cobrança foi registrada com sucesso.</p>

                {successData.qrCodePic && (
                   <div className="mb-6 p-4 bg-white rounded-xl">
                      <img src={`data:image/png;base64,${successData.qrCodePic}`} alt="QR Code PIX" className="w-48 h-48 mx-auto" />
                   </div>
                )}
                
                {successData.invoiceUrl && (
                   <a href={successData.invoiceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold uppercase text-xs tracking-wider transition-colors mb-4 w-full">
                      <span className="text-base leading-none">🪽</span> Abrir Fatura (Link de Pagamento)
                   </a>
                )}
                
                <button onClick={onClose} className="px-6 py-2 text-slate-500 hover:text-white uppercase font-bold text-xs tracking-wider transition-colors w-full">
                   Fechar
                </button>
             </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}