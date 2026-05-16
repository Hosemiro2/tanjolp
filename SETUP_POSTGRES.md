# Setup do Postgres pro TANJŌ Studio (LP)

Como o projeto vai rodar no seu servidor caseiro (hostname `nexus`) e
reaproveitar a instância de Postgres já existente do `tanjo-platform`
(container `tanjo-postgres:5433`), o setup do banco é só **criar um
database isolado dentro dela**.

---

## 1. Criar o database

No host (Beelink), entre no container do Postgres como superusuário:

```bash
docker exec -it tanjo-postgres psql -U postgres
```

Dentro do psql, crie o database e (recomendado) um usuário dedicado pra
este projeto, com privilégios apenas sobre esse database:

```sql
-- Criar usuário dedicado (opcional mas recomendado)
CREATE USER tanjo_studio_app WITH PASSWORD 'TROQUE_ESTA_SENHA';

-- Criar database isolado, owner = usuário dedicado
CREATE DATABASE tanjo_studio
  WITH OWNER = tanjo_studio_app
  ENCODING = 'UTF8'
  TEMPLATE template0;

-- Conferir
\l

\q
```

> Não criou usuário dedicado? Sem problema — pode usar o usuário padrão
> do `tanjo-postgres`. Só ajuste a `DATABASE_URL` no `.env` de acordo.

---

## 2. Configurar o `.env` deste projeto

Na raiz de `~/tanjo-landing` (ou onde você for clonar o repo), crie um
`.env` baseado no `env.template`. A `DATABASE_URL` muda conforme onde o
processo roda:

**Se rodar como processo do host (fora de container):**
```env
DATABASE_URL=postgresql://tanjo_studio_app:SENHA@localhost:5433/tanjo_studio
```

**Se rodar dentro de container Docker na mesma rede do `tanjo-postgres`:**
```env
DATABASE_URL=postgresql://tanjo_studio_app:SENHA@tanjo-postgres:5432/tanjo_studio
```

---

## 3. Aplicar a migration

Depois do `.env` configurado, rode a partir da raiz do projeto:

```bash
pnpm install
pnpm db:push
```

Isso cria as 3 tabelas (`users`, `leads`, `chat_messages`) e os dois enums
(`user_role`, `chat_role`) dentro do database `tanjo_studio`.

Pra conferir:

```bash
docker exec -it tanjo-postgres psql -U tanjo_studio_app -d tanjo_studio -c "\dt"
```

Deve listar:

```
              List of relations
 Schema |     Name      | Type  |     Owner
--------+---------------+-------+------------------
 public | chat_messages | table | tanjo_studio_app
 public | leads         | table | tanjo_studio_app
 public | users         | table | tanjo_studio_app
```

---

## 4. Validar conexão local

Ainda na raiz do projeto:

```bash
pnpm test
pnpm dev
```

Se o servidor sobe sem erro de conexão e os testes passam (10/10), o
backend está conversando com o Postgres.

---

## Notas operacionais

- **Backup**: como o database está no mesmo container do `tanjo-postgres`,
  os backups que você (eventualmente) faz desse container já cobrem o
  `tanjo_studio`. Se ainda não tem rotina de backup, vale criar — o
  Claude Code mencionou que nenhum app tem systemd unit; é boa
  oportunidade pra começar.

- **Porta exposta**: o container está em `5433` no host. Se você ainda
  não tem firewall fechando essa porta, vale conferir — só processos
  locais e containers da mesma rede Docker precisam acessar.

- **Roles**: por enquanto não tem usuário admin cadastrado. Como o
  projeto não usa OAuth do owner (a captação de leads é pública), isso
  fica como infraestrutura pra eventual painel admin futuro.
