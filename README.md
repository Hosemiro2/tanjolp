# Pacote final — TANJŌ Studio

Pacote consolidado de **tudo** que foi decidido até aqui. Substitui qualquer
pacote anterior — é a versão de deploy.

**Status:** typecheck ✅ + 5/5 testes ✅

---

## Aplicação no repo

### 1. Arquivos a remover do repo antes:

```bash
git rm drizzle/0000_fluffy_roughhouse.sql
git rm drizzle/0001_white_logan.sql
git rm drizzle/meta/0001_snapshot.json
git rm -r drizzle/migrations/
git rm server/_core/oauth.ts        # OAuth Manus removido
git rm server/_core/storageProxy.ts # storage legado removido
git rm server/storage.ts            # storage legado removido
```

### 2. Aplicar os 32 arquivos deste pacote por cima.

### 3. Instalar dependências novas:

```bash
pnpm install
```

Novas: `@anthropic-ai/sdk`. Removidas: `openai`, `@aws-sdk/s3-request-presigner`.

### 4. Validar local antes de subir:

```bash
pnpm check          # tsc — deve passar
pnpm test           # vitest — 5/5 passando
pnpm build          # gera dist/
```

### 5. Deploy no Nexus: ver **`DEPLOYMENT.md`** (guia passo-a-passo completo).

---

## O que tem nesta versão

### Identidade visual ("ar futurista")
- **`Atmosphere.tsx`** — wireframe gem 3D girando + data rails laterais
  (ticks `1.42mm`, `Au 85.2%`, `R.42`). Position fixed, desktop only.
- Animações `tk-*` (rise, float, pulse, corepulse, tick-fall) no `index.css`
- Domínio `comercial@tanjoo.com.br` (2 o's) consistente em todo lugar

### Captação de leads
- Form sem CNPJ. Pede: nome, e-mail, WhatsApp, empresa (opcional)
- Aviso LGPD discreto (sem checkbox bloqueante) com link pra
  `/politica-de-privacidade`
- WhatsApp comercial real `+55 11 96422 0246` no DanyaStudio

### LLMs
- **Chat (Danya):** Anthropic Claude Sonnet 4.5
- **Imagens:** Leonardo AI Phoenix (async com polling, max 60s)
- Imagens são **arquivadas no Cloudflare R2** depois de geradas
  (caso a URL temporária da Leonardo expire)

### Backend
- Postgres (driver `pg` + drizzle node-postgres)
- Brevo pra notificação por email do `notifyOwner`
- OAuth Manus + storage proxy legado: deletados
- Senhas: `JWT_SECRET` + `ADMIN_SESSION_SECRET` por env var

### Painel admin exclusivo
- Auth: HMAC-signed cookie de 12h, sem tabela de sessions
- Login em `/admin/login` com senha em env (`ADMIN_PASSWORD`)
- **`/admin`** — tabela paginada de leads (data, nome, e-mail, WhatsApp,
  empresa, renders, link pro chat)
- **`/admin/lead/:id`** — detalhe do lead + histórico completo do chat
  com a Danya + imagens geradas

### LGPD
- Página `/politica-de-privacidade` em template LGPD pt-BR
- **Versão mínima sem CNPJ** (acordado): identifica controlador por nome
  empresarial + e-mail. 2 placeholders restantes:
  - `[PREENCHER DATA]` no topo
  - `[PREENCHER NOME DO ENCARREGADO]` na seção 9

---

## Variáveis de ambiente necessárias

Ver **`env.template`**. Em resumo:

| Variável | Onde gerar |
|---|---|
| `ANTHROPIC_API_KEY` | https://console.anthropic.com/settings/keys |
| `LEONARDO_API_KEY` | https://app.leonardo.ai/settings/api-access (precisa plano) |
| `BREVO_API_KEY` | https://app.brevo.com/settings/keys/api |
| `R2_*` (5 vars) | Cloudflare Dashboard → R2 |
| `ADMIN_PASSWORD` | Você escolhe (forte) |
| `JWT_SECRET` / `ADMIN_SESSION_SECRET` | `openssl rand -hex 32` |
| `DATABASE_URL` | `postgresql://postgres:SENHA@localhost:5433/tanjo_studio` |

---

## Custos mensais esperados

| Serviço | Custo |
|---|---|
| Anthropic Claude Sonnet | $1–$5 |
| Leonardo AI (plano API) | $9–$24 |
| Brevo | $0 (free 300/dia) |
| Cloudflare R2 | $0 (free 10GB) |
| Cloudflare Tunnel | $0 |
| **Total** | **~$10–30/mês** |

---

## Pendências realmente menores

Antes de divulgar a URL:

1. Preencher data + nome do encarregado na `Privacidade.tsx`
2. Criar e validar `comercial@tanjoo.com.br` (mailbox + DNS pro Brevo)
3. Trocar `ADMIN_PASSWORD` por algo seguro
4. (Opcional) Mandar 3 imagens reais pra
   `client/public/assets/joia-amostra-01.jpg` (02, 03)
5. (Opcional) Conferir/ajustar stats do hero: "200+ clientes B2B / 18k / 5 anos"

---

## Estrutura

```
tanjo-final/
├── DEPLOYMENT.md           # Guia completo de subida no Nexus
├── SETUP_POSTGRES.md       # Criar database tanjo_studio
├── env.template            # Todas as env vars documentadas
├── package.json            # @anthropic-ai/sdk + sem openai
├── drizzle.config.ts
├── drizzle/
│   ├── schema.ts           # Sem coluna CNPJ
│   ├── 0000_round_smasher.sql
│   └── meta/
├── server/
│   ├── routers.ts          # + router admin
│   ├── db.ts               # + listLeads, getLeadById
│   ├── *.test.ts
│   └── _core/
│       ├── adminAuth.ts    # NEW — HMAC cookie helpers
│       ├── llm.ts          # Anthropic
│       ├── imageGeneration.ts  # Leonardo AI
│       ├── notification.ts # Brevo
│       ├── r2Storage.ts    # NEW — R2 archival
│       ├── context.ts      # + isAdmin
│       ├── trpc.ts         # adminProcedure refeito
│       ├── env.ts          # Consolidado
│       └── index.ts        # OAuth/storageProxy removidos
└── client/src/
    ├── App.tsx             # + rotas admin
    ├── index.css           # + animações tk-*
    ├── components/
    │   ├── Atmosphere.tsx  # NEW — gem 3D + data rails
    │   └── LeadForm.tsx    # Sem CNPJ
    └── pages/
        ├── Home.tsx        # + Atmosphere
        ├── DanyaStudio.tsx # WhatsApp real
        ├── Privacidade.tsx # Sem CNPJ
        ├── AdminLogin.tsx  # NEW
        ├── AdminLeads.tsx  # NEW
        └── AdminLeadDetail.tsx  # NEW
```
