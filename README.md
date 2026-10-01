# Portal de Solicitações Internas

Portal interno para colaboradores autenticados registrarem solicitações e acompanharem a evolução delas até a conclusão.

O sistema permite login e logout, criação de solicitações, consulta, edição e exclusão enquanto a solicitação está aberta, avanço de status, filtros e um dashboard com as quantidades do conjunto. Os dados ficam no PostgreSQL. A API aplica as regras de negócio. A interface consome essa API.

## Stack

### Frontend

- Next.js, React e TypeScript
- Tailwind CSS
- React Hook Form e Zod
- TanStack Query

### Backend

- NestJS e TypeScript
- Prisma
- JWT e bcrypt

### Banco

- PostgreSQL 17

### Infraestrutura local

- Docker Compose, com um único serviço: o PostgreSQL
- pnpm 10.18.0
- Turborepo

A API e o frontend rodam no host, pelos scripts do pnpm. O Compose não sobe esses dois processos.

## Estrutura

```text
apps/
  api/                  API NestJS, Prisma, migrations e seed
  web/                  Interface Next.js
packages/
  config/               Prettier, ESLint e base do TypeScript
  types/                Tipo compartilhado da resposta de GET /health
docs/                   Memorial, dicionário de dados e contrato da API
docker-compose.yml      PostgreSQL local
package.json            Scripts da raiz
pnpm-workspace.yaml
turbo.json
.env.example
```

- `apps/api`: autenticação, solicitações, filtros, dashboard e acesso ao banco.
- `apps/web`: telas de login, listagem, dashboard, cadastro, detalhe e edição.
- `packages/config`: configuração compartilhada de formatação, lint e TypeScript.
- `packages/types`: hoje exporta somente o tipo da resposta de saúde da API. Categorias e status da solicitação ficam no Prisma e nos tipos do frontend.
- `docs`: memorial técnico, dicionário de dados e contrato da API.

## Pré-requisitos

- Node.js 22.12 ou superior (`engines` em `package.json`)
- pnpm 10.18.0, via Corepack (`packageManager` na raiz)
- Docker, com Docker Compose

O NestJS CLI 12 não inicia no Node.js 20.

## Configuração

As variáveis ficam em um único `.env` na raiz. Esse arquivo não é commitado. O Docker Compose, o Prisma, a API e o frontend leem esse mesmo arquivo.

```bash
cp .env.example .env
```

Antes de subir a API, preencha `JWT_SECRET` com um valor usado somente nesta máquina. O exemplo deixa a variável vazia de propósito. Sem ela, a API não inicia.

| Variável | Quem usa | Obrigatória |
| --- | --- | --- |
| `POSTGRES_USER` | Docker Compose | Não. O padrão do Compose é `portal`. |
| `POSTGRES_PASSWORD` | Docker Compose | Não. O padrão do Compose é `portal`. |
| `POSTGRES_DB` | Docker Compose | Não. O padrão do Compose é `portal_solicitacoes`. |
| `POSTGRES_PORT` | Docker Compose | Não. O padrão é `5432`. |
| `DATABASE_URL` | Prisma e API | Sim. |
| `JWT_SECRET` | API | Sim. Precisa ser preenchida. |
| `JWT_EXPIRES_IN` | API | Sim. O exemplo usa `8h`. |
| `CORS_ORIGIN` | API | Sim. Origem explícita do frontend. O exemplo usa `http://localhost:3000`. A API recusa curinga. |
| `NEXT_PUBLIC_API_URL` | Frontend | Sim para o navegador chamar a API. O exemplo usa `http://localhost:3001`. |

A porta da API é `PORT`. Ela não está no exemplo. Quando omitida, a API escuta em `3001`.

Os valores do exemplo são credenciais locais de desenvolvimento.

## Banco de dados

Suba o PostgreSQL:

```bash
docker compose up -d
```

Confira o serviço:

```bash
docker compose ps
```

Para parar o banco e manter os dados no volume:

```bash
docker compose down
```

Com o `.env` criado e o Postgres aceitando conexão, gere o cliente, aplique a migration e rode o seed. Esses comandos usam o Prisma já instalado em `@portal/api`. Não há script de migration na raiz.

```bash
pnpm --filter @portal/api prisma:generate
pnpm --filter @portal/api exec prisma migrate deploy
pnpm --filter @portal/api prisma:seed
```

