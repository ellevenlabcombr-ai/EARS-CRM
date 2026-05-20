"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CreditCard, DollarSign, TrendingUp, History, Download, 
  Plus, AlertCircle, CheckCircle2, MoreVertical, Search, Filter, 
  Calendar, FileText, ChevronRight, Ban, Eye 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { t } from '@/lib/i18n';
import { useLanguage } from '@/contexts/LanguageContext';
import { createAsaasCustomer, createAsaasPayment } from '@/app/actions/asaas';

export function AthleteFinanceModule({ athlete }: { athlete: any }) {
  const { language } = useLanguage();
  const lang = language as 'pt' | 'en';
  
  const [activeView, setActiveView] = useState<'overview' | 'transactions'>('overview');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showChargeModal, setShowChargeModal] = useState(false);
  const [newCharge, setNewCharge] = useState({ 
    description: '', 
    amount: '', 
    dueDate: '', 
    category: 'custom',
    billingType: 'PIX',
    notifyGuardian: true
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [athlete.id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch active subscription
      const { data: subData } = await supabase
        .from('finance_subscriptions')
        .select('*, product:product_id(*)')
        .eq('athlete_id', athlete.id)
        .eq('status', 'active')
        .maybeSingle();
        
      if (subData) setSubscription(subData);

      // Fetch transactions
      const { data: txData } = await supabase
        .from('finance_transactions')
        .select('*')
        .eq('athlete_id', athlete.id)
        .order('date', { ascending: false });
        
      if (txData) setTransactions(txData);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleCreateCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCharge.amount || !newCharge.description) return;
    
    setIsSaving(true);
    
    try {
      let externalReference = null;
      let transactionIdInAsaas = null;

      if (newCharge.billingType !== 'INTERNO') {
        const cpf = athlete.guardian_cpf || athlete.cpf;
        const name = athlete.guardian_name || athlete.name;

        if (!cpf) {
          alert('CPF do responsável ou do atleta é obrigatório para gerar via Asaas.');
          setIsSaving(false);
          return;
        }

        const customerRes = await createAsaasCustomer({
           name: name || 'Cliente',
           cpfCnpj: cpf.replace(/\D/g, '')
        });

        if (customerRes.error) {
           alert('Erro ao criar cliente no Asaas: ' + customerRes.error);
           setIsSaving(false);
           return;
        }

        const paymentRes = await createAsaasPayment({
           customer: customerRes.data.id,
           billingType: newCharge.billingType as any,
           value: parseFloat(newCharge.amount),
           dueDate: newCharge.dueDate || new Date().toISOString().split('T')[0],
           description: newCharge.description,
        });

        if (paymentRes.error) {
           alert('Erro ao criar cobrança no Asaas: ' + paymentRes.error);
           setIsSaving(false);
           return;
        }

        externalReference = paymentRes.data.id;
        transactionIdInAsaas = paymentRes.data.invoiceUrl;
      }

      await supabase.from('finance_transactions').insert({
        athlete_id: athlete.id,
        description: newCharge.description,
        amount: parseFloat(newCharge.amount),
        type: 'income',
        status: 'pending',
        date: newCharge.dueDate || new Date().toISOString(),
        payment_method: newCharge.billingType,
        category: newCharge.category,
        external_reference: externalReference
      });

      if (newCharge.notifyGuardian) {
         const phone = athlete.guardian_phone || athlete.phone;
         if (phone) {
            let msg = `Olá! Segue cobrança referente a *${newCharge.description}* para o(a) atleta *${athlete.name}*.\n*Valor:* R$ ${parseFloat(newCharge.amount).toFixed(2)}`;
            if (newCharge.dueDate) {
               msg += `\n*Vencimento:* ${newCharge.dueDate.split('-').reverse().join('/')}`;
            }
            if (transactionIdInAsaas) {
               msg += `\n\nLink para pagamento: ${transactionIdInAsaas}`;
            }
            try {
              await fetch('/api/whatsapp/send', {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ phone, message: msg })
              });
            } catch (err) {
              console.error("Failed to send WhatsApp message:", err);
            }
         } else {
            alert('Atenção: Não foi possível notificar via WhatsApp, celular não cadastrado.');
         }
      }
      
      setShowChargeModal(false);
      setNewCharge({ description: '', amount: '', dueDate: '', category: 'custom', billingType: 'PIX', notifyGuardian: true });
      fetchData();
    } catch (e) {
      console.error(e);
      alert('Erro inesperado ao gerar cobrança.');
    }
    
    setIsSaving(false);
  };

  const markAsPaid = async (txId: string) => {
    await supabase.from('finance_transactions').update({ status: 'paid', date: new Date().toISOString() }).eq('id', txId);
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin"></div>
      </div>
    );
  }

  const totalPaid = transactions.filter(t => t.status === 'paid' && t.type === 'income').reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  const totalOverdue = transactions.filter(t => t.status === 'overdue' && t.type === 'income').reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
  const totalPending = transactions.filter(t => t.status === 'pending' && t.type === 'income').reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* HEADER TABS */}
      <div className="flex items-center gap-4 border-b border-slate-800 pb-4 overflow-x-auto hide-scrollbar">
        <button 
          onClick={() => setActiveView('overview')}
          className={`flex-shrink-0 px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all ${activeView === 'overview' ? 'bg-emerald-500 text-[#050B14] shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-slate-900/50 text-slate-500 hover:bg-slate-800 hover:text-emerald-400'}`}
        >
          Resumo Financeiro
        </button>
        <button 
          onClick={() => setActiveView('transactions')}
          className={`flex-shrink-0 px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all ${activeView === 'transactions' ? 'bg-emerald-500 text-[#050B14] shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-slate-900/50 text-slate-500 hover:bg-slate-800 hover:text-emerald-400'}`}
        >
          Extrato Detalhado
        </button>
        
        <div className="flex-1"></div>
        
        <button 
          onClick={() => setShowChargeModal(true)}
          className="flex-shrink-0 px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs bg-slate-800 text-white hover:bg-slate-700 transition-all flex items-center gap-2 active:scale-95"
        >
          <Plus size={14} />
          Nova Cobrança
        </button>
      </div>

      {activeView === 'overview' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-slate-900/40 border-slate-800/50 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <CheckCircle2 size={100} className="text-emerald-500" />
              </div>
              <CardContent className="p-6 relative z-10">
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Total Recebido</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-bold text-slate-400">R$</span>
                  <span className="text-4xl font-black text-white tracking-tight">{totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/40 border-slate-800/50 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <AlertCircle size={100} className="text-rose-500" />
              </div>
              <CardContent className="p-6 relative z-10">
                <p className="text-xs font-black text-rose-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                  Inadimplência
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-bold text-slate-400">R$</span>
                  <span className="text-4xl font-black text-rose-400 tracking-tight">{totalOverdue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/40 border-slate-800/50 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                <Calendar size={100} className="text-amber-500" />
              </div>
              <CardContent className="p-6 relative z-10">
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">A Receber</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-bold text-slate-400">R$</span>
                  <span className="text-4xl font-black text-amber-400 tracking-tight">{totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Subscription Detail */}
            <Card className="bg-slate-900/40 border-slate-800/50 p-6 col-span-1 lg:col-span-1 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <CreditCard size={150} className="text-slate-500" />
              </div>
              <div className="relative z-10">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Plano Principal</h3>
                
                {subscription ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-emerald-400 font-bold uppercase tracking-wider text-xs">Assinatura Ativa</span>
                        <div className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded text-[9px] font-black uppercase tracking-widest">OK</div>
                      </div>
                      <p className="text-2xl font-black text-white">{subscription.product?.name || 'Mensalidade'}</p>
                      <p className="text-slate-400 text-sm mt-1">R$ {subscription.amount} / {subscription.billing_cycle === 'monthly' ? 'mês' : subscription.billing_cycle}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-900/50 rounded-xl border border-dashed border-slate-700">
                    <Ban className="w-10 h-10 text-slate-600 mb-3" />
                    <p className="text-slate-400 font-medium">Nenhum plano ativo</p>
                    <button className="mt-4 px-4 py-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg text-xs font-bold uppercase tracking-widest transition-all">
                      Vincular Plano
                    </button>
                  </div>
                )}
              </div>
            </Card>

            {/* Recent Transactions List */}
            <Card className="bg-slate-900/40 border-slate-800/50 p-6 col-span-1 lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Últimos Lançamentos</h3>
                <button onClick={() => setActiveView('transactions')} className="text-emerald-500 hover:text-emerald-400 text-xs font-bold uppercase tracking-widest">Ver Todos</button>
              </div>

              {transactions.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                  <p className="text-slate-500 font-bold">Nenhuma transação encontrada</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.slice(0, 5).map(tx => (
                    <div key={tx.id} className="flex items-center justify-between p-4 bg-[#0A1120] rounded-xl border border-slate-800 hover:border-slate-700 transition-all">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${tx.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' : tx.status === 'overdue' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'}`}>
                          {tx.status === 'paid' ? <CheckCircle2 size={18} /> : tx.status === 'overdue' ? <AlertCircle size={18} /> : <Clock size={18} />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{tx.description}</p>
                          <p className="text-xs font-medium text-slate-500">{new Date(tx.date).toLocaleDateString()} • {tx.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-black ${tx.status === 'paid' ? 'text-white' : tx.status === 'overdue' ? 'text-rose-400' : 'text-amber-400'}`}>
                          R$ {Number(tx.amount).toFixed(2)}
                        </p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                          {tx.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {activeView === 'transactions' && (
        <Card className="bg-slate-900/40 border-slate-800/50 p-6 overflow-hidden">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <h3 className="text-sm font-black text-white uppercase tracking-widest">Extrato de Movimentações</h3>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="text" placeholder="Buscar lançamento..." className="w-full bg-[#050B14] border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors" />
              </div>
              <button className="p-2 border border-slate-800 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
                <Filter size={18} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-black text-slate-500 uppercase tracking-widest">
                  <th className="py-4 font-black">Data</th>
                  <th className="py-4 font-black">Descrição</th>
                  <th className="py-4 font-black">Categoria</th>
                  <th className="py-4 font-black text-right">Valor</th>
                  <th className="py-4 font-black text-center">Status</th>
                  <th className="py-4 font-black text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {transactions.map(tx => (
                  <tr key={tx.id} className="border-b border-slate-800/50 hover:bg-slate-800/20 transition-all group">
                    <td className="py-4 text-slate-300 font-medium whitespace-nowrap">{new Date(tx.date).toLocaleDateString()}</td>
                    <td className="py-4 font-bold text-white">{tx.description}</td>
                    <td className="py-4">
                      <span className="px-2 py-1 bg-slate-800 text-slate-400 rounded text-xs font-bold">
                        {tx.category}
                      </span>
                    </td>
                    <td className="py-4 text-right font-black text-white whitespace-nowrap">R$ {Number(tx.amount).toFixed(2)}</td>
                    <td className="py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded border text-[10px] font-black uppercase tracking-widest ${
                        tx.status === 'paid' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                        tx.status === 'overdue' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' :
                        'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      }`}>
                        {tx.status === 'paid' && <CheckCircle2 size={10} />}
                        {tx.status === 'overdue' && <AlertCircle size={10} />}
                        {tx.status === 'pending' && <Clock size={10} />}
                        {tx.status === 'paid' ? 'Pago' : tx.status === 'overdue' ? 'Vencido' : 'Pendente'}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {tx.status !== 'paid' && (
                          <button onClick={() => markAsPaid(tx.id)} className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-all" title="Marcar como pago">
                            <CheckCircle2 size={16} />
                          </button>
                        )}
                        <button className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition-all">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      Nenhum lançamento no extrato.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* NEW CHARGE MODAL */}
      <AnimatePresence>
        {showChargeModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-[#0A1120] border border-cyan-500/20 shadow-2xl rounded-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-cyan-500/20 bg-cyan-950/10">
                <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-3">
                  <DollarSign className="text-cyan-400" />
                  Nova Cobrança
                </h2>
                <p className="text-sm text-slate-400 mt-1">Gere uma nova fatura avulsa para {athlete.name}</p>
              </div>

              <form onSubmit={handleCreateCharge} className="p-6 space-y-5">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">Descrição do Lançamento</label>
                  <input 
                    type="text" 
                    value={newCharge.description}
                    onChange={e => setNewCharge({...newCharge, description: e.target.value})}
                    placeholder="Ex: Taxa de Competição"
                    className="w-full bg-[#050B14] border border-slate-800 rounded-xl py-3 px-4 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors font-medium"
                    required
                  />
                </div>

                <div className="flex gap-4">
                  <div className="space-y-2 flex-1">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">Valor (R$)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={newCharge.amount}
                      onChange={e => setNewCharge({...newCharge, amount: e.target.value})}
                      placeholder="0.00"
                      className="w-full bg-[#050B14] border border-slate-800 rounded-xl py-3 px-4 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors font-medium"
                      required
                    />
                  </div>
                  <div className="space-y-2 flex-1">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">Vencimento</label>
                    <input 
                      type="date"
                      value={newCharge.dueDate}
                      onChange={e => setNewCharge({...newCharge, dueDate: e.target.value})}
                      className="w-full bg-[#050B14] border border-slate-800 rounded-xl py-3 px-4 text-slate-300 focus:outline-none focus:border-cyan-500 transition-colors font-medium"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">Categoria / Caixinha</label>
                  <select 
                    value={newCharge.category}
                    onChange={e => setNewCharge({...newCharge, category: e.target.value})}
                    className="w-full bg-[#050B14] border border-slate-800 rounded-xl py-3 px-4 text-slate-300 focus:outline-none focus:border-cyan-500 transition-colors font-medium"
                  >
                    <option value="mensalidade">Mensalidade</option>
                    <option value="uniforme">Uniforme / Kit</option>
                    <option value="torneio">Taxa de Torneio</option>
                    <option value="sessao_extra">Sessão Avulsa</option>
                    <option value="custom">Outros</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest block">Método de Cobrança</label>
                  <select 
                    value={newCharge.billingType}
                    onChange={e => setNewCharge({...newCharge, billingType: e.target.value})}
                    className="w-full bg-[#050B14] border border-slate-800 rounded-xl py-3 px-4 text-slate-300 focus:outline-none focus:border-cyan-500 transition-colors font-medium"
                  >
                    <option value="PIX">PIX (Asaas)</option>
                    <option value="BOLETO">Boleto (Asaas)</option>
                    <option value="CREDIT_CARD">Cartão de Crédito (Asaas)</option>
                    <option value="INTERNO">Interno / Sem Asaas</option>
                  </select>
                  {newCharge.billingType !== 'INTERNO' && (!athlete.guardian_cpf && !athlete.cpf) && (
                    <p className="text-xs text-rose-500 flex items-center gap-1 mt-1">
                      <AlertCircle size={12} />
                      Atleta ou Responsável precisa ter CPF cadastrado para usar o Asaas.
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                  <input 
                    type="checkbox" 
                    id="notifyGuardian"
                    checked={newCharge.notifyGuardian}
                    onChange={e => setNewCharge({...newCharge, notifyGuardian: e.target.checked})}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-950"
                  />
                  <label htmlFor="notifyGuardian" className="text-sm font-medium text-slate-300 flex-1 cursor-pointer">
                    Notificar responsável por WhatsApp
                  </label>
                </div>

                <div className="pt-4 flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setShowChargeModal(false)}
                    className="flex-1 py-3 text-slate-400 font-black uppercase tracking-widest text-xs hover:bg-slate-800 rounded-xl transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black uppercase tracking-widest text-xs rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : 'Gerar Cobrança'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Dummy Clock component since we don't naturally import it from lucide as 'Clock' instead of using Lucide Clock
function Clock({ size, className }: { size: number, className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
}

function Loader2({ size, className }: { size: number, className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>;
}
