# TANJŌ Studio — Plano de Implantação

> Documento técnico para migração, customização e deploy do projeto fora da plataforma Manus.

---

## 1. Visão Geral da Arquitetura

O projeto é uma aplicação **full-stack monorepo** com as seguintes camadas:

| Camada | Tecnologia | Descrição |
|---|---|---|
| Frontend | React 19 + Vite + Tailwind CSS 4 | SPA servida pelo Vite em dev, ou como estáticos em prod |
| Backend | Node.js + Express 4 + tRPC 11 | API tipada end-to-end, sem REST manual |
| Banco de dados | MySQL 8+ (ou TiDB) + Drizzle ORM | Schema em `drizzle/schema.ts`, migrations em SQL |
| Autenticação | Manus OAuth (ou substituível por NextAuth/Lucia) | Cookie de sessão JWT assinado |
| IA — Agente Danya | OpenAI GPT-4o (via API) | Prompt em `server/routers.ts` → `DANYA_SYSTEM_PROMPT` |
| Geração de imagens | OpenAI DALL-E 3 (via API) | Helper em `server/_core/imageGeneration.ts` |
| Storage de arquivos | S3-compatible (AWS S3, Cloudflare R2, etc.) | Helper em `server/storage.ts` |

---

## 2. Pré-requisitos

Antes de iniciar, você precisará ter disponíveis:

- **Node.js 20+** e **pnpm 9+** instalados localmente
- **MySQL 8+** (local, PlanetScale, Railway, Supabase MySQL, etc.)
- **Conta OpenAI** com acesso à API (GPT-4o + DALL-E 3)
- **Bucket S3-compatible** para armazenar imagens geradas e uploads (AWS S3, Cloudflare R2 ou similar)
- **Servidor de deploy** compatível com Node.js (Railway, Render, Fly.io, VPS com PM2, etc.)

---

## 3. Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# ── Banco de dados ────────────────────────────────────────────────────────────
DATABASE_URL="mysql://usuario:senha@host:3306/tanjo_db"

# ── Autenticação JWT ──────────────────────────────────────────────────────────
JWT_SECRET="sua-chave-secreta-longa-e-aleatoria-aqui"

# ── OpenAI (Agente Danya + Geração de Imagens) ────────────────────────────────
OPENAI_API_KEY="sk-..."

# ── S3 / Storage ──────────────────────────────────────────────────────────────
S3_BUCKET="tanjo-storage"
S3_REGION="us-east-1"
S3_ACCESS_KEY_ID="AKIA..."
S3_SECRET_ACCESS_KEY="..."
S3_ENDPOINT="https://s3.amazonaws.com"   # Para Cloudflare R2: https://<account>.r2.cloudflarestorage.com

