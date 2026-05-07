-- Metas / Vaquinhas
CREATE TABLE IF NOT EXISTS public.financial_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    target_amount DECIMAL(12, 2) NOT NULL,
    current_amount DECIMAL(12, 2) DEFAULT 0,
    deadline DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.financial_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir tudo para todos_goals" ON public.financial_goals FOR ALL USING (true);

-- Fechamento de Mensal / Balanço Consolidado
CREATE TABLE IF NOT EXISTS public.financial_closures (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    month VARCHAR(7) NOT NULL UNIQUE, -- Ex: 2023-08
    closed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    final_balance DECIMAL(12, 2) NOT NULL
);

ALTER TABLE public.financial_closures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir tudo para todos_closures" ON public.financial_closures FOR ALL USING (true);

-- Categorias Customizadas
CREATE TABLE IF NOT EXISTS public.financial_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.financial_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir tudo para todos_categories" ON public.financial_categories FOR ALL USING (true);

-- Adicionar seed para categorias default
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
