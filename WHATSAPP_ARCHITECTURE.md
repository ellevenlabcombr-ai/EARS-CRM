# WhatsApp System Architecture 🚀

> 💡 **Nota sobre Hospedagem 100% Gratuita (Render + Neon Postgres):**
> Devido aos contínuos problemas de roteamento (IPv4/IPv6, Prisma `P1001` e erros de `tenant/user not found` no pooling do Supabase) que ocorrem ao conectar aplicações do **Render** ao **Supabase**, estamos migrando a infraestrutura de banco de dados da Evolution API para o **Neon (neon.tech)**.
> O Neon é um banco de dados PostgreSQL serverless **100% gratuito** que nasceu focado em resolver problemas modernos (funciona com IPv4 nativamente sem bugs de pgbouncer no Prisma). Nossa aplicação (Next.js) pode continuar conectando onde quiser, mas a Evolution API rodará perfeitamente usando Neon.

Arquitetura limpa e mínima para integração de WhatsApp usando **Evolution API**, hospedada no **Render**, utilizando o banco de dados **Neon (PostgreSQL)** para contornar problemas de IPv4/IPv6 no Render.

## 1. Visão Geral do Fluxo

A comunicação acontece num modelo passivo/ativo utilizando Webhooks:

```
[ WhatsApp ] <==> [ Evolution API (Render) ] <==> [ Neon Postgres ] ==> [ Webhook (Next.js) ]
```

1. **Evolution API**: Servidor dedicado rodando no [Render](https://render.com). Não exige banco de dados local para persistência de chats se usarmos webhooks, ele é *stateless* e funciona como um proxy para o WhatsApp.
2. **Next.js API**: Onde fica nossa lógica de negócio, exposta via `/api/webhooks/evolution` e `/api/whatsapp/*`.
3. **Supabase/Neon**: Toda a persistência principal da aplicação fica onde você preferir (Next.js acessa o Supabase), enquanto as tabelas puras da Evolution API rodam izoladas no Neon.

## 2. Requisitos de Banco Centralizado (PostgreSQL / Neon)

Não utilizamos MongoDB para a Evolution API. Todos os chats são persistidos relacionalmente no PostgreSQL.

### Estrutura de Tabelas SQL 

Toda a interação de Webhook grava as mensagens em nosso próprio Supabase:

```sql
CREATE TABLE IF NOT EXISTS whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id UUID REFERENCES athletes(id) ON DELETE SET NULL,
    phone_number TEXT NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    text TEXT,
    media_url TEXT,
    media_type TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

As credenciais do serviço estão na tabela unificada já existente:
`automation_settings` (evolution_api_url, evolution_api_key, evolution_instance_id).

## 3. Estrutura de Pastas e Rotas (Backend Next.js)

Uma estrutura completamente previsível, sem ORMs duplicados:

```
app/
 └─ api/
    ├─ webhooks/
    │   └─ evolution/         
    │       └─ route.ts       # Recebe os dados brutos da Evolution API e salva no PostgreSQL
    └─ whatsapp/
        ├─ connect/
        │   └─ route.ts       # Controla criação de instância e exibição do QR Code
        ├─ send/
        │   └─ route.ts       # Emite comando de disparo ativo via HTTP para a Evolution API
        └─ status/
            └─ route.ts       # Consulta proativa do status da API
```

## 4. Variáveis de Ambiente (.env)

Evite configurações complexas. Estas são as variáveis essenciais para gerenciar a instância na aplicação Next.js:

```env
# Conexão principal com Banco de Dados via API REST
NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJh..."
SUPABASE_SERVICE_ROLE_KEY="eyJh..."

# (Opcional) Chave de AI para Auto-Responders
NEXT_PUBLIC_GEMINI_API_KEY="AI..."

# Chaves estáticas de comunicação se não estiverem persistidas no Supabase
# EVOLUTION_API_URL="https://sua-evolution-api.onrender.com"
# EVOLUTION_API_KEY="chave-de-seguranca"
# EVOLUTION_INSTANCE_ID="ears-whatsapp"
```

## 5. Deploy da Evolution API no Render com Neon (100% Grátis)

### Passo a Passo (Banco no Neon):
1. Acesse [Neon.tech](https://neon.tech/) e crie uma conta gratuita (Sign up with GitHub/Google).
2. Clique em **New Project** (escolha AWS - US East) e defina a versão do Postgres como 16.
3. Após criar, na tela de "Connection Details", copie a **Connection String** da aba Prisma ou Postgres.
   - O link vai ser algo perfeitamente limpo assim: `postgresql://neondb_owner:SENHA@ep-xxx-yyy.us-east-2.aws.neon.tech/neondb?sslmode=require`

### Passo a Passo (Render "Web Service"):
1. Volte ao [Render Dashboard](https://dashboard.render.com).
2. Crie um novo Web Service -> **Public Git Repository** ou **Deploy an existing image from a registry**.
   - Digite no campo Image URL: `atendai/evolution-api:latest`.
3. Em **Environment variables**, adicione EXATAMENTE estes valores:

   - Key: `AUTHENTICATION_TYPE` | Value: `apikey`
   - Key: `AUTHENTICATION_API_KEY` | Value: `SuaSenhaForteAqui123!`
   - Key: `PROVIDER` | Value: `baileys`
   - Key: `DATABASE_ENABLED` | Value: `true`
   - Key: `DATABASE_PROVIDER` | Value: `postgresql`
   
   👉 **Cole o link gerado pelo Neon nas variáveis abaixo:**
   - Key: `DATABASE_CONNECTION_URI` | Value: `postgresql://neondb_owner:[SENHA]@ep-...neon.tech/neondb?sslmode=require`
   - Key: `DATABASE_URL` | Value: `postgresql://neondb_owner:[SENHA]@ep-...neon.tech/neondb?sslmode=require`

   - Key: `DATABASE_SAVE_DATA` | Value: `false`
   - Key: `WEBHOOK_GLOBAL_ENABLED` | Value: `false`
   - Key: `REDIS_ENABLED` | Value: `false`

4. Desça até o final e inicie o deploy! Sua API subirá sem **nenhum** erro do Prisma ou "Database Server Not Found", ficando pronta para gerar os QR Codes via API.

### Configuração do Webhook Dinâmico

A URL final do Render deve ser enviada *dinamicamente* pela rota de conexão e salva no seu banco usando o script de **SetWebhook** apontando para o seu APP Hospedado.

Ao apertar para gerar QRCode (em `/api/whatsapp/connect/route.ts`), ele envia as credenciais:
```json
{
  "webhook": {
     "enabled": true,
     "url": "https://meu-app.onrender.com/api/webhooks/evolution",
     "byEvents": false,
     "base64": true,
     "events": ["MESSAGES_UPSERT", "MESSAGES_UPDATE", "SEND_MESSAGE"]
  }
}
```

Isso garante uma arquitetura simples (SSOT), mantendo um único ponto de verdade no banco Supabase PostgreSQl, garantindo que todo o sistema, das lógicas complexas até a visualização, utilize uma camada robusta baseada apenas em eventos HTTP limpos.
