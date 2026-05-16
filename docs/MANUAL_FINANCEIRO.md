# Manual de Configurações Financeiras

Este manual descreve todas as funcionalidades disponíveis na seção **Módulo Financeiro** dentro das Configurações do sistema.

---

## 1. Categorias (Plano de Contas)
**O que é:** Estrutura fundamental para classificar de onde o dinheiro vem (Receitas) e para onde ele vai (Despesas).
* **Como usar:** Defina as categorias e escolha o tipo (Receita ou Despesa). Ex: "Consultas" (Receita), "Conta de Luz" (Despesa).
* **Dica:** Um bom plano de contas evita criar categorias genéricas como "Outros".

## 2. Centros de Custo
**O que é:** Divisão de despesas e receitas por projetos, departamentos ou unidades de negócio. Funciona em paralelo às categorias.
* **Como usar:** Crie centros de custo como "Administrativo", "Recepção", "Fisioterapia". Quando lançar uma despesa, você poderá associar a este centro para ver qual área gasta mais ou dá mais lucro.

## 3. Contas & Caixas (Wallets)
**O que é:** Gestão individualizada de saldos de contas bancárias, caixas físicos ou carteiras digitais.
* **Como usar:** 
  * Crie seu caixa físico ("Gaveta da Recepção")
  * Adicione contas bancárias ("Itaú PJ", "Nubank")
  * Informe o saldo inicial. Transações futuras afetarão o saldo dessas contas individualmente, facilitando a conciliação.

## 4. Fornecedores (Vendors)
**O que é:** Cadastro rápido de fornecedores recorrentes para agilizar os lançamentos no Contas a Pagar.
* **Como usar:** Cadastre fornecedores frequentes (ex: Enel, Vivo, Fornecedor de Equipamentos) e você pode deixar uma categoria padrão vinculada a eles (ex: Conta de Telefone para a Vivo).

## 5. Convênios e Parceiros (Health Insurances)
**O que é:** Cadastro de planos de saúde ou tabelas de preços de parceiros, associando controle de coparticipação.
* **Como usar:** Adicione os convênios que sua clínica atende (ex: Unimed, SulAmérica). Assinale se este convênio exige "Coparticipação" do paciente, o que ajudará posteriormente na estruturação do repasse (Guias TISS/TUSS e glosas).

## 6. Gateways de Pagamento (Integrações)
**O que é:** Chaves de API para emissão automática de boletos, PIX ou links de cartão via integradores como Asaas, Stripe e Mercado Pago.
* **Como usar:** Selecione a plataforma, insira o Token de Integração (API Key). Isso ativará emissões e baixas automáticas de faturas com o auxílio de Webhooks vindos do respectivo Gateway.

## 7. Emissão de NF-e (Notas Fiscais Eletrônicas)
**O que é:** Integração via parceiros (como eNotas ou Focus NFe) para gerar Notas Fiscais de Serviço.
* **Como usar:** 
  * Configure CNPJ, Regime Tributário e Inscrição Municipal.
  * Habilite a "Emissão Automática Habilitada" e escolha o momento (ex: "Após Pagamento" ou "Na Geração").
  * Selecione a Plataforma (eNotas/Focus) e cole o Token de API caso não faça a emissão manual.

## 8. Notificações e Réguas de Cobrança
**O que é:** Controle de alertas via e-mail ou WhatsApp para os pacientes e administradores.
* **Como usar:** 
  * **Eventos:** Ative disparos para nova fatura, atraso e lembrete antes do vencimento.
  * **Templates:** Escreva as mensagens customizadas para Lembretes, Atrasos e Recibos utilizando as chaves: `{nome}`, `{valor}`, `{vencimento}`. O sistema fará a tradução na hora de enviar.

## 9. Splits e Comissões (Rateios)
**O que é:** Sistema de divisão automatizada de receitas entre os profissionais parceiros e a sua clínica.
* **Como usar:**
  * Nomeie a regra e o favorecido (Ex: "Comissão Dr. Carlos").
  * Defina o **%** ou **Valor Fixo (R$)**.
  * Regras avançadas: escolha se a regra deve "Abater Tarifa Antes" (descontar a taxa da maquininha do valor total antes de calcular a comissão).

## 10. Operacional Financeiro (Conciliação e Caixa)
**O que é:** Conjunto de travas operacionais para o time do financeiro.
* **Como usar:**
  * **Conciliação OFX (Auto-Match):** Caso ativado, o sistema sugere baixas sozinho ao ler o extrato bancário.
  * **Travar Sistema Sem Caixa (Diário/Turno):** Força os operadores e recepcionistas a terem um Caixa Aberto formalmente no dia. Se não estiver aberto, o sistema não deixa dar baixa em pagamentos na recepção.

## 11. Cobrança e Inadimplência
**O que é:** Definição das condições padrão para clientes que atrasarem o pagamento.
* **Como usar:**
  * Defina Juros Mensais (%) e Multa por Atraso (%).
  * **Bloqueio de Inadimplentes:** Se ativado, pacientes que atingirem a regra de bloqueio (ex: faturas com 5 dias de atraso) ficam impedidos de realizar novos agendamentos até quitarem o débito.

## 12. Fechamento Mensal
**O que é:** Trancamento histórico consolidado.
* **Como usar:** Ao finalizar o mês corrente, todas as transações daquele mês ficam registradas como "imutáveis". Isso impede que um colaborador altere uma transação passada que retroativamente mudaria o balanço do DRE (Demonstrativo de Resultados).
