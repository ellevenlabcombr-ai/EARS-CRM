-- 1. Verifique se a tabela já existe e adicione as colunas caso você não tenha excluído ela
ALTER TABLE public.financial_transactions ADD COLUMN IF NOT EXISTS account VARCHAR(50);
ALTER TABLE public.financial_transactions ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;
ALTER TABLE public.financial_transactions ADD COLUMN IF NOT EXISTS receipt_filename TEXT;

ALTER TABLE public.financial_transactions ALTER COLUMN description DROP NOT NULL;

-- 2. Atualizar as Permissões (RLS) para garantir que você consegue salvar agora (mesmo que não esteja logado, isso facilita no ambiente de testes)
DROP POLICY IF EXISTS "Permitir leitura de transações para usuários autenticados" ON public.financial_transactions;
DROP POLICY IF EXISTS "Permitir inserção de transações para usuários autenticados" ON public.financial_transactions;
DROP POLICY IF EXISTS "Permitir edição de transações para usuários autenticados" ON public.financial_transactions;
DROP POLICY IF EXISTS "Permitir exclusão de transações para usuários autenticados" ON public.financial_transactions;

-- Cria novas políticas que permitem TODA operação (leitura/escrita) para poder testar. (Para produção, você troca "true" por auth.uid() = ...)

CREATE POLICY "Permitir tudo para todos em transações" 
    ON public.financial_transactions 
    FOR ALL 
    USING (true) 
    WITH CHECK (true);

-- 3. Habilita RLS na tabela de Atletas caso queriam ler (pra aparecer o dropdown)
ALTER TABLE public.athletes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir leitura de atletas" ON public.athletes;
CREATE POLICY "Permitir leitura de atletas" ON public.athletes FOR ALL USING (true);