# ── App ───────────────────────────────────────────────────────────────────────
NODE_ENV="production"
PORT=3000
VITE_APP_TITLE="TANJŌ Studio"
```

> **Nota sobre autenticação:** O projeto original usa Manus OAuth. Se você quiser manter login de usuários, precisará substituir o sistema OAuth. A alternativa mais simples é usar **[Lucia Auth](https://lucia-auth.com/)** ou **[Better Auth](https://www.better-auth.com/)** com o mesmo banco MySQL. O fluxo de autenticação está em `server/_core/oauth.ts` e `server/_core/context.ts`.

---

## 4. Adaptações Necessárias no Código

### 4.1 Imagens — Substituir caminhos do CDN Manus

Todas as imagens no código usam o prefixo `/manus-storage/`. Você precisa:

1. Hospedar as imagens da pasta `assets/` em seu próprio S3 ou CDN.
2. Substituir as referências no código. Os arquivos afetados são:
   - `client/src/pages/Home.tsx` — imagens de produto e logos
   - `client/src/pages/DanyaStudio.tsx` — logo na navbar

**Mapeamento de imagens:**

| Arquivo original | Uso no site |
|---|---|
| `LOGO01.png` | Ícone do logo — navbar esquerda |
| `MARCA01.png` | Marca TANJŌ JEWELRY — navbar centro |
| `Logo_vertical_laranja.png` | Logo vertical — rodapé |
| `tanjo-ourivesaria-01.jpg` | Seção "Sobre" — grid de fotos |
| `tanjo-ourivesaria-02.jpg` | Seção "Processo" — etapa 02 |
| `tanjo-cravacao-01.jpg` | Seção "Processo" — etapa 03 |
| `tanjo-cravacao-03.jpg` | Seção "Sobre" — grid de fotos |
| `tanjo-polimento-01.jpg` | Seção "Sobre" — grid de fotos |
| `tanjo-finalizado-02.jpg` | Seção "Sobre" — grid de fotos |
| `tanjo-finalizado-03.jpg` | Seção "Processo" — etapa 04 |

**Substituição rápida:** Após hospedar as imagens, faça um find & replace global em `client/src/` trocando `/manus-storage/NOME_ARQUIVO_hash.ext` pela URL do seu CDN.

### 4.2 LLM — Adaptar o helper de IA

O arquivo `server/_core/llm.ts` usa a API interna do Manus. Substitua-o pelo cliente oficial da OpenAI:

```bash
pnpm add openai
```

Crie `server/_core/llm.ts` com:

```typescript
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function invokeLLM({ messages, response_format }: {
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  response_format?: object;
}) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages,
    ...(response_format ? { response_format } : {}),
  });
  return response;
}
```

### 4.3 Geração de Imagens — Adaptar o helper

O arquivo `server/_core/imageGeneration.ts` usa a API interna do Manus. Substitua por:

```typescript
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateImage({ prompt }: { prompt: string }) {
  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt,
    n: 1,
    size: "1024x1024",
    quality: "hd",
  });
  return { url: response.data[0].url };
}
```

### 4.4 Storage S3 — Adaptar o helper

O arquivo `server/storage.ts` usa o storage interno do Manus. Substitua por um cliente S3:

```bash
pnpm add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

Adapte `server/storage.ts` para usar `PutObjectCommand` do AWS SDK v3.

### 4.5 Autenticação — Remover Manus OAuth

Se não precisar de login de usuários (o site funciona sem login para a LP e o formulário de leads), você pode simplesmente:

1. Remover as rotas de OAuth em `server/_core/oauth.ts`
2. Remover o `protectedProcedure` das rotas que não precisam de autenticação
3. O formulário de leads (`leads.register`) e o chat da Danya (`danya.*`) já são `publicProcedure` — funcionam sem login

---

## 5. Banco de Dados

### 5.1 Criar o banco

```sql
CREATE DATABASE tanjo_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 5.2 Aplicar as migrations

```bash
pnpm drizzle-kit generate   # gera o SQL de migração
```

Depois aplique o SQL gerado na pasta `drizzle/migrations/` no seu banco.

### 5.3 Schema principal

As tabelas do projeto são:

| Tabela | Descrição |
|---|---|
| `users` | Usuários autenticados (se mantiver OAuth) |
| `leads` | Leads B2B capturados pelo formulário (nome, empresa, CNPJ, email, WhatsApp) |
| `chat_messages` | Histórico de conversas com a Danya por sessão |

---

## 6. Instalação e Execução Local

```bash
# 1. Instalar dependências
pnpm install

# 2. Configurar variáveis de ambiente
cp .env.example .env
# Edite o .env com suas credenciais

# 3. Aplicar migrations no banco
pnpm drizzle-kit push   # ou aplicar o SQL manualmente

# 4. Rodar em desenvolvimento
pnpm dev

# 5. Build para produção
pnpm build

