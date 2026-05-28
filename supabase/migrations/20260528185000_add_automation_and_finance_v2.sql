-- ============================================================================
-- AUTO-GENERATED MIGRATION: Finance, Automation & WhatsApp Settings
-- ============================================================================

-- 1. WhatsApp Messages Tracking
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    athlete_id UUID REFERENCES public.athletes(id) ON DELETE SET NULL,
    phone_number VARCHAR(50),
    direction VARCHAR(20) NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    text TEXT,
    status VARCHAR(20) DEFAULT 'delivered',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir tudo para whatsapp_messages" ON public.whatsapp_messages;
CREATE POLICY "Permitir tudo para whatsapp_messages" ON public.whatsapp_messages FOR ALL USING (true);


-- 2. Automation Settings
CREATE TABLE IF NOT EXISTS public.automation_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    whatsapp_reminder_enabled BOOLEAN DEFAULT true,
    whatsapp_reminder_template TEXT,
    whatsapp_followup_enabled BOOLEAN DEFAULT false,
    whatsapp_followup_template TEXT,
    email_reminder_enabled BOOLEAN DEFAULT false,
    email_reminder_template TEXT,
    reminder_hours_before INTEGER DEFAULT 24,
    followup_hours_after INTEGER DEFAULT 24,
    whatsapp_provider VARCHAR(50) DEFAULT 'evolution',
    evolution_api_url TEXT,
    evolution_api_key TEXT,
    evolution_instance_id TEXT,
    evolution_qr_base64 TEXT,
    resend_api_key TEXT,
    whatsapp_reminder_timing TEXT[] DEFAULT ARRAY['24h'],
    whatsapp_followup_timing TEXT[] DEFAULT ARRAY['24h'],
    whatsapp_birthday_enabled BOOLEAN DEFAULT false,
    whatsapp_birthday_template TEXT,
    whatsapp_absence_enabled BOOLEAN DEFAULT false,
    whatsapp_absence_template TEXT,
    finance_reminder_enabled BOOLEAN DEFAULT false,
    finance_reminder_template TEXT,
    finance_receipt_enabled BOOLEAN DEFAULT false,
    finance_receipt_template TEXT,
    prof_morning_resume_enabled BOOLEAN DEFAULT true,
    prof_morning_resume_time VARCHAR(10) DEFAULT '08:00',
    prof_new_appointment_enabled BOOLEAN DEFAULT false,
    prep_instructions_enabled BOOLEAN DEFAULT false,
    prep_instructions_template TEXT,
    email_enabled BOOLEAN DEFAULT true,
    whatsapp_enabled BOOLEAN DEFAULT true,
    whatsapp_auto_ears BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- In case table existed but missed the QR col
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'automation_settings' AND column_name = 'evolution_qr_base64') THEN
        ALTER TABLE public.automation_settings ADD COLUMN evolution_qr_base64 TEXT;
    END IF;
END $$;

ALTER TABLE public.automation_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir tudo para automation_settings" ON public.automation_settings;
CREATE POLICY "Permitir tudo para automation_settings" ON public.automation_settings FOR ALL USING (true);


-- 3. Financial Transactions & Subscriptions (Fixing schemas)
CREATE TABLE IF NOT EXISTS public.financial_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    category VARCHAR(100),
    amount DECIMAL(12, 2) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('paid', 'pending', 'cancelled')),
    account VARCHAR(50),
    athlete_id UUID REFERENCES public.athletes(id) ON DELETE SET NULL,
    is_recurring BOOLEAN DEFAULT FALSE,
    asaas_payment_id TEXT,
    asaas_invoice_url TEXT,
    receipt_filename TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir tudo para financial_transactions" ON public.financial_transactions;
CREATE POLICY "Permitir tudo para financial_transactions" ON public.financial_transactions FOR ALL USING (true);

-- Ensure all new columns exist in case table was already there
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'financial_transactions' AND column_name = 'account') THEN
        ALTER TABLE public.financial_transactions ADD COLUMN account VARCHAR(50);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'financial_transactions' AND column_name = 'is_recurring') THEN
        ALTER TABLE public.financial_transactions ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'financial_transactions' AND column_name = 'asaas_payment_id') THEN
        ALTER TABLE public.financial_transactions ADD COLUMN asaas_payment_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'financial_transactions' AND column_name = 'asaas_invoice_url') THEN
        ALTER TABLE public.financial_transactions ADD COLUMN asaas_invoice_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'financial_transactions' AND column_name = 'receipt_filename') THEN
        ALTER TABLE public.financial_transactions ADD COLUMN receipt_filename TEXT;
    END IF;
    
    ALTER TABLE public.financial_transactions ALTER COLUMN description DROP NOT NULL;
END $$;


CREATE TABLE IF NOT EXISTS public.financial_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    athlete_id UUID REFERENCES public.athletes(id) ON DELETE CASCADE,
    asaas_subscription_id TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.financial_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir tudo para financial_subscriptions" ON public.financial_subscriptions;
