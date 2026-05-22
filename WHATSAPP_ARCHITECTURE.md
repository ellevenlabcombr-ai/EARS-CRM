# WhatsApp System Architecture 🚀

> 💡 **Nota sobre Hospedagem 100% Gratuita (Render + Supabase):**
> O Koyeb e o Railway começaram a exigir cartão de crédito recentemente para novas contas (visando bloquear uso abusivo das plataformas). Como o objetivo é manter uma infraestrutura **100% gratuita**, voltamos à estratégia original no **Render**.
> O erro `P1001` e `tenant/user not found` que tivemos anteriormente foi 100% causado por um detalhe de sintaxe/roteamento da URL IPv4 do Prisma no pooling do Supabase, que agora está corrigido.

Arquitetura limpa e mínima para integração de WhatsApp usando **Evolution API**, hospedada no **Render**, utilizando exclusivamente o banco de dados **Supabase (PostgreSQL)**, sem Prisma e sem MongoDB na nuvem.

## 1. Visão Geral do Fluxo

A comunicação acontece num modelo passivo/ativo utilizando Webhooks:

```
[ WhatsApp ] <==> [ Evolution API (Render) ] ==> [ Webhook (Next.js) ] ==> [ Supabase PG ]
```

1. **Evolution API**: Servidor dedicado rodando no [Render](https://render.com). Não exige banco de dados local para persistência de chats se usarmos webhooks, ele é *stateless* e funciona como um proxy para o WhatsApp.
2. **Next.js API**: Onde fica nossa lógica de negócio, exposta via `/api/webhooks/evolution` e `/api/whatsapp/*`.
3. **Supabase**: Toda persistência (Mensagens, Configurações de Automação e Sessões) usa o banco de dados principal PG via `@supabase/supabase-js`.

## 2. Requisitos de Banco Centralizado (PostgreSQL / Supabase)

Não utilizamos MongoDB para a Evolution API. Todos os chats são persistidos relacionalmente no Supabase por meio do nosso próprio Webhook.

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

## 5. Deploy da Evolution API no Render (100% Grátis)

### Passo a Passo (Render "Web Service"):
1. Volte ao [Render Dashboard](https://dashboard.render.com).
2. Crie um novo Web Service -> **Public Git Repository** ou cole a imagem do Docker (usaremos a imagem: `atendai/evolution-api:latest`).
3. Em **Environment variables**, adicione EXATAMENTE estes valores (copie e cole, **NÃO USE ASPAS** em volta de nada):

   - Key: `AUTHENTICATION_TYPE` | Value: `apikey`
   - Key: `AUTHENTICATION_API_KEY` | Value: `SuaSenhaForteAqui123!`
   - Key: `PROVIDER` | Value: `baileys`
   - Key: `DATABASE_ENABLED` | Value: `true`
   - Key: `DATABASE_PROVIDER` | Value: `postgresql`
   
   👉 **Copie inteira a URL abaixo para as DUAS variáveis** (Ela já contém a formatação correta do usuário Supavisor da sua conta, resolvendo o bug do tenent local e da porta IPv4):
   - Key: `DATABASE_CONNECTION_URI` | Value: `postgresql://postgres.azuhpztijhfxcyesaaef:Cj%2346765821@aws-1-sa-east-1.pooler.supabase.com:5432/postgres?pgbouncer=true`
   - Key: `DATABASE_URL` | Value: `postgresql://postgres.azuhpztijhfxcyesaaef:Cj%2346765821@aws-1-sa-east-1.pooler.supabase.com:5432/postgres?pgbouncer=true`

   - Key: `DATABASE_SAVE_DATA` | Value: `false`
   - Key: `WEBHOOK_GLOBAL_ENABLED` | Value: `false`
   - Key: `REDIS_ENABLED` | Value: `false`

4. Desça até o final e inicie o deploy! A sua API subirá e ficará pronta para gerar os QR Codes via API usando o Supabase perfeitamente.

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