# 6. Rodar em produção
pnpm start
```

---

## 7. Deploy em Produção

### Opção A — Railway (recomendado, mais simples)

1. Crie um projeto no [Railway](https://railway.app)
2. Adicione um serviço MySQL no Railway
3. Conecte o repositório GitHub ao Railway
4. Configure as variáveis de ambiente no painel do Railway
5. O deploy é automático a cada push na branch `main`

### Opção B — Render

1. Crie um Web Service no [Render](https://render.com) apontando para o repositório
2. Build command: `pnpm install && pnpm build`
3. Start command: `pnpm start`
4. Adicione um banco PostgreSQL ou MySQL externo (PlanetScale, etc.)
5. Configure as variáveis de ambiente

### Opção C — VPS (Fly.io, DigitalOcean, etc.)

```bash
# Build
pnpm build

# Rodar com PM2
npm install -g pm2
pm2 start dist/server/_core/index.js --name tanjo-studio
pm2 save
```

---

## 8. O Agente Danya — Documentação Completa

### Identidade

**Danya AI** é a Diretora Criativa Virtual da TANJŌ JEWELRY. Ela atua como consultora de design B2B, guiando lojistas e marcas na criação de coleções exclusivas.

### Fluxo de Conversa

```
Fase 1: Briefing
  └── Cumprimenta pelo nome
  └── Faz até 2 perguntas por mensagem
  └── Descobre: Peça → Metal → Gema → Estilo

Fase 2: Geração
  └── Resume a joia desenhada juntos
  └── Gera prompt técnico em inglês dentro de <image_prompt>...</image_prompt>
  └── O backend extrai a tag e chama DALL-E 3
  └── A imagem é exibida no chat

Fase 3: Fechamento
  └── Pede feedback sobre o conceito
  └── Apresenta o processo completo da TANJŌ
  └── Convida para orçamento oficial de fábrica
```

### Localização do Prompt

O system prompt completo está em `server/routers.ts`, na constante `DANYA_SYSTEM_PROMPT` (linha ~37). Você pode editar diretamente para ajustar o tom, as regras ou o fluxo.

### Regras de Negócio do Agente

- Nunca menciona ferramentas de IA externas (DALL-E, Midjourney, etc.)
- Nunca fornece preços ou estimativas de valores
- Foco exclusivo em clientes B2B (marcas, lojistas, designers)
- Responde sempre em português brasileiro
- Limite de imagens por sessão: configurável em `server/routers.ts`

---

## 9. Estrutura de Arquivos Importantes

```
code/
├── client/src/
│   ├── pages/
│   │   ├── Home.tsx          ← Landing Page completa
│   │   └── DanyaStudio.tsx   ← Interface do chat com a Danya
│   └── components/
│       └── LeadForm.tsx      ← Formulário de captação B2B
├── server/
│   ├── routers.ts            ← TODAS as rotas tRPC + prompt da Danya
│   ├── db.ts                 ← Queries do banco de dados
│   └── _core/
│       ├── llm.ts            ← Helper de LLM (adaptar para OpenAI)
│       ├── imageGeneration.ts← Helper de geração de imagens (adaptar)
│       └── context.ts        ← Contexto de autenticação por request
├── drizzle/
│   └── schema.ts             ← Schema do banco de dados
└── assets/                   ← Todas as imagens do projeto
```

---

## 10. Checklist de Implantação

- [ ] Configurar banco MySQL e aplicar migrations
- [ ] Hospedar imagens da pasta `assets/` em S3 ou CDN próprio
- [ ] Substituir caminhos `/manus-storage/` pelas URLs do seu CDN em `Home.tsx` e `DanyaStudio.tsx`
- [ ] Adaptar `server/_core/llm.ts` para usar OpenAI diretamente
- [ ] Adaptar `server/_core/imageGeneration.ts` para usar OpenAI DALL-E 3
- [ ] Adaptar `server/storage.ts` para usar AWS S3 ou Cloudflare R2
- [ ] Configurar variáveis de ambiente no servidor de deploy
- [ ] Decidir sobre autenticação: manter OAuth, substituir por Lucia/Better Auth, ou remover
- [ ] Testar o fluxo completo: formulário de lead → chat Danya → geração de imagem
- [ ] Configurar domínio customizado e SSL

---

*Documento gerado em maio de 2026. Para dúvidas sobre o código, consulte os comentários inline em cada arquivo.*