CREATE POLICY "Permitir tudo para financial_subscriptions" ON public.financial_subscriptions FOR ALL USING (true);


-- 4. Financial Goals, Closures, Categories
CREATE TABLE IF NOT EXISTS public.financial_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    target_amount DECIMAL(12, 2) NOT NULL,
    current_amount DECIMAL(12, 2) DEFAULT 0,
    deadline DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir tudo para financial_goals" ON public.financial_goals;
CREATE POLICY "Permitir tudo para financial_goals" ON public.financial_goals FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS public.financial_closures (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    month VARCHAR(7) NOT NULL UNIQUE,
    closed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    final_balance DECIMAL(12, 2) NOT NULL
);
ALTER TABLE public.financial_closures ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir tudo para financial_closures" ON public.financial_closures;
CREATE POLICY "Permitir tudo para financial_closures" ON public.financial_closures FOR ALL USING (true);

CREATE TABLE IF NOT EXISTS public.financial_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.financial_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir tudo para financial_categories" ON public.financial_categories;
CREATE POLICY "Permitir tudo para financial_categories" ON public.financial_categories FOR ALL USING (true);

-- Seed Categories
INSERT INTO public.financial_categories (name, type, is_default) VALUES
  ('APV - Águias', 'income', true),
  ('Avaliação', 'income', true),
  ('Consulta', 'income', true),
  ('H10', 'income', true),
  ('Kit', 'income', true),
  ('Mensalidade', 'income', true),
  ('Óleo de magnésio', 'income', true),
  ('Óleos essenciais', 'income', true),
  ('Outros (Receita)', 'income', true),
  ('Patrocínio', 'income', true),
  ('APV - Águias', 'expense', true),
  ('Equipamentos', 'expense', true),
  ('Infraestrutura', 'expense', true),
  ('Outros (Despesa)', 'expense', true),
  ('Salário / Pagamentos', 'expense', true),
  ('Taxas Bancárias', 'expense', true),
  ('Viagem / Torneio', 'expense', true)
ON CONFLICT DO NOTHING;


-- 1. QUEM ME DEVE? (Inadimplência)
-- Retorna os atletas ativos que NÃO possuem uma transação de 'Mensalidade' paga no mês atual.
DROP VIEW IF EXISTS view_inadimplentes_mes;
CREATE OR REPLACE VIEW view_inadimplentes_mes AS
SELECT a.id, a.name, a.phone FROM 
    public.athletes a
WHERE 
    a.id NOT IN (
        SELECT athlete_id 
        FROM public.financial_transactions 
        WHERE type = 'income' 
          AND category = 'Mensalidade' 
          AND status = 'paid'
          AND athlete_id IS NOT NULL
          AND EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM CURRENT_DATE)
          AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)
    );

-- 2. QUAL PACOTE VENCE? (Vencimentos próximos)
-- Para isso, assumimos que a tabela athletes possui os campos `plan_name` e `plan_expires_at`.
-- Caso não possua, você pode rodar esse ALTER TABLE:
-- ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS plan_name VARCHAR(100);
-- ALTER TABLE public.athletes ADD COLUMN IF NOT EXISTS plan_expires_at DATE;
DROP VIEW IF EXISTS view_vencimentos_proximos;
CREATE OR REPLACE VIEW view_vencimentos_proximos AS
SELECT name, plan_name, plan_expires_at FROM 
    public.athletes 
WHERE 
    plan_expires_at >= CURRENT_DATE 
    AND plan_expires_at <= CURRENT_DATE + INTERVAL '15 days'
ORDER BY 
    plan_expires_at ASC;

-- 3. TICKET MÉDIO? 
-- Média de valor gasto por transação de receita (ou por atleta por mês)
-- Criando uma View para facilitar o agrupamento mensal
DROP VIEW IF EXISTS view_ticket_medio;
CREATE OR REPLACE VIEW view_ticket_medio AS
SELECT 
    EXTRACT(MONTH FROM date) AS mes,
    EXTRACT(YEAR FROM date) AS ano,
    AVG(amount) AS ticket_medio_geral,
    COUNT(DISTINCT athlete_id) as clientes_pagantes,
    SUM(amount) / NULLIF(COUNT(DISTINCT athlete_id), 0) AS ticket_medio_por_cliente
FROM 
    public.financial_transactions
WHERE 
    type = 'income' AND status = 'paid'
GROUP BY 
    EXTRACT(MONTH FROM date), EXTRACT(YEAR FROM date)
ORDER BY 
    ano DESC, mes DESC;

-- 4. QUAL SERVIÇO VENDE MAIS?
-- Agrupa as categorias de receita pela quantidade de vezes vendidas e o valor total
DROP VIEW IF EXISTS view_servicos_mais_vendidos;
CREATE OR REPLACE VIEW view_servicos_mais_vendidos AS
SELECT 
    category AS servico_produto,
    COUNT(*) AS quantidade_vendas,
    SUM(amount) AS valor_total_arrecadado
