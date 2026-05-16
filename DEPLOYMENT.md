# Deployment — TANJŌ Studio no servidor Nexus

Este guia cobre a subida completa do projeto no servidor caseiro (`nexus`,
Beelink Mini PC, Ubuntu 24.04, 192.168.15.5). Subdomínio público:
`studio.tanjoo.com.br` via Cloudflare Tunnel.

---

## 1. Pré-requisitos (já existentes no Nexus)

- Postgres em container Docker (`tanjo-postgres:5433`)
- Node.js 20+ e pnpm
- Cloudflare Tunnel binário (`cloudflared`) já instalado em `~/.cloudflared/`
- Acesso ao painel Cloudflare da conta de `tanjoo.com.br`

---

## 2. Criar a database

```bash
docker exec -it tanjo-postgres psql -U postgres
```

```sql
CREATE DATABASE tanjo_studio;
\q
```

---

## 3. Clonar + instalar

```bash
cd ~
git clone https://github.com/Hosemiro2/tanjolp.git tanjo-studio
cd tanjo-studio
pnpm install
```

---

## 4. Configurar credenciais

### 4.1 Anthropic Claude
1. Vá em https://console.anthropic.com/settings/keys
2. Crie uma API key. Salve em `ANTHROPIC_API_KEY` no `.env`
3. Adicione crédito ($20 dura bem pra começar — Sonnet ≈ $3/M tokens input)

### 4.2 Leonardo AI
1. Vá em https://app.leonardo.ai/settings/api-access
2. **Atenção:** API access requer plano pago (a partir de $9/mo). Plano free
   só permite uso na UI deles, não via API.
3. Gere a key, salve em `LEONARDO_API_KEY`

### 4.3 Brevo
1. Sua conta já está criada em https://app.brevo.com
2. Vá em **Settings → API Keys → Generate a new API key**
3. Salve em `BREVO_API_KEY`
4. **Importante:** valide o domínio remetente (`tanjoo.com.br`):
   - Settings → Senders & IP → Domains → Add domain
   - Cole os registros DNS gerados (SPF, DKIM, DMARC) no Cloudflare DNS
   - Aguarde verificação (geralmente <10min)

### 4.4 Cloudflare R2
1. Cloudflare Dashboard → **R2 Object Storage** → Create bucket → `tanjo-studio`
2. Em **Manage R2 API Tokens** → Create API Token:
   - Permissions: **Object Read & Write**
   - Specify bucket: `tanjo-studio`
   - Copie Account ID, Access Key ID, Secret Access Key
3. Configurar custom domain pro bucket (pras URLs públicas funcionarem):
   - Settings do bucket → Custom Domains → Connect Domain
   - Cole `images.tanjoo.com.br`
   - Cloudflare cria o CNAME automaticamente

### 4.5 Senhas do admin

```bash
# Gerar segredos aleatórios
openssl rand -hex 32  # → ADMIN_SESSION_SECRET
openssl rand -hex 32  # → JWT_SECRET

# Escolher senha forte do admin
# Algo tipo "tanjo-admin-x7K2pQ" ou frase passphrase
```

### 4.6 Preencher o `.env`

```bash
cp env.template .env
nano .env  # cole todos os valores
```

---

## 5. Rodar migration do banco

```bash
pnpm db:push
```

Confirme no Postgres:
```bash
docker exec -it tanjo-postgres psql -U postgres -d tanjo_studio -c "\dt"
# deve listar: users, leads, chat_messages
```

---

## 6. Build de produção

```bash
pnpm build
```

Gera `dist/` com o server + `dist/public/` com o client.

---

## 7. systemd unit (auto-start + reboot survival)

Crie `/etc/systemd/system/tanjo-studio.service`:

```ini
[Unit]
Description=TANJŌ Studio — landing page B2B
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
User=USER_DO_NEXUS
WorkingDirectory=/home/USER_DO_NEXUS/tanjo-studio
EnvironmentFile=/home/USER_DO_NEXUS/tanjo-studio/.env
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
RestartSec=5
StandardOutput=append:/var/log/tanjo-studio.log
StandardError=append:/var/log/tanjo-studio.log

[Install]
WantedBy=multi-user.target
```

Ativar:

```bash
sudo systemctl daemon-reload
sudo systemctl enable tanjo-studio
sudo systemctl start tanjo-studio
sudo systemctl status tanjo-studio   # confere se subiu
tail -f /var/log/tanjo-studio.log    # ver logs em tempo real
```

App rodando em `http://localhost:3002`. Falta expor.

---

## 8. Cloudflare Tunnel

Você já tem `cloudflared` instalado mas sem processo rodando. Vamos ativar.

### 8.1 Autenticar (1ª vez)

```bash
cloudflared tunnel login
# abre browser → autoriza a conta tanjoo.com.br
```

### 8.2 Criar tunnel

```bash
cloudflared tunnel create tanjo-studio
# Cria UUID e salva credentials em ~/.cloudflared/<UUID>.json
```

### 8.3 Configurar rota DNS

```bash
cloudflared tunnel route dns tanjo-studio studio.tanjoo.com.br
# Cria automaticamente o CNAME no DNS Cloudflare
```

### 8.4 Config do tunnel

Crie `~/.cloudflared/config.yml`:

```yaml
tunnel: tanjo-studio
credentials-file: /home/USER_DO_NEXUS/.cloudflared/<UUID>.json

ingress:
  - hostname: studio.tanjoo.com.br
    service: http://localhost:3002
  - service: http_status:404
```

### 8.5 Rodar como systemd

```bash
sudo cloudflared service install
sudo systemctl enable cloudflared
sudo systemctl start cloudflared
sudo systemctl status cloudflared
```

Pronto. `https://studio.tanjoo.com.br` agora aponta pro app.

---

## 9. Verificações finais

```bash
# App responde local
curl http://localhost:3002/

# App responde via tunnel
curl https://studio.tanjoo.com.br/

# Admin acessível
curl https://studio.tanjoo.com.br/admin/login

# Verificar logs em caso de erro
sudo journalctl -u tanjo-studio -f
sudo journalctl -u cloudflared -f
```

Teste o fluxo completo no browser:
1. Abra `https://studio.tanjoo.com.br/`
2. Preencha o form de lead → deve cair no DB e disparar email pro
   `comercial@tanjoo.com.br`
3. Converse com a Danya → testa Anthropic
4. Gere uma imagem → testa Leonardo + R2 archival
5. Acesse `/admin/login` com a senha do `.env` → veja o lead listado

---

## 10. Manutenção

**Atualizar o app depois de mudanças no repo:**

```bash
cd ~/tanjo-studio
git pull
pnpm install
pnpm build
sudo systemctl restart tanjo-studio
```

**Backup do banco:**

```bash
docker exec tanjo-postgres pg_dump -U postgres tanjo_studio \
  > ~/backups/tanjo_studio_$(date +%Y%m%d).sql
```

(adicione um cron diário, idealmente)

**Custos mensais esperados:**

| Serviço | Tier free | Estimativa de uso | Custo /mês |
|---|---|---|---|
| Anthropic Claude Sonnet | — | ~50 conversas | $1 – $5 |
| Leonardo AI | — | ~100 imagens (com plano API) | $9 – $24 |
| Brevo | 300 emails/dia grátis | — | $0 |
| Cloudflare R2 | 10GB grátis | <1GB | $0 |
| Cloudflare Tunnel | grátis | — | $0 |
| **Total** | | | **~$10–30/mês** |