`prisma migrate deploy` cria os enums, as tabelas `users` e `requests`, os índices, a chave estrangeira e o status padrão `ABERTO`. O seed insere os usuários e as solicitações de demonstração.

### Seed

O seed é idempotente para os três usuários: se o login já existe, atualiza nome e hash da senha. Para cada solicitação de demonstração, procura uma linha com o mesmo título e o mesmo autor. Se encontra, atualiza descrição, categoria e status. Se não encontra, cria a linha. Solicitações com outro título permanecem no banco.

Rodar o seed de novo restaura os dados de demonstração abaixo, inclusive o status, quando o título e o autor coincidem.

### Usuários de demonstração

Credenciais apenas para avaliação e desenvolvimento local.

| Usuário | Senha | Nome |
| --- | --- | --- |
| `ana` | `dev-ana-123` | Ana Souza |
| `bruno` | `dev-bruno-123` | Bruno Lima |
| `carla` | `dev-carla-123` | Carla Mendes |

O seed também cria seis solicitações, duas para cada pessoa, cobrindo as categorias e os status Aberto, Em atendimento e Concluído.

## Execução

Quem acabou de clonar o repositório segue esta ordem na raiz. O `.env` precisa existir, com `JWT_SECRET` preenchido, antes da migration e da API.

```bash
corepack enable
corepack prepare pnpm@10.18.0 --activate
pnpm install
cp .env.example .env
docker compose up -d
pnpm --filter @portal/api prisma:generate
pnpm --filter @portal/api exec prisma migrate deploy
pnpm --filter @portal/api prisma:seed
pnpm dev
```

Preencha `JWT_SECRET` no `.env` antes de `pnpm dev`. Sem esse valor, a API não inicia.

`pnpm dev` sobe o frontend em http://localhost:3000 e a API em http://localhost:3001, pelo Turborepo.

Comandos separados:

```bash
pnpm --filter @portal/api dev
pnpm --filter @portal/web dev
```

## Acesso

- Frontend: http://localhost:3000
- API: http://localhost:3001
- Saúde da API: http://localhost:3001/health

```bash
curl http://localhost:3001/health
```

A resposta esperada é:

```json
{ "status": "ok" }
```

Não há interface Swagger. O contrato está em `docs/api.md`.

Entre com um dos usuários de demonstração. A tela inicial mostra o dashboard e a listagem.

## Funcionalidades

### Autenticação

- Login com usuário e senha
- Sessão por JWT guardado no `sessionStorage` do navegador
- Logout, que descarta o token no cliente
- Redirecionamento das telas internas quando não há sessão

Solicitações e dashboard exigem token. `POST /auth/login` e `GET /health` são públicos.

### Solicitações

- Criação com título, descrição e categoria
- Listagem com código, título, categoria, solicitante, data de abertura e status
- Detalhe
- Edição
- Exclusão, com confirmação
- Alteração de status

Categorias: TI, RH, Compras, Financeiro e Infraestrutura.

### Filtros

- Título
- Categoria
- Status
- Período pela data de abertura

Os filtros se combinam. A listagem é paginada.

### Dashboard

- Total
- Abertas
- Em atendimento
- Concluídas

Os números são do conjunto inteiro e não acompanham o filtro da lista.

## Regras de negócio

O motivo de cada regra está em `docs/memorial-tecnico.md`. Resumo do que a API aplica:

- A solicitação nova começa como `ABERTO`.
- O solicitante é o usuário autenticado.
- Somente o autor edita e somente o autor exclui.
- Edição e exclusão existem apenas enquanto o status é `ABERTO`.
- Qualquer usuário autenticado pode avançar o status.
- A sequência é `ABERTO` → `EM_ATENDIMENTO` → `CONCLUIDO`.
- Não é permitido pular etapa nem reabrir uma solicitação concluída.
- Solicitação em atendimento ou concluída não é editada nem excluída.
- A listagem é global para quem está autenticado.

## Testes e verificação

Na raiz:

```bash
pnpm test
pnpm lint
pnpm build
```

Por aplicativo:

```bash
pnpm --filter @portal/api test
pnpm --filter @portal/web test
```

`pnpm format` formata o repositório com o Prettier.

## Documentação

- `docs/memorial-tecnico.md`: decisões, justificativa da stack e análise crítica
- `docs/modelo-de-dados.md`: dicionário de dados
- `docs/api.md`: contrato HTTP
