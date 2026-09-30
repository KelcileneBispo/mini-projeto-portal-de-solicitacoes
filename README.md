# Portal de Solicitações Internas

## Sobre

Portal interno para colaboradores registrarem solicitações e acompanharem a evolução delas até a conclusão. Esta etapa entrega a estrutura do monorepo, a aplicação web, a API e o PostgreSQL local. O fluxo de solicitações ainda não está implementado.

## Stack

- Frontend: Next.js, React, TypeScript e Tailwind CSS
- Backend: NestJS, TypeScript e Prisma
- Banco: PostgreSQL
- Infraestrutura local: Docker Compose
- Monorepo: pnpm e Turborepo

## Estrutura

- `apps/web`: interface Next.js. Nesta fase há apenas uma página inicial para confirmar que o frontend sobe.
- `apps/api`: API NestJS. Nesta fase expõe `GET /health` e a configuração do Prisma, ainda sem tabelas de domínio.
- `packages/config`: Prettier, ESLint de TypeScript e a base estrita do TypeScript compartilhados pelos pacotes.
- `packages/types`: tipos compartilhados entre as aplicações. Hoje contém apenas o tipo da resposta de saúde da API.
- `docs`: especificação da Fase 1.

## Requisitos

- Node.js 22.12 ou superior
- pnpm 10.18.0, via Corepack
- Docker, com Docker Compose

O NestJS CLI 12 não inicia no Node.js 20. Use a versão indicada no `.nvmrc`.

## Instalação

Na raiz do repositório:

```bash
nvm use
corepack enable
corepack prepare pnpm@10.18.0 --activate
pnpm install
```

## Variáveis de ambiente

Copie o exemplo e ajuste só se a porta ou o nome do banco local precisarem mudar:

```bash
cp .env.example .env
```

O arquivo `.env` fica na raiz e não deve ser commitado. Ele é lido pelo Docker Compose e pelo Prisma. Os valores do exemplo são credenciais locais de desenvolvimento.

`JWT_SECRET`, `JWT_EXPIRES_IN`, `CORS_ORIGIN` e `NEXT_PUBLIC_API_URL` já estão documentados para as próximas fases. A API desta fase não autentica e o frontend ainda não chama a API.

## Banco

Com o `.env` criado:

```bash
docker compose up -d
```

Para ver o serviço:

```bash
docker compose ps
```

Para parar o PostgreSQL e manter os dados no volume:

```bash
docker compose down
```

As tabelas de usuário e solicitação ainda não existem. O Prisma está apontando para o `DATABASE_URL` e a pasta `apps/api/prisma/migrations` está pronta para as migrations das próximas fases.

## Desenvolvimento

Na raiz, sobe a API na porta 3001 e o frontend na porta 3000:

```bash
pnpm dev
```

Comandos separados:

```bash
pnpm --filter @portal/api dev
pnpm --filter @portal/web dev
```

Também na raiz:

```bash
pnpm lint
pnpm format
pnpm build
```

## Health Check

Com a API no ar:

```bash
curl http://localhost:3001/health
```

A resposta esperada é:

```json
{ "status": "ok" }
```