FROM 
    public.financial_transactions
WHERE 
    type = 'income' AND status = 'paid'
GROUP BY 
    category
ORDER BY 
    quantidade_vendas DESC, valor_total_arrecadado DESC;

-- 5. RECEITA PREVISTA DO MÊS?
-- Soma todas as transações de entrada do mês atual, independentemente se já foram pagas ou estão pendentes.
DROP VIEW IF EXISTS view_receita_prevista_mes;
CREATE OR REPLACE VIEW view_receita_prevista_mes AS
SELECT 
    EXTRACT(MONTH FROM date) AS mes,
    EXTRACT(YEAR FROM date) AS ano,
    SUM(amount) AS receita_total_prevista,
    SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) AS receita_realizada,
    SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS receita_a_receber
FROM 
    public.financial_transactions
WHERE 
    type = 'income'
GROUP BY 
    EXTRACT(MONTH FROM date), EXTRACT(YEAR FROM date)
ORDER BY 
    ano DESC, mes DESC;

-- 6. DRE GERENCIAL DO MÊS (Demonstrativo de Resultado do Exercício)
-- Diferencia receita, impostos (taxas), custos diretos (variáveis) e despesas fixas.
DROP VIEW IF EXISTS view_dre_gerencial_mes_atual;
CREATE OR REPLACE VIEW view_dre_gerencial_mes_atual AS
WITH dre_base AS (
    SELECT 
        amount,
        CASE 
            WHEN type = 'income' THEN 'RECEITA BRUTA'
            WHEN type = 'expense' AND (category ILIKE '%imposto%' OR category ILIKE '%taxa%') THEN 'DEDUCOES E IMPOSTOS'
            WHEN type = 'expense' AND (category ILIKE '%equipamento%' OR category ILIKE '%kit%') THEN 'CUSTO VARIAVEL'
            ELSE 'CUSTO FIXO' 
        END as dre_category
    FROM public.financial_transactions
    WHERE status = 'paid' 
      AND EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM CURRENT_DATE)
      AND EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE)
)
SELECT 
    dre_category,
    SUM(amount) as total
FROM dre_base
GROUP BY dre_category
ORDER BY 
    CASE dre_category 
        WHEN 'RECEITA BRUTA' THEN 1 
        WHEN 'DEDUCOES E IMPOSTOS' THEN 2 
        WHEN 'CUSTO VARIAVEL' THEN 3 
        ELSE 4 
    END;

-- 7. CAIXA PROJETADO (PRÓXIMOS 30 DIAS)
-- Pega o saldo atual e projeta o que tem para receber e o que tem para pagar.
DROP VIEW IF EXISTS view_fluxo_caixa_projetado;
CREATE OR REPLACE VIEW view_fluxo_caixa_projetado AS
SELECT 
    '1. Caixa Atual (Realizado)' as descricao,
    SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END) as valor
FROM public.financial_transactions
WHERE status = 'paid'
UNION ALL
SELECT 
    '2. A Receber (Próximos 30 dias)' as descricao,
    SUM(amount) as valor
FROM public.financial_transactions
WHERE status = 'pending' AND type = 'income' AND date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
UNION ALL
SELECT 
    '3. A Pagar (Próximos 30 dias)' as descricao,
    -SUM(amount) as valor
FROM public.financial_transactions
WHERE status = 'pending' AND type = 'expense' AND date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days';

-- 8. RELATÓRIO DE CHURN (EVASÃO)
-- Alunos que pagaram no passado mas não pagaram nos últimos 2 meses.
DROP VIEW IF EXISTS view_relatorio_churn;
CREATE OR REPLACE VIEW view_relatorio_churn AS
SELECT a.id, a.name, MAX(t.date) as ultimo_pagamento FROM public.athletes a
JOIN public.financial_transactions t ON t.athlete_id = a.id
WHERE t.type = 'income' AND t.status = 'paid' AND t.category = 'Mensalidade'
GROUP BY a.id, a.name
HAVING MAX(t.date) < CURRENT_DATE - INTERVAL '60 days';

-- 9. COMISSIONAMENTO DE PROFISSIONAIS
-- Se os alunos/procedimentos estiverem atrelados a um profissional X (assumindo coluna rep_id ou puxando de consultas passadas)
-- Exemplo agregando repasses caso uma tag/descrição contenha "Dr. Carlos"
DROP VIEW IF EXISTS view_comissionamento;
CREATE OR REPLACE VIEW view_comissionamento AS
SELECT category, COUNT(*) as qtd_procedimentos, SUM(amount) * 0.40 as comissao_40_percent -- Exemplo fixa 40% de comissão
FROM public.financial_transactions
WHERE type = 'income' AND status = 'paid' 
      AND EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM CURRENT_DATE)
GROUP BY category;

