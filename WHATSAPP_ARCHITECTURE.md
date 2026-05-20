# WhatsApp System Architecture 🚀

Arquitetura limpa e mínima para integração de WhatsApp usando **Evolution API**, hospedada no **Render**, utilizando exclusivamente o banco de dados **Supabase (PostgreSQL)**, sem Prisma e sem MongoDB.

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

## 5. Deploy da Evolution API no Render

### Passo a Passo (Render "Web Service"):
1. Crie um novo Web Service através do [Render Dashboard](https://dashboard.render.com).
2. Utilize a imagem Docker oficial: `davidsonbrsilva/evolution-api:latest`.
3. Defina as Variáveis de Ambiente apenas para rodar de forma síncrona, desativando dependências de banco e MongoDB:
   - `AUTHENTICATION_TYPE=apikey`
   - `AUTHENTICATION_API_KEY=SuaSenhaForteAqui123!`
   - `PROVIDER=baileys`
   - `DATABASE_ENABLED=false` 
   - `DATABASE_PROVIDER=none`    *(Desativa exigência do Prisma/MongoDB)*
   - `DATABASE_SAVE_DATA=false`  
   - `WEBHOOK_GLOBAL_ENABLED=false` *(Vamos setar nosso webhook via API Connect Dashboard)*
   - `REDIS_ENABLED=false`       *(Apenas para instâncias não-escaladas/Cluster)*

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
