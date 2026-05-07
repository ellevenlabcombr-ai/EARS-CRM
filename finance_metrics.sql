-- 1. QUEM ME DEVE? (Inadimplência)
-- Retorna os atletas ativos que NÃO possuem uma transação de 'Mensalidade' paga no mês atual.
SELECT 
    a.id, 
    a.name, 
    a.phone 
FROM 
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
SELECT 
    name, 
    plan_name, 
    plan_expires_at 
FROM 
    public.athletes 
WHERE 
    plan_expires_at >= CURRENT_DATE 
    AND plan_expires_at <= CURRENT_DATE + INTERVAL '15 days'
ORDER BY 
    plan_expires_at ASC;

-- 3. TICKET MÉDIO? 
-- Média de valor gasto por transação de receita (ou por atleta por mês)
-- Criando uma View para facilitar o agrupamento mensal
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
SELECT 
    a.id,
    a.name,
    MAX(t.date) as ultimo_pagamento
FROM public.athletes a
JOIN public.financial_transactions t ON t.athlete_id = a.id
WHERE t.type = 'income' AND t.status = 'paid' AND t.category = 'Mensalidade'
GROUP BY a.id, a.name
HAVING MAX(t.date) < CURRENT_DATE - INTERVAL '60 days';

-- 9. COMISSIONAMENTO DE PROFISSIONAIS
-- Se os alunos/procedimentos estiverem atrelados a um profissional X (assumindo coluna rep_id ou puxando de consultas passadas)
-- Exemplo agregando repasses caso uma tag/descrição contenha "Dr. Carlos"
SELECT 
    category,
    COUNT(*) as qtd_procedimentos,
    SUM(amount) * 0.40 as comissao_40_percent -- Exemplo fixa 40% de comissão
FROM public.financial_transactions
WHERE type = 'income' AND status = 'paid' 
      AND EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM CURRENT_DATE)
GROUP BY category;

