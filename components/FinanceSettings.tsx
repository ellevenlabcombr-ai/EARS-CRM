"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash, CheckCircle2, Lock, Target, TrendingUp, X, DollarSign, CreditCard, AlertTriangle, Save, Tag, Percent, Users, FileText, Folder, Receipt, Bell, Wallet, Key, Building2, HeartPulse, FileDown, ShieldAlert, Calculator } from 'lucide-react';
import { getLocalDateString } from '@/lib/utils';

export function FinanceSettings() {
  const [categories, setCategories] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [closures, setClosures] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [billingRules, setBillingRules] = useState<any>({});
  const [taxes, setTaxes] = useState<any[]>([]);
  const [splits, setSplits] = useState<any[]>([]);
  const [costCenters, setCostCenters] = useState<any[]>([]);
  const [invoiceSettings, setInvoiceSettings] = useState<any>({});
  const [notificationSettings, setNotificationSettings] = useState<any>({});
  const [wallets, setWallets] = useState<any[]>([]);
  const [gateways, setGateways] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [insurances, setInsurances] = useState<any[]>([]);

  const [newInsuranceName, setNewInsuranceName] = useState('');
  const [newInsuranceCode, setNewInsuranceCode] = useState('');
  const [newInsuranceCopart, setNewInsuranceCopart] = useState(false);
  
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

  const [newTaxName, setNewTaxName] = useState('');
  const [newTaxRate, setNewTaxRate] = useState('');
  const [newTaxType, setNewTaxType] = useState('retention');

  const [newSplitName, setNewSplitName] = useState('');
  const [newSplitRecipient, setNewSplitRecipient] = useState('');
  const [newSplitPercentage, setNewSplitPercentage] = useState('');
  const [newSplitFeeRule, setNewSplitFeeRule] = useState('none');
  const [newSplitFixed, setNewSplitFixed] = useState('');
  const [newSplitTaxRule, setNewSplitTaxRule] = useState('none');

  const [newCostCenterName, setNewCostCenterName] = useState('');
  const [newCostCenterDesc, setNewCostCenterDesc] = useState('');

  const [newWalletName, setNewWalletName] = useState('');
  const [newWalletType, setNewWalletType] = useState('bank');
  const [newWalletBalance, setNewWalletBalance] = useState('');

  const [newVendorName, setNewVendorName] = useState('');
  const [newVendorDocument, setNewVendorDocument] = useState('');
  const [newVendorCategory, setNewVendorCategory] = useState('');

  const [newGatewayProvider, setNewGatewayProvider] = useState('asaas');
  const [newGatewayKey, setNewGatewayKey] = useState('');
  
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!supabase) return;

    const safeFetch = async (query: any) => {
      try { return await query; } catch(e) { return { error: e }; }
    };

    const [catsRes, goalsRes, closuresRes, productsRes, paymentRes, rulesRes, taxesRes, splitsRes, costCentersRes, invoiceSettingsRes, numSettingsRes, walletsRes, gatewaysRes, vendorsRes, insurancesRes] = await Promise.all([
      safeFetch(supabase.from('financial_categories').select('*').order('name')),
      safeFetch(supabase.from('financial_goals').select('*').order('created_at', { ascending: false })),
      safeFetch(supabase.from('financial_closures').select('*').order('month', { ascending: false })),
      safeFetch(supabase.from('financial_products').select('*').order('name')),
      safeFetch(supabase.from('financial_payment_methods').select('*').order('name')),
      safeFetch(supabase.from('financial_billing_rules').select('*').limit(1).single()),
      safeFetch(supabase.from('financial_taxes').select('*').order('name')),
      safeFetch(supabase.from('financial_splits').select('*').order('name')),
      safeFetch(supabase.from('financial_cost_centers').select('*').order('name')),
      safeFetch(supabase.from('financial_invoice_settings').select('*').limit(1).single()),
      safeFetch(supabase.from('financial_notification_settings').select('*').limit(1).single()),
      safeFetch(supabase.from('financial_wallets').select('*').order('name')),
      safeFetch(supabase.from('financial_api_gateways').select('*').order('provider_name')),
      safeFetch(supabase.from('financial_vendors').select('*, financial_categories(name)').order('name')),
      safeFetch(supabase.from('financial_health_insurances').select('*').order('name'))
    ]);

    let hasMissingTables = false;
    if (catsRes.error || goalsRes.error || closuresRes.error || productsRes.error || paymentRes.error || taxesRes.error || splitsRes.error || costCentersRes.error || invoiceSettingsRes.error || numSettingsRes.error || walletsRes.error || gatewaysRes.error || vendorsRes.error || insurancesRes.error) {
       hasMissingTables = true;
    }

    if (catsRes.data) setCategories(catsRes.data);
    if (goalsRes.data) setGoals(goalsRes.data);
    if (closuresRes.data) setClosures(closuresRes.data);
    if (productsRes.data) setProducts(productsRes.data);
    if (paymentRes.data) setPaymentMethods(paymentRes.data);
    if (taxesRes.data) setTaxes(taxesRes.data);
    if (splitsRes.data) setSplits(splitsRes.data);
    if (costCentersRes.data) setCostCenters(costCentersRes.data);
    if (walletsRes.data) setWallets(walletsRes.data);
    if (gatewaysRes.data) setGateways(gatewaysRes.data);
    if (vendorsRes.data) setVendors(vendorsRes.data);
    if (insurancesRes.data) setInsurances(insurancesRes.data);
    
    if (rulesRes.data) {
      setBillingRules(rulesRes.data);
    }
    if (invoiceSettingsRes.data) {
      setInvoiceSettings(invoiceSettingsRes.data);
    }
    if (numSettingsRes.data) {
      setNotificationSettings(numSettingsRes.data);
    } else if (!hasMissingTables && !rulesRes.error) {
      // Init default rules if none exists and table exists
      try {
        const { data: newRules } = await supabase.from('financial_billing_rules').insert({}).select().single();
        if (newRules) setBillingRules(newRules);
      } catch(e) {}
    }

    if (hasMissingTables) {
      showMessage('ATENÇÃO: Vá na aba "Desenv." e execute o Database Seeder para atualizar as tabelas do Financeiro!', 'error');
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

  const deleteCategory = async (id: string) => {
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
  const loadAsaasFees = async () => {
    try {
      const asaasMethods = [
        { name: 'Pix (Asaas)', type: 'pix', fee_percentage: 0.99 },
        { name: 'Boleto (Asaas)', type: 'boleto', fee_fixed: 2.99, fee_percentage: 0 },
        { name: 'Cartão Crédito 30d (Asaas)', type: 'credit_card', fee_percentage: 4.99 }
      ];
      const { error } = await supabase.from('financial_payment_methods').insert(asaasMethods);
      if (error) throw error;
      fetchData();
      showMessage('Taxas Asaas importadas com sucesso!', 'success');
    } catch (err: any) {
      console.error("Asaas import error:", err);
      showMessage(`Erro ao importar taxas Asaas: ${err.message}`, 'error');
    }
  };

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

  // TAXES
  const addTax = async () => {
    if (!newTaxName.trim() || !newTaxRate) return;
    try {
      await supabase.from('financial_taxes').insert({
        name: newTaxName.trim(),
        rate: parseFloat(newTaxRate),
        type: newTaxType
      });
      setNewTaxName('');
      setNewTaxRate('');
      fetchData();
    } catch (error: any) {
      showMessage('Erro ao adicionar imposto.', 'error');
    }
  };

  const deleteTax = async (id: string) => {
    if (!confirm('Deseja excluir este imposto/retenção?')) return;
    try {
      await supabase.from('financial_taxes').delete().eq('id', id);
      fetchData();
    } catch (error: any) {
      showMessage('Erro ao excluir imposto.', 'error');
    }
  };

  // SPLITS
  const addSplit = async () => {
    if (!newSplitName.trim() || !newSplitRecipient.trim() || !newSplitPercentage) return;
    try {
      await supabase.from('financial_splits').insert({
        name: newSplitName.trim(),
        recipient_name: newSplitRecipient.trim(),
        percentage: parseFloat(newSplitPercentage),
        fee_discount_rule: newSplitFeeRule,
        fixed_value: parseFloat(newSplitFixed) || 0,
        tax_retention_rule: newSplitTaxRule
      });
      setNewSplitName('');
      setNewSplitRecipient('');
      setNewSplitPercentage('');
      setNewSplitFeeRule('none');
      setNewSplitFixed('');
      setNewSplitTaxRule('none');
      fetchData();
    } catch (error: any) {
      showMessage('Erro ao adicionar split.', 'error');
    }
  };

  const deleteSplit = async (id: string) => {
    if (!confirm('Deseja excluir este split?')) return;
    try {
      await supabase.from('financial_splits').delete().eq('id', id);
      fetchData();
    } catch (error: any) {
      showMessage('Erro ao excluir split.', 'error');
    }
  };

  // COST CENTERS
  const addCostCenter = async () => {
    if (!newCostCenterName.trim()) return;
    try {
      await supabase.from('financial_cost_centers').insert({
        name: newCostCenterName.trim(),
        description: newCostCenterDesc.trim()
      });
      setNewCostCenterName('');
      setNewCostCenterDesc('');
      fetchData();
    } catch (error: any) {
      showMessage('Erro ao adicionar centro de custo.', 'error');
    }
  };

  const deleteCostCenter = async (id: string) => {
    if (!confirm('Deseja excluir este centro de custo?')) return;
    try {
      await supabase.from('financial_cost_centers').delete().eq('id', id);
      fetchData();
    } catch (error: any) {
      showMessage('Erro ao excluir centro de custo.', 'error');
    }
  };

  // WALLETS / BANK ACCOUNTS
  const addWallet = async () => {
    if (!newWalletName.trim()) return;
    try {
      await supabase.from('financial_wallets').insert({
        name: newWalletName.trim(),
        type: newWalletType,
        initial_balance: parseFloat(newWalletBalance) || 0
      });
      setNewWalletName('');
      setNewWalletBalance('');
      fetchData();
    } catch (error: any) {
      showMessage('Erro ao adicionar conta/caixa.', 'error');
    }
  };

  const deleteWallet = async (id: string) => {
    if (!confirm('Deseja excluir esta conta/caixa?')) return;
    try {
      await supabase.from('financial_wallets').delete().eq('id', id);
      fetchData();
    } catch (error: any) {
      showMessage('Erro ao excluir conta/caixa.', 'error');
    }
  };

  // HEALTH INSURANCES
  const addInsurance = async () => {
    if (!newInsuranceName.trim()) return;
    try {
      await supabase.from('financial_health_insurances').insert({
        name: newInsuranceName.trim(),
        registration_code: newInsuranceCode.trim(),
        has_coparticipation: newInsuranceCopart
      });
      setNewInsuranceName('');
      setNewInsuranceCode('');
      setNewInsuranceCopart(false);
      fetchData();
    } catch (error: any) {
      showMessage('Erro ao adicionar convênio.', 'error');
    }
  };

  const deleteInsurance = async (id: string) => {
    if (!confirm('Deseja excluir este convênio?')) return;
    try {
      await supabase.from('financial_health_insurances').delete().eq('id', id);
      fetchData();
    } catch (error: any) {
      showMessage('Erro ao excluir convênio.', 'error');
    }
  };

  // VENDORS
  const addVendor = async () => {
    if (!newVendorName.trim()) return;
    try {
      await supabase.from('financial_vendors').insert({
        name: newVendorName.trim(),
        document: newVendorDocument.trim(),
        category_id: newVendorCategory || null
      });
      setNewVendorName('');
      setNewVendorDocument('');
      setNewVendorCategory('');
      fetchData();
    } catch (error: any) {
      showMessage('Erro ao adicionar fornecedor.', 'error');
    }
  };

  const deleteVendor = async (id: string) => {
    if (!confirm('Deseja excluir este fornecedor?')) return;
    try {
      await supabase.from('financial_vendors').delete().eq('id', id);
      fetchData();
    } catch (error: any) {
      showMessage('Erro ao excluir fornecedor.', 'error');
    }
  };

  // API GATEWAYS
  const addGateway = async () => {
    if (!newGatewayProvider.trim() || !newGatewayKey.trim()) return;
    try {
      await supabase.from('financial_api_gateways').insert({
        provider_name: newGatewayProvider.trim(),
        api_key: newGatewayKey.trim(),
        is_active: true
      });
      setNewGatewayKey('');
      fetchData();
    } catch (error: any) {
      showMessage('Erro ao adicionar integração.', 'error');
    }
  };

  const deleteGateway = async (id: string) => {
    if (!confirm('Deseja excluir e revogar esta integração?')) return;
    try {
      await supabase.from('financial_api_gateways').delete().eq('id', id);
      fetchData();
    } catch (error: any) {
      showMessage('Erro ao excluir integração.', 'error');
    }
  };

  // INVOICE SETTINGS
  const saveInvoiceSettings = async () => {
    try {
      if (invoiceSettings.id) {
        await supabase.from('financial_invoice_settings').update(invoiceSettings).eq('id', invoiceSettings.id);
      } else {
        await supabase.from('financial_invoice_settings').insert(invoiceSettings);
      }
      showMessage('Configurações de NF-e salvas!', 'success');
      fetchData();
    } catch (error: any) {
      showMessage('Erro ao salvar NF-e.', 'error');
    }
  };

  // NOTIFICATION SETTINGS
  const saveNotificationSettings = async () => {
    try {
      if (notificationSettings.id) {
        await supabase.from('financial_notification_settings').update(notificationSettings).eq('id', notificationSettings.id);
      } else {
        await supabase.from('financial_notification_settings').insert(notificationSettings);
      }
      showMessage('Notificações salvas com sucesso!', 'success');
      fetchData();
    } catch (error: any) {
      showMessage('Erro ao salvar notificações.', 'error');
    }
  };

  // BILLING RULES
  const saveBillingRules = async () => {
    try {
      const payload = {
        default_due_day: parseInt(billingRules.default_due_day || 5),
        reminder_days_before: parseInt(billingRules.reminder_days_before || 3),
        warn_after_days_late: parseInt(billingRules.warn_after_days_late || 1),
        penalty_rate: parseFloat(billingRules.penalty_rate || 2),
        interest_rate_monthly: parseFloat(billingRules.interest_rate_monthly || 1),
        block_scheduling_on_overdue: billingRules.block_scheduling_on_overdue || false,
        block_after_days: parseInt(billingRules.block_after_days || 0),
        require_daily_cash: billingRules.require_daily_cash || false,
        auto_match_ofx: billingRules.auto_match_ofx || false
      };

      if (!billingRules.id) {
        const { error, data } = await supabase.from('financial_billing_rules').insert(payload).select().single();
        if (error) throw error;
        if (data) setBillingRules(data);
      } else {
        const { error } = await supabase.from('financial_billing_rules').update(payload).eq('id', billingRules.id);
        if (error) throw error;
      }
      showMessage('Regras salvas com sucesso!', 'success');
    } catch (err: any) {
      showMessage('Erro ao salvar regras. Verifique se o Database Seeder foi executado.', 'error');
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

      {/* HEADER AND MANUAL BANNER */}
      <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-700 ease-out" />
        <div className="relative z-10 flex-1">
          <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <DollarSign className="text-emerald-500" size={28} /> Painel Financeiro
          </h2>
          <p className="text-xs md:text-sm text-slate-400 mt-2 font-medium leading-relaxed max-w-2xl">
            Configure as regras de cobrança, métodos de pagamento, centro de custos,<br className="hidden md:block"/> rateios automáticos (splits) e integrações de recebimento.
          </p>
        </div>
        <div className="relative z-10 shrink-0">
          <button
             onClick={() => {
               const newWindow = window.open('', '_blank');
               if (newWindow) {
                 newWindow.document.write(`
                  <html>
                  <head>
                    <title>Manual do Módulo Financeiro</title>
                    <style>
                      body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #e2e8f0; line-height: 1.6; padding: 2rem; max-w: 800px; margin: 0 auto; }
                      h1 { color: #fff; font-size: 2rem; border-bottom: 2px solid #334155; padding-bottom: 1rem; margin-bottom: 2rem; }
                      h2 { color: #10b981; margin-top: 2.5rem; border-bottom: 1px dashed #334155; padding-bottom: 0.5rem; }
                      p, li { color: #94a3b8; }
                      strong { color: #e2e8f0; }
                    </style>
                  </head>
                  <body>
                    <h1>Manual do Painel Financeiro</h1>

                    <h2>1. Categorias (Plano de Contas)</h2>
                    <p>Estrutura fundamental para classificar de onde o dinheiro vem (Receitas) e para onde ele vai (Despesas).</p>
                    
                    <h2>2. Centros de Custo</h2>
                    <p>Divisão de despesas e receitas por projetos, departamentos ou unidades de negócio. Funciona em paralelo às categorias.</p>
                    
                    <h2>3. Contas & Caixas (Wallets)</h2>
                    <p>Gestão individualizada de saldos de contas bancárias, caixas físicos ou carteiras digitais. Aqui você cadastra suas origens e caixinhas da recepção.</p>

                    <h2>4. Convênios e Parceiros (Health Insurances)</h2>
                    <p>Adicione convênios que sua clínica atende (ex: Unimed, SulAmérica). Configure códigos ANS e sinalize se o convênio exige coparticipação do paciente, estruturando o repasse de guias TISS/TUSS.</p>
                    
                    <h2>5. Splits e Comissões (Rateios)</h2>
                    <p>Sistema de divisão automatizada de receitas entre os profissionais e a clínica. Configure comissões % ou subtraia um <b>Valor Fixo</b> por sessão. Você também pode decidir abater eventuais tarifas de cartão <i>antes</i> de processar o split daquele profissional.</p>
                    
                    <h2>6. Cobrança e Inadimplência</h2>
                    <p>Defina as políticas automáticas para quem atrasar pagamento. Inclui <b>Multa (%) e Juros (a.m)</b>. Também contém a trava operacional <b>'Bloqueio de Inadimplentes'</b>, onde você define com quantos dias de atraso o sistema deve barrar novos agendamentos daquele cliente / paciente.</p>
                    
                    <h2>7. Operacional: Caixa Diário</h2>
                    <p>Ative a opção <b>'Travar Sistema Sem Caixa'</b> para forçar recepcionistas a terem um 'caixa formal do dia' aberto. Isso impede o recebimento no balcão de valores que ficam 'soltos' sem documentação de fechamento e conferência.</p>
                    
                    <h2>8. Operacional: Conciliação OFX (Auto-Match)</h2>
                    <p>Quando ativado, libera a interface inteligente de extratos (na tela de transações) onde o sistema sugere baixas automaticamente varrendo o arquivo do extrato emitido pelo banco contra os lançamentos e boletos pendentes no sistema.</p>
                    
                    <hr style="margin-top: 3rem; border-color: #334155;" />
                    <p style="text-align: center; font-size: 0.8rem; margin-top: 2rem;">Pode fechar esta janela para retornar ao sistema.</p>
                  </body>
                  </html>
                 `);
               }
             }}
             className="px-6 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <FileText size={18} />
            Ler Manual
          </button>
        </div>
      </div>

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
                     {c.name} <button onClick={() => deleteCategory(c.id)} className="text-emerald-500 hover:text-emerald-300 transition-colors"><X size={12} /></button>
                   </span>
                 ))}
                 {categories.filter(c => c.type === 'income').length === 0 && <span className="text-xs text-slate-600">Nenhuma registrada</span>}
              </div>

              <h4 className="text-[10px] md:text-xs font-black text-rose-500/50 uppercase tracking-widest pt-3">Despesas</h4>
              <div className="flex flex-wrap gap-2">
                 {categories.filter(c => c.type === 'expense').map(c => (
                   <span key={c.id} className="text-[10px] md:text-xs font-bold px-3 py-1.5 border border-rose-500/20 bg-rose-500/5 text-rose-400 rounded-xl flex items-center gap-2">
                     {c.name} <button onClick={() => deleteCategory(c.id)} className="text-rose-500 hover:text-rose-300 transition-colors"><X size={12} /></button>
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
            <div className="flex-1 flex justify-between items-center">
              <div>
                <h3 className="text-sm md:text-base font-black text-white uppercase tracking-tight">Formas & Taxas</h3>
                <p className="text-[10px] md:text-xs text-slate-500 font-medium">Tipos de pagamento e descontos</p>
              </div>
              <button onClick={loadAsaasFees} className="px-3 py-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-[10px] font-black uppercase tracking-widest rounded-lg border border-blue-500/20 transition-all">
                + Asaas
              </button>
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
                    <span className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">
                      {p.fee_percentage > 0 && `${p.fee_percentage}%`}
                      {p.fee_percentage > 0 && p.fee_fixed > 0 && ' + '}
                      {p.fee_fixed > 0 && `R$ ${p.fee_fixed}`}
                      {p.fee_percentage === 0 && (p.fee_fixed === 0 || !p.fee_fixed) && 'S/ taxa'}
                    </span>
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
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block">Multa por Atraso (%)</label>
                  <input value={billingRules?.penalty_rate || ''} onChange={e=>setBillingRules({...billingRules, penalty_rate: e.target.value})} type="number" step="0.1" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-medium focus:border-rose-500/50 outline-none text-slate-300" />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block">Juros ao Mês (%)</label>
                  <input value={billingRules?.interest_rate_monthly || ''} onChange={e=>setBillingRules({...billingRules, interest_rate_monthly: e.target.value})} type="number" step="0.1" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-medium focus:border-rose-500/50 outline-none text-slate-300" />
                </div>
              </div>

               <label className="flex items-center gap-3 p-4 bg-slate-950/50 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition-colors mt-2">
                 <input type="checkbox" checked={billingRules?.block_scheduling_on_overdue || false} onChange={e=>setBillingRules({...billingRules, block_scheduling_on_overdue: e.target.checked})} className="w-5 h-5 rounded border-slate-700 bg-slate-900 checked:bg-rose-500 focus:ring-0 focus:ring-offset-0 text-rose-500" />
                 <div className="flex-1">
                   <p className="text-sm font-bold text-white">Bloqueio de Inadimplentes</p>
                   <p className="text-[10px] text-slate-500">Impedir novos agendamentos se em atraso.</p>
                 </div>
               </label>
               
               {billingRules?.block_scheduling_on_overdue && (
                  <div>
                    <label className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest mb-2 block">Bloquear após (dias de atraso)</label>
                    <input value={billingRules?.block_after_days || ''} onChange={e=>setBillingRules({...billingRules, block_after_days: e.target.value})} type="number" min="0" className="w-full bg-slate-950 border border-rose-500/50 rounded-xl px-4 py-3 text-sm font-medium focus:border-rose-500 outline-none text-white shadow-[0_0_15px_-3px_rgba(244,63,94,0.1)]" placeholder="Ex: 5" />
                  </div>
               )}
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

        {/* IMPOSTOS E TRIBUTOS */}
        <section className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl flex flex-col h-full">
          <div className="flex items-center gap-3 md:gap-4 mb-6 border-b border-slate-800/50 pb-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-pink-500/10 text-pink-500 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-black text-white uppercase tracking-tight">Impostos e Tributos</h3>
              <p className="text-[10px] md:text-xs text-slate-500 font-medium">Retenções na Fonte e Adicionais</p>
            </div>
          </div>

          <div className="space-y-6 flex-1">
             <div className="flex flex-col gap-2">
                <input value={newTaxName} onChange={e=>setNewTaxName(e.target.value)} type="text" placeholder="Ex: ISS, IRRF" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-medium focus:border-pink-500/50 outline-none placeholder:text-slate-600" />
                <div className="flex gap-2">
                  <select value={newTaxType} onChange={e=>setNewTaxType(e.target.value)} className="w-[45%] bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-medium focus:border-pink-500/50 outline-none text-slate-300">
                    <option value="retention">Retenção (Desconto)</option>
                    <option value="addition">Acréscimo (Soma)</option>
                  </select>
                  <input value={newTaxRate} onChange={e=>setNewTaxRate(e.target.value)} type="number" placeholder="%" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-medium focus:border-pink-500/50 outline-none placeholder:text-slate-600" />
                  <button onClick={addTax} className="px-4 py-3 bg-pink-500 hover:bg-pink-400 text-white rounded-xl font-black transition-colors"><Plus size={18} /></button>
                </div>
             </div>

             <div className="space-y-3">
               {taxes.map(t => (
                 <div key={t.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-pink-500/10 text-pink-500 flex items-center justify-center shrink-0">
                      <Percent size={14} />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-300 text-xs md:text-sm">{t.name}</span>
                      <span className="text-[10px] text-slate-500 uppercase">{t.type === 'retention' ? 'Retenção' : 'Acréscimo'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">{t.rate}%</span>
                    <button onClick={() => deleteTax(t.id)} className="text-slate-600 hover:text-rose-500 transition-colors"><Trash size={14} /></button>
                  </div>
                 </div>
               ))}
               {taxes.length === 0 && <span className="text-xs text-slate-600">Nenhum imposto registrado</span>}
             </div>
          </div>
        </section>

        {/* SPLITS E COMISSÕES */}
        <section className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl flex flex-col h-full xl:col-span-2">
          <div className="flex items-center gap-3 md:gap-4 mb-6 border-b border-slate-800/50 pb-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-500/10 text-purple-500 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-black text-white uppercase tracking-tight">Splits e Comissões</h3>
              <p className="text-[10px] md:text-xs text-slate-500 font-medium">Rateio de receitas entre profissionais e clínicas</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-4">
                <input value={newSplitName} onChange={e=>setNewSplitName(e.target.value)} type="text" placeholder="Ex: Comissão Fisioterapia" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-medium focus:border-purple-500/50 outline-none placeholder:text-slate-600 text-white" />
                <div className="flex gap-2">
                  <input value={newSplitRecipient} onChange={e=>setNewSplitRecipient(e.target.value)} type="text" placeholder="Favorecido (Ex: Dr. João)" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-medium focus:border-purple-500/50 outline-none placeholder:text-slate-600 text-white" />
                  <input value={newSplitPercentage} onChange={e=>setNewSplitPercentage(e.target.value)} type="number" placeholder="%" className="w-[30%] bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-medium focus:border-purple-500/50 outline-none placeholder:text-slate-600 text-white" />
                </div>
                <div className="flex gap-2">
                  <input value={newSplitFixed} onChange={e=>setNewSplitFixed(e.target.value)} type="number" placeholder="Valor Fixo R$" className="w-[50%] bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-medium focus:border-purple-500/50 outline-none placeholder:text-slate-600 text-white" />
                  <select value={newSplitFeeRule} onChange={e=>setNewSplitFeeRule(e.target.value)} className="w-[50%] bg-slate-950 border border-slate-800 rounded-xl px-2 py-3 text-xs font-medium focus:border-purple-500/50 outline-none text-slate-300">
                    <option value="none">S/ Desconto Taxa</option>
                    <option value="before_split">Abater Tarifa Antes</option>
                  </select>
                </div>
                <button onClick={addSplit} className="px-4 py-3 bg-purple-500 hover:bg-purple-400 text-white rounded-xl font-black transition-colors w-full flex items-center justify-center gap-2"><Plus size={18} /> Adicionar Regra</button>
             </div>

             <div className="space-y-3">
               {splits.map(s => (
                 <div key={s.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/50">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-300 text-xs md:text-sm">{s.name}</span>
                    <span className="text-[10px] text-slate-500">Destino: {s.recipient_name}
                      {s.fee_discount_rule === 'before_split' ? ' • (Liq)' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">{s.percentage}% {s.fixed_value > 0 ? ` + R$${s.fixed_value}` : ''}</span>
                    <button onClick={() => deleteSplit(s.id)} className="text-slate-600 hover:text-rose-500 transition-colors"><Trash size={14} /></button>
                  </div>
                 </div>
               ))}
               {splits.length === 0 && <span className="text-xs text-slate-600">Nenhum split registrado</span>}
             </div>
          </div>
        </section>

        {/* CENTROS DE CUSTO */}
        <section className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl flex flex-col h-full xl:col-span-2">
          <div className="flex items-center gap-3 md:gap-4 mb-6 border-b border-slate-800/50 pb-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-500/10 text-amber-500 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0">
              <Folder className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-black text-white uppercase tracking-tight">Centros de Custo</h3>
              <p className="text-[10px] md:text-xs text-slate-500 font-medium">Divisão de despesas e receitas por projetos ou unidades</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
               <div className="flex flex-col gap-2">
                  <input value={newCostCenterName} onChange={e=>setNewCostCenterName(e.target.value)} type="text" placeholder="Nome do Centro de Custo" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-medium focus:border-amber-500/50 outline-none placeholder:text-slate-600" />
                  <div className="flex gap-2">
                    <input value={newCostCenterDesc} onChange={e=>setNewCostCenterDesc(e.target.value)} type="text" placeholder="Descrição (Opcional)" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-medium focus:border-amber-500/50 outline-none placeholder:text-slate-600" />
                    <button onClick={addCostCenter} className="px-4 py-3 bg-amber-500 hover:bg-amber-400 text-[#050B14] rounded-xl font-black transition-colors"><Plus size={18} /></button>
                  </div>
               </div>
            </div>

            <div className="space-y-3">
               {costCenters.map(cc => (
                 <div key={cc.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/50">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-300 text-xs md:text-sm">{cc.name}</span>
                    {cc.description && <span className="text-[10px] text-slate-500">{cc.description}</span>}
                  </div>
                  <button onClick={() => deleteCostCenter(cc.id)} className="text-slate-600 hover:text-rose-500 transition-colors"><Trash size={14} /></button>
                 </div>
               ))}
               {costCenters.length === 0 && <span className="text-xs text-slate-600">Nenhum centro de custo registrado</span>}
            </div>
          </div>
        </section>

        {/* EMISSÃO DE NF-e */}
        <section className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl flex flex-col h-full xl:col-span-2">
          <div className="flex items-center gap-3 md:gap-4 mb-6 border-b border-slate-800/50 pb-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-white/10 text-white rounded-xl md:rounded-2xl flex items-center justify-center shrink-0">
              <Receipt className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm md:text-base font-black text-white uppercase tracking-tight">Emissão de NF-e</h3>
              <p className="text-[10px] md:text-xs text-slate-500 font-medium">Integração com eNotas ou Focus NFe</p>
            </div>
            <button onClick={saveInvoiceSettings} className="px-4 py-2 bg-white hover:bg-slate-200 text-[#050B14] rounded-xl font-black uppercase tracking-widest text-[10px] md:text-xs transition-colors flex items-center gap-2">
              <Save size={14} /> Salvar NF-e
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
               <label className="flex items-center gap-3 p-4 bg-slate-950/50 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition-colors">
                 <input type="checkbox" checked={invoiceSettings.auto_emit || false} onChange={e=>setInvoiceSettings({...invoiceSettings, auto_emit: e.target.checked})} className="w-5 h-5 rounded border-slate-700 bg-slate-900 checked:bg-white focus:ring-0 focus:ring-offset-0 text-slate-900" />
                 <div className="flex-1">
                   <p className="text-sm font-bold text-white">Emissão Automática Habilitada</p>
                   <p className="text-[10px] text-slate-500">O sistema emitirá notas conforme a regra abaixo.</p>
                 </div>
               </label>
            
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="text-xs font-bold text-slate-500 mb-2 font-black uppercase tracking-widest block">CNPJ</label>
                   <input type="text" value={invoiceSettings.cnpj || ''} onChange={e=>setInvoiceSettings({...invoiceSettings, cnpj: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-medium text-white focus:border-white/50 outline-none" placeholder="00.000.000/0001-00" />
                 </div>
                 <div>
                   <label className="text-xs font-bold text-slate-500 mb-2 font-black uppercase tracking-widest block">Regime Trib.</label>
                   <select value={invoiceSettings.tax_regime || 'simples'} onChange={e=>setInvoiceSettings({...invoiceSettings, tax_regime: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-medium text-white focus:border-white/50 outline-none">
                      <option value="simples">Simples Nacional</option>
                      <option value="presumido">Lucro Presumido</option>
                      <option value="real">Lucro Real</option>
                   </select>
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-2 font-black uppercase tracking-widest block">Inscrição Mun.</label>
                    <input type="text" value={invoiceSettings.municipal_registration || ''} onChange={e=>setInvoiceSettings({...invoiceSettings, municipal_registration: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-medium text-white focus:border-white/50 outline-none" placeholder="Isento / Nº" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-2 font-black uppercase tracking-widest block">Momento</label>
                    <select value={invoiceSettings.emit_when || 'on_payment'} onChange={e=>setInvoiceSettings({...invoiceSettings, emit_when: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-medium text-white focus:border-white/50 outline-none">
                       <option value="on_payment">Após Pagamento</option>
                       <option value="on_issue">Na Geração (Boleto)</option>
                    </select>
                  </div>
               </div>
            </div>

            <div className="space-y-4">
               <div>
                  <label className="text-xs font-bold text-slate-500 mb-2 font-black uppercase tracking-widest block">Plataforma</label>
                  <select value={invoiceSettings.provider || 'manual'} onChange={e=>setInvoiceSettings({...invoiceSettings, provider: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-medium text-white focus:border-white/50 outline-none">
                     <option value="manual">Manual (Sem API)</option>
                     <option value="enotas">eNotas</option>
                     <option value="focus">Focus NFe</option>
                  </select>
               </div>
               
               <div>
                 <label className="text-xs font-bold text-slate-500 mb-2 font-black uppercase tracking-widest block">Chave de API (Token)</label>
                 <input type="password" value={invoiceSettings.api_key || ''} onChange={e=>setInvoiceSettings({...invoiceSettings, api_key: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-medium text-white focus:border-white/50 outline-none" placeholder="Token de Integração" />
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-2 font-black uppercase tracking-widest block">Código do Serviço</label>
                    <input type="text" value={invoiceSettings.service_code || ''} onChange={e=>setInvoiceSettings({...invoiceSettings, service_code: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-medium text-white focus:border-white/50 outline-none" placeholder="Ex: 04.03" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-2 font-black uppercase tracking-widest block">CNAE Padrão</label>
                    <input type="text" value={invoiceSettings.cnae || ''} onChange={e=>setInvoiceSettings({...invoiceSettings, cnae: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-medium text-white focus:border-white/50 outline-none" placeholder="00000-00" />
                  </div>
               </div>
            </div>
          </div>
        </section>

        {/* NOTIFICAÇÕES E ALERTAS */}
        <section className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl flex flex-col h-full xl:col-span-2">
          <div className="flex items-center gap-3 md:gap-4 mb-6 border-b border-slate-800/50 pb-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-sky-500/10 text-sky-500 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm md:text-base font-black text-white uppercase tracking-tight">Notificações e Réguas</h3>
              <p className="text-[10px] md:text-xs text-slate-500 font-medium">WhatsApp e E-mail Automáticos e Templates</p>
            </div>
            <button onClick={saveNotificationSettings} className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-xl font-black uppercase tracking-widest text-[10px] md:text-xs transition-colors flex items-center gap-2">
              <Save size={14} /> Salvar Alertas
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
               <label className="flex items-center gap-3 p-4 bg-slate-950/50 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition-colors">
                 <input type="checkbox" checked={notificationSettings.notify_client_on_issue ?? true} onChange={e=>setNotificationSettings({...notificationSettings, notify_client_on_issue: e.target.checked})} className="w-5 h-5 rounded border-slate-700 bg-slate-900 checked:bg-sky-500 focus:ring-0 focus:ring-offset-0 text-sky-500" />
                 <div className="flex-1">
                   <p className="text-sm font-bold text-white">Nova Fatura</p>
                   <p className="text-[10px] text-slate-500">Avisar cliente quando uma cobrança for gerada.</p>
                 </div>
               </label>

               <label className="flex items-center gap-3 p-4 bg-slate-950/50 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition-colors">
                 <input type="checkbox" checked={notificationSettings.notify_client_on_overdue ?? true} onChange={e=>setNotificationSettings({...notificationSettings, notify_client_on_overdue: e.target.checked})} className="w-5 h-5 rounded border-slate-700 bg-slate-900 checked:bg-sky-500 focus:ring-0 focus:ring-offset-0 text-sky-500" />
                 <div className="flex-1">
                   <p className="text-sm font-bold text-white">Atrasos & Inadimplência</p>
                   <p className="text-[10px] text-slate-500">Notificar o cliente se passar da data de vencimento.</p>
                 </div>
               </label>

              <div className="flex items-center justify-between p-4 bg-slate-950/50 border border-slate-800 rounded-xl">
                <div>
                   <p className="text-sm font-bold text-white">Lembrete Vencimento</p>
                   <p className="text-[10px] text-slate-500">Enviar aviso antes do vencimento</p>
                </div>
                <div className="flex items-center gap-2">
                   <input type="number" value={notificationSettings.notify_client_before_due || 0} onChange={e=>setNotificationSettings({...notificationSettings, notify_client_before_due: Number(e.target.value)})} className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-center font-bold text-white" />
                   <span className="text-xs text-slate-400">dias</span>
                </div>
              </div>
               
               <label className="flex items-center gap-3 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl cursor-pointer hover:border-emerald-500/30 transition-colors">
                 <input type="checkbox" checked={notificationSettings.notify_admin_on_payment ?? true} onChange={e=>setNotificationSettings({...notificationSettings, notify_admin_on_payment: e.target.checked})} className="w-5 h-5 rounded border-slate-700 bg-slate-900 checked:bg-emerald-500 focus:ring-0 focus:ring-offset-0 text-emerald-500" />
                 <div className="flex-1">
                   <p className="text-sm font-bold text-white">Notificar Administrador</p>
                   <p className="text-[10px] text-slate-500">Receber e-mail/notificação quando uma fatura for Paga.</p>
                 </div>
               </label>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 mb-2 font-black uppercase tracking-widest block">Mensagem de Lembrete</label>
                <textarea value={notificationSettings.template_reminder || ''} onChange={e=>setNotificationSettings({...notificationSettings, template_reminder: e.target.value})} rows={2} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-medium focus:border-sky-500/50 outline-none text-slate-300 resize-none" placeholder="Olá {nome}, sua fatura vence em {data}." />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 mb-2 font-black uppercase tracking-widest block">Mensagem de Atraso</label>
                <textarea value={notificationSettings.template_overdue || ''} onChange={e=>setNotificationSettings({...notificationSettings, template_overdue: e.target.value})} rows={2} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-medium focus:border-rose-500/50 outline-none text-slate-300 resize-none" placeholder="Aviso: o pagamento {fatura} encontra-se em atraso." />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 mb-2 font-black uppercase tracking-widest block">Mensagem de Recibo</label>
                <textarea value={notificationSettings.template_receipt || ''} onChange={e=>setNotificationSettings({...notificationSettings, template_receipt: e.target.value})} rows={2} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-medium focus:border-emerald-500/50 outline-none text-slate-300 resize-none" placeholder="Confirmamos o recebimento! Obrigado." />
              </div>
               <p className="text-[10px] text-slate-500 mt-2">Dica: Use variáveis como {'{nome}'}, {'{valor}'}, {'{vencimento}'}.</p>
            </div>
          </div>
        </section>

        {/* CONTAS BANCÁRIAS E CAIXAS */}
        <section className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl flex flex-col h-full">
          <div className="flex items-center gap-3 md:gap-4 mb-6 border-b border-slate-800/50 pb-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-500/10 text-emerald-500 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-black text-white uppercase tracking-tight">Contas & Caixas</h3>
              <p className="text-[10px] md:text-xs text-slate-500 font-medium">Bancos e Caixas Físicos</p>
            </div>
          </div>

          <div className="space-y-6 flex-1">
             <div className="flex flex-col gap-2">
                <input value={newWalletName} onChange={e=>setNewWalletName(e.target.value)} type="text" placeholder="Ex: Itaú PJ, Caixa Clínica" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-medium focus:border-emerald-500/50 outline-none placeholder:text-slate-600" />
                <div className="flex gap-2">
                  <select value={newWalletType} onChange={e=>setNewWalletType(e.target.value)} className="w-[45%] bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-medium focus:border-emerald-500/50 outline-none text-slate-300">
                    <option value="bank">Conta Bancária</option>
                    <option value="cash">Caixa Físico</option>
                    <option value="digital">Carteira Digital</option>
                  </select>
                  <input value={newWalletBalance} onChange={e=>setNewWalletBalance(e.target.value)} type="number" placeholder="Saldo Atual" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-medium focus:border-emerald-500/50 outline-none placeholder:text-slate-600" />
                  <button onClick={addWallet} className="px-4 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-black transition-colors"><Plus size={18} /></button>
                </div>
             </div>

             <div className="space-y-3">
               {wallets.map(w => (
                 <div key={w.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/50">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-300 text-xs md:text-sm">{w.name}</span>
                    <span className="text-[10px] text-slate-500 uppercase">{w.type === 'bank' ? 'Banco' : w.type === 'cash' ? 'Caixa' : 'Digital'}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-[10px] md:text-xs font-black text-slate-400">R$ {Number(w.initial_balance).toFixed(2)}</span>
                    <button onClick={() => deleteWallet(w.id)} className="text-slate-600 hover:text-rose-500 transition-colors"><Trash size={14} /></button>
                  </div>
                 </div>
               ))}
               {wallets.length === 0 && <span className="text-xs text-slate-600">Nenhuma conta cadastrada</span>}
             </div>
          </div>
        </section>

        {/* CONVÊNIOS E TABELAS DE PREÇOS */}
        <section className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl flex flex-col h-full xl:col-span-2">
          <div className="flex items-center gap-3 md:gap-4 mb-6 border-b border-slate-800/50 pb-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-rose-500/10 text-rose-500 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0">
              <HeartPulse className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-black text-white uppercase tracking-tight">Convênios e Parceiros</h3>
              <p className="text-[10px] md:text-xs text-slate-500 font-medium">Tabelas de Preços, TISS/TUSS e Coparticipação</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
               <div className="flex flex-col gap-3">
                  <input value={newInsuranceName} onChange={e=>setNewInsuranceName(e.target.value)} type="text" placeholder="Nome do Convênio (ex: Unimed)" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-medium focus:border-rose-500/50 outline-none text-white placeholder:text-slate-600" />
                  <div className="flex gap-3">
                    <input value={newInsuranceCode} onChange={e=>setNewInsuranceCode(e.target.value)} type="text" placeholder="Cód. ANS / Reg" className="w-[50%] bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-medium focus:border-rose-500/50 outline-none text-white placeholder:text-slate-600" />
                    <label className="flex items-center gap-2 p-3 w-[50%] bg-slate-950/50 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition-colors">
                      <input type="checkbox" checked={newInsuranceCopart} onChange={e=>setNewInsuranceCopart(e.target.checked)} className="w-4 h-4 rounded border-slate-700 bg-slate-900 checked:bg-rose-500" />
                      <span className="text-xs font-bold text-white">Coparticipação</span>
                    </label>
                  </div>
                  <button onClick={addInsurance} className="px-4 py-3 bg-rose-500 hover:bg-rose-400 text-white rounded-xl font-black w-full transition-colors flex justify-center items-center gap-2">
                    <Plus size={18} /> Adicionar Convênio
                  </button>
               </div>
            </div>

            <div className="space-y-3">
               {insurances.map(ins => (
                 <div key={ins.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/50 group">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-300 text-xs md:text-sm">{ins.name}</span>
                    <span className="text-[10px] text-slate-500">
                      {ins.registration_code ? `ANS: ${ins.registration_code} • ` : ''}
                      {ins.has_coparticipation ? 'Exige Coparticipação' : 'Sem Coparticipação'}
                    </span>
                  </div>
                  <button onClick={() => deleteInsurance(ins.id)} className="text-slate-600 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"><Trash size={14} /></button>
                 </div>
               ))}
               {insurances.length === 0 && <span className="text-xs text-slate-600">Nenhum convênio registrado.</span>}
            </div>
          </div>
        </section>

        {/* FORNECEDORES FEED */}
        <section className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl flex flex-col h-full">
          <div className="flex items-center gap-3 md:gap-4 mb-6 border-b border-slate-800/50 pb-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-500/10 text-orange-500 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-black text-white uppercase tracking-tight">Fornecedores</h3>
              <p className="text-[10px] md:text-xs text-slate-500 font-medium">Contatos recorrentes</p>
            </div>
          </div>

          <div className="space-y-6 flex-1">
             <div className="flex flex-col gap-2">
                <input value={newVendorName} onChange={e=>setNewVendorName(e.target.value)} type="text" placeholder="Ex: Enel, Fornecedor X" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-medium focus:border-orange-500/50 outline-none placeholder:text-slate-600" />
                <div className="flex gap-2">
                  <input value={newVendorDocument} onChange={e=>setNewVendorDocument(e.target.value)} type="text" placeholder="CNPJ/CPF (Opcional)" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-medium focus:border-orange-500/50 outline-none placeholder:text-slate-600" />
                  <select value={newVendorCategory} onChange={e=>setNewVendorCategory(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-3 text-sm font-medium focus:border-orange-500/50 outline-none text-slate-300">
                    <option value="">Categoria Padrão</option>
                    {categories.filter(c => c.type === 'expense').map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <button onClick={addVendor} className="px-4 py-3 bg-orange-500 hover:bg-orange-400 text-white rounded-xl font-black transition-colors"><Plus size={18} /></button>
                </div>
             </div>

             <div className="space-y-3">
               {vendors.map(v => (
                 <div key={v.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/50">
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-300 text-xs md:text-sm">{v.name}</span>
                    <span className="text-[10px] text-slate-500">{v.financial_categories?.name || 'Sem categoria base'} {v.document && `• ${v.document}`}</span>
                  </div>
                  <button onClick={() => deleteVendor(v.id)} className="text-slate-600 hover:text-rose-500 transition-colors"><Trash size={14} /></button>
                 </div>
               ))}
               {vendors.length === 0 && <span className="text-xs text-slate-600">Nenhum fornecedor registrado</span>}
             </div>
          </div>
        </section>

        {/* INTEGRAÇÕES DE PAGAMENTO */}
        <section className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl flex flex-col h-full xl:col-span-2">
          <div className="flex items-center gap-3 md:gap-4 mb-6 border-b border-slate-800/50 pb-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-600/10 text-blue-500 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0">
              <Key className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
               <h3 className="text-sm md:text-base font-black text-white uppercase tracking-tight">Gateways de Pagamento</h3>
               <p className="text-[10px] md:text-xs text-slate-500 font-medium">Chaves de API para emissão automática (Asaas, Stripe)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
               <div className="flex flex-col gap-2">
                  <select value={newGatewayProvider} onChange={e=>setNewGatewayProvider(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-medium focus:border-blue-500/50 outline-none text-slate-300">
                    <option value="asaas">Asaas</option>
                    <option value="stripe">Stripe</option>
                    <option value="mercadopago">Mercado Pago</option>
                  </select>
                  <div className="flex gap-2">
                    <input value={newGatewayKey} onChange={e=>setNewGatewayKey(e.target.value)} type="password" placeholder="Chave de API / Token" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-medium focus:border-blue-500/50 outline-none placeholder:text-slate-600" />
                    <button onClick={addGateway} className="px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black transition-colors"><Plus size={18} /></button>
                  </div>
               </div>
               <p className="text-[10px] md:text-xs text-slate-500">Ao configurar um Webhook na plataforma, todos os pagamentos serão baixados automaticamente no sistema e faturados.</p>
            </div>

            <div className="space-y-3">
               {gateways.map(g => (
                 <div key={g.id} className="flex items-center justify-between p-3 rounded-xl border border-blue-500/20 bg-blue-500/5">
                  <div className="flex flex-col">
                    <span className="font-black text-blue-400 uppercase tracking-widest text-xs md:text-sm">{g.provider_name}</span>
                    <span className="text-[10px] text-slate-400">Ativo para emissão automática</span>
                  </div>
                  <button onClick={() => deleteGateway(g.id)} className="text-slate-500 hover:text-rose-500 transition-colors"><Trash size={16} /></button>
                 </div>
               ))}
               {gateways.length === 0 && <span className="text-xs text-slate-600">Nenhuma integração adicionada</span>}
            </div>
          </div>
        </section>

        {/* CONCILIAÇÃO OFX E CAIXA DIÁRIO */}
        <section className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-2xl md:rounded-3xl flex flex-col h-full xl:col-span-2">
          <div className="flex items-center gap-3 md:gap-4 mb-6 border-b border-slate-800/50 pb-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-sky-500/10 text-sky-500 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0">
              <Calculator className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="flex-1">
               <h3 className="text-sm md:text-base font-black text-white uppercase tracking-tight">Operacional Financeiro</h3>
               <p className="text-[10px] md:text-xs text-slate-500 font-medium">Conciliação Bancária (OFX) e Controle de Caixa</p>
            </div>
            <button onClick={saveBillingRules} className="px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-white rounded-xl font-black uppercase tracking-widest text-[10px] md:text-xs flex items-center gap-2 transition-all">
              <Save size={16} /> Salvar Ops
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
               <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-500 flex items-center justify-center shrink-0">
                    <FileDown size={14} />
                  </div>
                  <h4 className="text-xs font-black text-white uppercase tracking-widest">Conciliação OFX</h4>
               </div>
               <p className="text-[10px] md:text-xs text-slate-400 leading-relaxed mb-4">
                 Ative a conciliação automática para cruzar o extrato bancário com os lançamentos no sistema e sugerir a baixa de faturas.
               </p>
               <label className="flex items-center gap-3 p-4 bg-slate-950/50 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition-colors">
                 <input type="checkbox" checked={billingRules?.auto_match_ofx || false} onChange={e=>setBillingRules({...billingRules, auto_match_ofx: e.target.checked})} className="w-5 h-5 rounded border-slate-700 bg-slate-900 checked:bg-sky-500 focus:ring-0 focus:ring-offset-0 text-sky-500" />
                 <div className="flex-1">
                   <p className="text-sm font-bold text-white">Ativar Auto-Match OFX</p>
                 </div>
               </label>
            </div>

            <div className="space-y-4">
               <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                    <ShieldAlert size={14} />
                  </div>
                  <h4 className="text-xs font-black text-white uppercase tracking-widest">Caixa Diário / Turno</h4>
               </div>
               <p className="text-[10px] md:text-xs text-slate-400 leading-relaxed mb-4">
                 Exija que os operadores abram e fechem o caixa diariamente na recepção, registrando suprimentos e sangrias (troco).
               </p>
               <label className="flex items-center gap-3 p-4 bg-slate-950/50 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition-colors">
                 <input type="checkbox" checked={billingRules?.require_daily_cash || false} onChange={e=>setBillingRules({...billingRules, require_daily_cash: e.target.checked})} className="w-5 h-5 rounded border-slate-700 bg-slate-900 checked:bg-emerald-500 focus:ring-0 focus:ring-offset-0 text-emerald-500" />
                 <div className="flex-1">
                   <p className="text-sm font-bold text-white">Travar Sistema Sem Caixa</p>
                   <p className="text-[10px] text-slate-500">Bloquear recebimentos se não houver caixa aberto no dia.</p>
                 </div>
               </label>
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
