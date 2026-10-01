# Memorial Técnico de Desenvolvimento

## 1. Identificação do projeto

**Nome:** Portal de Solicitações Internas.

**Objetivo:** permitir que colaboradores autenticados registrem solicitações internas e acompanhem a evolução delas até a conclusão.

**Contexto:** entrega técnica de um portal web com API, persistência e interface. O escopo ficou restrito ao fluxo pedido: autenticação, cadastro, consulta, filtros, dashboard e mudança de status.

**Stack principal:**

- Frontend: Next.js, React, TypeScript, Tailwind CSS, React Hook Form, Zod e TanStack Query.
- Backend: NestJS, TypeScript, Prisma, JWT e bcrypt.
- Banco: PostgreSQL 17.
- Organização: monorepo com pnpm 10.18.0 e Turborepo. Node.js 22.12 ou superior.

## 2. Objetivo da solução

O portal substitui o controle informal de pedidos internos por um registro único. Cada solicitação tem título, descrição, categoria, autor, data de abertura e um status que avança até a conclusão.

O fluxo implementado é:

```text
Usuário
   ↓
Login
   ↓
Dashboard e listagem
   ↓
Criação, consulta ou filtro
   ↓
Detalhe
   ↓
Edição, exclusão ou avanço de status
```

Não há cadastro público, fila de atendimento com responsável, comentários nem notificações. Quem entra no sistema é um colaborador já existente, criado pelo seed de demonstração.

## 3. Requisitos atendidos

| Requisito | Como foi atendido |
| --- | --- |
| Autenticação | `POST /auth/login` confere usuário e senha. O frontend guarda o JWT e chama `GET /auth/me`. O logout descarta o token no cliente. Telas internas redirecionam para `/login` sem sessão. |
| Criação de solicitação | O formulário envia título, descrição e categoria. A API grava o autor autenticado, a data e o status `ABERTO`. |
| Edição | `PATCH /requests/:id` altera título, descrição e categoria. A API aceita a operação quando o usuário é o autor e o status é `ABERTO`. |
| Exclusão | `DELETE /requests/:id` remove a linha. Vale a mesma condição da edição. A interface pede confirmação. |
| Gerenciamento | `PATCH /requests/:id/status` avança um passo: `ABERTO` → `EM_ATENDIMENTO` → `CONCLUIDO`. Qualquer usuário autenticado pode fazer essa mudança. |
| Listagem | `GET /requests` devolve código, título, categoria, solicitante, data de abertura e status, da mais recente para a mais antiga. |
| Detalhes | `GET /requests/:id` inclui a descrição e a data de atualização. A tela trata solicitação inexistente. |
| Filtros | Período, categoria, status e trecho do título combinam entre si. A busca volta à primeira página. |
| Dashboard | `GET /dashboard` devolve total, abertas, em atendimento e concluídas, sobre todas as solicitações. |
| API | REST em JSON, com recursos `auth`, `requests` e `dashboard`. O contrato está em `docs/api.md`. |
| Persistência | PostgreSQL, com schema Prisma e migration versionada. O acesso passa pelo cliente Prisma. |
| Validação | class-validator na API, com rejeição de campo extra. Zod nos formulários, antes do envio. |
| Tratamento de erros | Respostas HTTP com mensagem em português. Falha inesperada vira `500` genérico, com o detalhe apenas no log. |
| Frontend | Interface em português para login, resumo, listagem, filtros, cadastro, detalhe, edição, exclusão e status. |

## 4. Arquitetura da solução

```text
Next.js / React
       ↓
    REST API
       ↓
      NestJS
       ↓
     Prisma
       ↓
   PostgreSQL
```

O navegador renderiza o Next.js e chama a API diretamente. Não há backend dentro do Next.js.

- **Next.js / React:** telas, formulários, sessão no navegador e apresentação dos dados.
- **REST API:** contrato HTTP JSON. A regra de negócio fica no servidor.
- **NestJS:** módulos, validação, autenticação e serviços.
- **Prisma:** modelo tipado, migrations e consultas parametrizadas.
- **PostgreSQL:** tabelas, enums, unicidade e chave estrangeira.

O repositório é um monorepo. O pnpm declara os workspaces. O Turborepo dispara `dev`, `build`, `lint` e `test`.

O Docker Compose sobe somente o PostgreSQL. A API e o frontend sobem no host com `pnpm dev`.

## 5. Organização do projeto

```text
apps/
  api/                  NestJS, Prisma, migration e seed
  web/                  Next.js
packages/
  config/               Prettier, ESLint e base do TypeScript
  types/                Tipo da resposta de GET /health
docs/                   Memorial, dicionário de dados e contrato da API
docker-compose.yml
package.json
pnpm-workspace.yaml
turbo.json
.env.example
```

`apps/api` autentica, aplica as regras e persiste. `apps/web` consome a API. `packages/config` concentra a configuração compartilhada de ferramenta. `packages/types` exporta o tipo da resposta de saúde. Categorias e status da solicitação ficam no Prisma e nos tipos do frontend, em `apps/web/src/types/api.ts`.

Em `docs/` ficam este memorial, o dicionário de dados em `docs/modelo-de-dados.md` e o contrato em `docs/api.md`. O passo a passo de execução está no README.

## 6. Backend

A API NestJS está organizada em módulos:

| Módulo | Papel |
| --- | --- |
| `auth` | Login, usuário atual e logout. |
| `requests` | Criação, listagem, detalhe, edição, exclusão e status. |
| `dashboard` | Contagens globais. |
| `prisma` | Cliente PostgreSQL. |
| aplicação | `GET /health`. |

Cada recurso tem controller e service. Os controllers recebem a requisição HTTP. Os services aplicam a regra e falam com o Prisma. Os DTOs descrevem o corpo e a query aceitos.

A validação usa class-validator em um `ValidationPipe` global, com whitelist e rejeição de campo não previsto. Mensagem de validação sai no formato de `docs/api.md`, com `details` por campo.

O guard JWT protege solicitações, dashboard, `GET /auth/me` e `POST /auth/logout`. O token é lido do cabeçalho `Authorization: Bearer`, verificado com HS256 e conferido contra um usuário ainda existente. `POST /auth/login` e `GET /health` são públicos.

O filtro global de exceções devolve o corpo das exceções HTTP já previstas. Uma falha não tratada vira `500` com a mensagem “Erro interno do servidor”. A stack permanece no log.

Endpoints principais:

| Método | Caminho | Função |
| --- | --- | --- |
| `POST` | `/auth/login` | Emite o JWT. |
| `POST` | `/auth/logout` | Responde `204` para um token válido. |
| `GET` | `/auth/me` | Devolve o usuário atual, sem senha. |
| `POST` | `/requests` | Cria solicitação aberta. Responde `201`. |
| `GET` | `/requests` | Lista com filtro e paginação. |
| `GET` | `/requests/:id` | Detalhe, ou `404`. |
| `PATCH` | `/requests/:id` | Edita conteúdo. |
| `DELETE` | `/requests/:id` | Exclui. Responde `204`. |
| `PATCH` | `/requests/:id/status` | Avança o status. |
| `GET` | `/dashboard` | Quatro quantidades. |
| `GET` | `/health` | `{ "status": "ok" }`. |

Não há Swagger. O contrato detalhado continua em `docs/api.md`.

## 7. Autenticação e sessão

1. O usuário envia `username` e `password`.
2. A API remove espaços do usuário, converte para minúsculas e procura o cadastro.
3. A senha é conferida com bcrypt, custo 10.
4. Credencial inválida e usuário inexistente produzem a mesma resposta `401`. Há uma comparação com hash fictício quando o usuário não existe, para aproximar o tempo das duas falhas.
5. No sucesso, a API assina um JWT com `JWT_SECRET`. O prazo vem de `JWT_EXPIRES_IN`. O exemplo local usa `8h`. O payload leva `sub`, `username`, `iat` e `exp`.
6. O frontend grava o token em `sessionStorage`, na chave `portal.accessToken`.
7. As chamadas autenticadas enviam `Authorization: Bearer`.
8. `GET /auth/me` recarrega o usuário a partir do `sub`. Token ausente, inválido, expirado ou de usuário removido responde `401`.
9. O logout chama `POST /auth/logout` e remove o token local. Se a API não confirmar, o token local sai mesmo assim.

O backend não revoga JWT. Um token já emitido continua válido até expirar, mesmo depois do logout na interface. Não há refresh token, blacklist nem tabela de sessão.

`sessionStorage` foi a escolha desta entrega: o cliente envia o Bearer, a API pode ser exercida com uma ferramenta HTTP e o fluxo não depende de cookie. Ao fechar a aba, o armazenamento da sessão some. Um script executado na página pode ler essa chave.

Uma evolução posterior pode trocar o armazenamento por cookie `HttpOnly`, `Secure` e `SameSite`, com refresh ou revogação. Isso ficou fora do escopo.

## 8. Modelo de dados

Há duas tabelas, `users` e `requests`. O dicionário completo, com tipos e o que o banco garante, está em `docs/modelo-de-dados.md`.

### User

| Campo no Prisma | Coluna | Papel |
| --- | --- | --- |
| `id` | `id` | Inteiro sequencial. |
| `username` | `username` | Login, único, até 50 caracteres. |
| `name` | `name` | Nome exibido, até 120 caracteres. |
| `passwordHash` | `password_hash` | Hash bcrypt, até 255 caracteres. |
| `createdAt` | `created_at` | Inserção. |
| `updatedAt` | `updated_at` | Última escrita, preenchida pelo Prisma. |

### Request

| Campo no Prisma | Coluna | Papel |
| --- | --- | --- |
| `id` | `id` | Código exibido na listagem. |
| `title` | `title` | Título, até 120 caracteres. |
| `description` | `description` | Texto livre. |
| `category` | `category` | Enum `request_category`. |
| `status` | `status` | Enum `request_status`. Padrão `ABERTO`. |
| `requesterId` | `requester_id` | Autor. |
| `createdAt` | `created_at` | Data de abertura. |
| `updatedAt` | `updated_at` | Última escrita, preenchida pelo Prisma. |

Uma solicitação pertence a um usuário. Um usuário pode ter várias solicitações. Apagar um usuário que ainda tenha solicitação é recusado pelo banco (`ON DELETE RESTRICT`).

Categorias: `TI`, `RH`, `COMPRAS`, `FINANCEIRO`, `INFRAESTRUTURA`.

Status: `ABERTO`, `EM_ATENDIMENTO`, `CONCLUIDO`.

Índices: `username` único; `requests` por solicitante, status, categoria e `created_at`.

### Regras impostas pelo banco

A migration garante chave primária, unicidade do login, obrigatoriedade das colunas, tamanho máximo dos `varchar`, enums, chave estrangeira, padrão `ABERTO` e padrão `CURRENT_TIMESTAMP` em `created_at`. `description` é `text`, sem limite de comprimento. `updated_at` é obrigatório e não tem padrão SQL. Não há `CHECK` de tamanho mínimo nem de formato do login.

### Regras aplicadas pela API

Título de 3 a 120 caracteres e descrição de 10 a 2000, depois do trim. Categoria e status pertencentes aos enums. Autor e status inicial na criação. Autoria e status `ABERTO` para editar ou excluir. Transição de status em um passo. Senha de 8 a 72 caracteres no login. Campo extra recusado.

## 9. Regras de negócio

- Toda solicitação nova começa como `ABERTO`.
- O solicitante é o usuário do token. O corpo da criação não escolhe autor, data nem status.
- Somente o autor edita. Somente o autor exclui.
- Edição e exclusão existem apenas com status `ABERTO`.
- Qualquer usuário autenticado pode avançar o status de qualquer solicitação.
- A transição é `ABERTO` → `EM_ATENDIMENTO` → `CONCLUIDO`.
- Não se pula etapa, não se volta e não se repete o status atual.
- Solicitação em atendimento ou concluída não é editada nem excluída.
- A listagem e o detalhe são globais para quem está autenticado.
- A exclusão é física.
- Na edição e na exclusão, a API responde `404` se a solicitação não existe, `403` se o usuário não é o autor e `409` se o autor está correto e o status não é `ABERTO`. Transição inválida responde `409`.

A interface esconde edição e exclusão quando a condição não se aplica, e oferece só o próximo status. A decisão final permanece na API.

### Decisões sobre pontos indefinidos no enunciado

O enunciado deixa alguns comportamentos em aberto. As decisões abaixo valem para esta entrega.

**Quem edita ou exclui uma solicitação aberta.** O texto permite editar e excluir o que está aberto, sem dizer se isso vale para qualquer colaborador. Somente o solicitante edita ou exclui, e somente com status `ABERTO`. O autor responde pelo texto do pedido. Outro colaborador reescrever ou apagar um pedido aberto destruiria informação, e esta entrega não tem histórico.

**Quem altera o status.** Não há perfil de atendente, e o fluxo precisa sair de Aberto e chegar a Concluído. Qualquer colaborador autenticado avança o status de qualquer solicitação. A leitura da fila é comum a todos. O conteúdo do pedido continua protegido pela autoria.

**A listagem é individual ou da equipe.** A coluna Solicitante, os filtros e o dashboard não dizem se os dados são de cada pessoa ou do conjunto. Todo autenticado vê todas as solicitações, e o dashboard também é global. A coluna Solicitante existe para identificar o autor dentro dessa fila comum.

**Quais mudanças de status são válidas.** Os três status estão nomeados, sem diagrama de transição. A sequência é somente Aberto → Em Atendimento → Concluído, um passo por vez. Concluído é terminal. A sequência única acompanha a evolução até a conclusão pedida no enunciado.

**Solicitação em atendimento pode ser editada ou excluída.** O enunciado libera edição e exclusão no status Aberto. Em Atendimento ficou no meio. Nesse status não se edita e não se exclui: só se avança para Concluído. Quando o atendimento começa, o texto do pedido permanece estável.

**Como o colaborador passa a existir.** Há login e não há cadastro. Não existe endpoint de registro. Os usuários de demonstração entram pelo seed em `apps/api/prisma/seed.ts`.

**O que significa sessão e logout com JWT.** O enunciado pede controle de sessão e logout. A sessão desta entrega é o JWT, com prazo em `JWT_EXPIRES_IN` e armazenamento em `sessionStorage`. O logout remove o token no cliente. O detalhe está na seção 7.

**O que é o código da solicitação.** A listagem exige Código, sem formato. O código é o `id` inteiro gerado pelo banco e exibido na interface.

**O período filtra qual data, e em qual fuso.** O período usa somente a data de criação, que é a data de abertura da listagem. `from` e `to` são datas `YYYY-MM-DD` inclusivas, interpretadas em UTC.

**A busca textual olha só o título.** O requisito fala em texto livre pelo título. A busca olha exclusivamente o título.

**A exclusão some com o registro.** A exclusão permitida remove a linha. Não há lixeira nem relatório de excluídos, e só o autor exclui, enquanto o status é Aberto.

**O dashboard acompanha o filtro da lista.** Os quatro números são do conjunto inteiro de solicitações. Os filtros ficam na listagem. `GET /dashboard` recusa query string.

## 10. Frontend

A interface Next.js usa o App Router.

| Rota | Tela |
| --- | --- |
| `/login` | Usuário, senha e entrada. Quem já tem sessão volta à listagem. |
| `/` | Dashboard, filtros e listagem. |
| `/requests/new` | Formulário de criação. |
| `/requests/:id` | Detalhe e ações. |
| `/requests/:id/edit` | Formulário de edição, quando autor e status permitem. |

O grupo de rotas autenticadas passa por um shell que lê a sessão. Sem token, a navegação vai para `/login`. Durante a verificação, a tela mostra “Verificando sessão...”. Se `/auth/me` falha por motivo que não é `401`, a tela oferece nova tentativa.

**Dashboard.** Quatro cards: Total, Abertas, Em atendimento e Concluídas. Há estado de carregamento. Os cards não filtram a lista.

**Listagem.** Código, título, categoria, solicitante, data de abertura, status e link de detalhes. Em largura de tabela, os dados ficam em `<table>`. Em largura menor, a mesma informação aparece em cartões. A lista vazia diz “Nenhuma solicitação encontrada.” Com filtro ativo, acrescenta que nenhum resultado corresponde aos filtros atuais.

**Filtros.** Título, categoria, status, data inicial e data final. A consulta parte do botão Filtrar. Limpar filtros zera os critérios e volta à página 1. A busca não dispara a cada tecla.

**Paginação.** Página atual, total de páginas, total filtrado e botões Anterior e Próxima. O limite enviado é 20.

**Formulário.** React Hook Form com Zod. Título, descrição e categoria. O payload de criação e de edição leva só esses três campos. Erro da API aparece acima do formulário. Os botões indicam Criando... e Salvando... enquanto a ação está em curso.

**Detalhe.** Código, título, descrição, categoria, solicitante, data de abertura e status. O link Voltar fica no topo e retorna à listagem. Identificador inválido ou `404` mostra “Solicitação não encontrada”.

**Edição e exclusão.** Os botões aparecem para o autor enquanto o status é Aberto. A exclusão abre um diálogo de confirmação permanente, com cancelar. A tela de edição recusa autor diferente ou status fechado e explica o motivo.

**Status.** Aberto oferece “Colocar em atendimento”. Em atendimento oferece “Concluir solicitação”. Concluído não oferece ação. A mudança também pede confirmação.

**Erros e espera.** Falha ao carregar lista, dashboard ou detalhe mostra mensagem e tentativa de novo. Avisos de sucesso usam um parâmetro de rota (`criada`, `atualizada`, `excluida`, `status`). O layout empilha cabeçalho, filtros, ações e o diálogo em telas estreitas. O Tailwind organiza essas variações.

Zod valida a interação. A API valida de novo.

## 11. Comunicação Frontend → Backend

O cliente HTTP fica em `apps/web/src/lib/api/client.ts`. A base é `NEXT_PUBLIC_API_URL`. No exemplo, `http://localhost:3001`. O Next.js lê essa variável do `.env` da raiz quando ela ainda não está no ambiente.

O cliente envia JSON quando há corpo. Com token no `sessionStorage`, acrescenta `Authorization: Bearer`. Login é a exceção: segue sem token.

Resposta `204` não tem corpo. Resposta de erro usa a mensagem da API. Em `400`, a primeira mensagem de `details` é a exibida. Em `401` de uma chamada que enviou token, o cliente apaga o token e o provedor de autenticação redireciona para `/login`. Falha de login não apaga um token que não foi enviado. Falha de rede vira “Não foi possível conectar ao servidor.”

O TanStack Query separa as chaves de dashboard, listagem e detalhe. Depois de criar, editar ou mudar status, a interface invalida listagem, dashboard e, quando há id, o detalhe. Depois de excluir, remove o detalhe e invalida listagem e dashboard. A página não é recarregada por inteiro.

## 12. Filtros, paginação e dashboard

A listagem aceita, juntos:

- `title`: trecho do título, sem distinção de maiúsculas. `%` e `_` são texto, não curinga.
- `category`: um dos cinco valores.
- `status`: `ABERTO`, `EM_ATENDIMENTO` ou `CONCLUIDO`.
- `from` e `to`: datas `YYYY-MM-DD`.

Critério omitido não restringe. A combinação é um E. Período invertido, data inválida, enum desconhecido, página menor que 1 ou limite fora de 1 a 100 respondem `400`.

O período usa `createdAt`, em UTC:

- `from` inclui o início daquele dia (`gte`);
- `to` inclui o dia inteiro pelo limite exclusivo do dia seguinte (`lt`).

A ordem é `createdAt` descendente e, no empate, `id` descendente. `page` começa em 1. `limit` padrão é 20 e o máximo é 100. A interface pede 20. A resposta traz `meta.total` e `meta.totalPages` do conjunto filtrado. Sem resultados, `totalPages` é 0 e a tela mostra o estado vazio.

O dashboard conta no banco, por status: `total`, `open`, `inProgress` e `completed`. A soma das três situações é o total. Qualquer query string em `GET /dashboard` é recusada. Os números não seguem o filtro da lista nem o usuário logado.

## 13. Segurança

Medidas presentes nesta entrega:

- Senha armazenada com bcrypt, custo 10. A resposta pública tem `id`, `name` e `username`.
- JWT HS256. `JWT_SECRET` e `JWT_EXPIRES_IN` são obrigatórios para a API iniciar. Não há segredo fixo no código.
- Rotas de solicitação, dashboard, usuário atual e logout exigem token.
- O `sub` do token precisa corresponder a um usuário existente.
- Edição e exclusão conferem autor e status `ABERTO`.
- CORS usa `CORS_ORIGIN`, origem explícita. Valor com `*` impede a subida da API.
- Erro `500` não devolve stack ao cliente.
- O SQL passa pelo Prisma.
- `.env` está fora do versionamento. `.env.example` deixa `JWT_SECRET` vazio.

Ficaram de fora, por escopo: limite de tentativas de login, refresh token, revogação de JWT, papéis (RBAC) e cookie `HttpOnly`. O token em `sessionStorage` é a decisão registrada na seção 7.

## 14. Testes

Os testes usam o executor do Node (`node:test`), com `tsx`. São testes de unidade e de renderização estática. Não há suíte de ponta a ponta no navegador nem suíte de integração que grave no PostgreSQL. Prisma e HTTP aparecem por meio de substitutos controlados no teste.

### Backend

38 testes, em 12 grupos, em `apps/api`.

Cobrem hash bcrypt, login com senha correta, credencial inválida indistinta de usuário inexistente, JWT expirado e JWT com outro segredo, usuário removido, guard, estratégia JWT, DTO de login, criação com status aberto e autor do token, edição e exclusão por autoria e por status, transições válidas e inválidas, `404`, listagem sem descrição e sem hash, filtros combinados, período UTC, paginação, identificador inválido e dashboard sem query string.

Comando: `pnpm --filter @portal/api test`.

### Frontend

36 testes, em 11 grupos, em `apps/web`.

Cobrem schema de login, gravação e remoção do token, sessão após login e logout, `/auth/me`, cliente HTTP com e sem Bearer, `401` que encerra a sessão local, formulário de solicitação e o payload restrito, rótulos, montagem dos filtros, retorno à página 1, cards do dashboard, lista vazia, paginação, ações de autor e de status, confirmação de exclusão e invalidação das queries depois das mutações. A renderização dos componentes usa `renderToStaticMarkup`.

Comando: `pnpm --filter @portal/web test`.

Na raiz, `pnpm test` executa os dois. `pnpm lint` e `pnpm build` também existem. Este memorial não atribui percentual de cobertura.

## 15. Banco e execução

O README é o roteiro operacional. A ordem confirmada, na raiz, é:

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

`JWT_SECRET` precisa ser preenchido no `.env` antes de `pnpm dev`.

1. As dependências entram com `pnpm install`.
2. O `.env` nasce de `.env.example`, na raiz.
3. `docker compose up -d` sobe o PostgreSQL.
4. `prisma:generate` gera o cliente.
5. `prisma migrate deploy` cria enums, tabelas, índices, chave estrangeira e o status padrão.
6. `prisma:seed` grava os usuários e as solicitações de demonstração.
7. `pnpm dev` sobe o frontend em http://localhost:3000 e a API em http://localhost:3001.

O seed faz upsert dos três usuários. Se uma solicitação de demonstração já existe com o mesmo título e o mesmo autor, o seed atualiza descrição, categoria e status. Solicitações de outro título permanecem.

Usuários locais, somente para desenvolvimento e avaliação:

| Usuário | Senha | Nome |
| --- | --- | --- |
| `ana` | `dev-ana-123` | Ana Souza |
| `bruno` | `dev-bruno-123` | Bruno Lima |
| `carla` | `dev-carla-123` | Carla Mendes |

A saúde da API responde em http://localhost:3001/health.

## 16. Docker

`docker-compose.yml` declara um serviço, `postgres`, com a imagem `postgres:17-alpine`. A porta publicada usa `POSTGRES_PORT`, com padrão 5432. Usuário, senha e nome do banco vêm do `.env`, com os mesmos padrões do exemplo.

O volume `postgres_data` guarda os dados entre reinícios. `docker compose down` para o serviço e mantém esse volume. O healthcheck usa `pg_isready`.

Não há Dockerfile da API nem do frontend. Esses processos rodam com os scripts pnpm.

## 17. Justificativa técnica

Cada tecnologia abaixo registra o motivo da escolha, o benefício neste portal, uma alternativa conhecida e o efeito na manutenção ou no prazo.

### TypeScript

- **Motivo.** Frontend, API e o pacote compartilhado usam a mesma linguagem.
- **Benefício.** Categoria, status e o formato da solicitação ficam explícitos nos dois lados.
- **Alternativa.** JavaScript sem tipos compartilhados deixaria a conferência dos campos para a execução.
- **Manutenção.** Um campo divergente aparece na compilação, antes de a tela e a API seguirem contratos diferentes.

### Next.js e React

- **Motivo.** A entrega pede formulário, lista, filtro, detalhe e dashboard.
- **Benefício.** O App Router separa login, listagem, cadastro, detalhe e edição. As telas autenticadas são clientes da API.
- **Alternativa.** Uma página única sem roteador misturaria esses fluxos no mesmo arquivo.
- **Manutenção.** Cada tela fica numa rota. A regra de negócio permanece no NestJS.

### Tailwind CSS

- **Motivo.** A interface precisa de tabela na largura larga, cartões na largura estreita e estados de espera.
- **Benefício.** Essas variações ficam no próprio componente.
- **Alternativa.** Uma folha de estilo por tela aumentaria arquivos num portal com poucas páginas.
- **Manutenção.** O ajuste visual acompanha o componente.

### React Hook Form

- **Motivo.** Login, criação e edição são formulários curtos.
- **Benefício.** O retorno de campo inválido acontece antes do envio.
- **Alternativa.** Estado manual de cada input repetiria a mesma lógica nos três formulários.
- **Manutenção.** Um campo novo reaproveita o formulário já usado na criação e na edição.

### Zod

- **Motivo.** Título, descrição e categoria têm limites que a interface precisa aplicar.
- **Benefício.** O schema descreve o payload de três campos e rejeita o restante antes da API.
- **Alternativa.** Validar só no NestJS obrigaria uma ida à rede para um título vazio.
- **Manutenção.** O schema fica ao lado da tela. A API valida de novo.

### TanStack Query

- **Motivo.** Listagem, detalhe e dashboard mudam depois de criar, editar, excluir ou avançar o status.
- **Benefício.** Depois da ação, a interface invalida essas consultas e mostra o dado novo sem recarregar a página.
- **Alternativa.** `useEffect` com fetch em cada tela repetiria carregamento, erro e atualização.
- **Manutenção.** As chaves de dashboard, listagem e detalhe concentram o que precisa ser atualizado.

### NestJS

- **Motivo.** O domínio cabe em autenticação, solicitações e dashboard.
- **Benefício.** Controller, service, DTO e guard separam HTTP, regra e validação. A API funciona sem o frontend.
- **Alternativa.** Express com rotas soltas repetiria validação e autenticação em cada endpoint.
- **Manutenção.** Um recurso novo segue o mesmo módulo. A regra fica testável no service.

### REST e JSON

- **Motivo.** Os recursos do enunciado são autenticação, solicitações e dashboard.
- **Benefício.** Cada ação mapeia um verbo e um caminho. O contrato está em `docs/api.md`.
- **Alternativa.** GraphQL acrescentaria um schema para um conjunto pequeno de leituras e escritas.
- **Manutenção.** O arquivo de contrato descreve o que o frontend consome.

### class-validator

- **Motivo.** Corpo e query precisam ser rejeitados antes do service.
- **Benefício.** O `ValidationPipe` global aplica whitelist, recusa campo não previsto e devolve `details` por campo.
- **Alternativa.** Validar campo a campo dentro de cada service misturaria formato HTTP e regra de negócio.
- **Manutenção.** O limite de um campo muda no DTO. O mesmo pipe vale para todos os endpoints.

### Prisma

- **Motivo.** O acesso ao PostgreSQL precisa de modelo tipado e de criação versionada do banco.
- **Benefício.** A migration cria enums, tabelas, índices e a chave estrangeira. As consultas passam pelo cliente.
- **Alternativa.** SQL escrito em cada service deixaria o script de criação desligado das consultas.
- **Manutenção.** Mudança de coluna nasce numa migration nova. O schema é a referência do modelo.

### PostgreSQL

- **Motivo.** Usuário e solicitação pedem enum fechado, login único e solicitante obrigatório.
- **Benefício.** O banco garante chave estrangeira, unicidade e os valores de categoria e status.
- **Alternativa.** Um armazenamento sem esquema deixaria essas restrições só na API.
- **Manutenção.** A integridade permanece quando um cliente chama a API fora da interface.

### JWT

- **Motivo.** O enunciado pede sessão com prazo, e a API precisa aceitar um cliente HTTP além do navegador.
- **Benefício.** O token leva `sub` e `username`, expira por `JWT_EXPIRES_IN` e o segredo fica em `JWT_SECRET`.
- **Alternativa.** Sessão gravada no banco exigiria tabela e consulta a cada requisição.
- **Manutenção.** Prazo e segredo mudam por variável. A ausência de revogação está na seção 18.

### bcrypt

- **Motivo.** A senha do seed e a senha do login não podem ficar em texto.
- **Benefício.** A comparação usa custo 10. Credencial inválida e usuário inexistente seguem tempo próximo, por causa do hash fictício.
- **Alternativa.** Um hash rápido, sem custo, facilitaria teste de senha em massa se a base vazasse.
- **Manutenção.** O custo fica num único ponto. O teto de 72 caracteres acompanha o limite da biblioteca.

### Docker Compose

- **Motivo.** Quem avalia o projeto sobe o PostgreSQL sem instalá-lo na máquina.
- **Benefício.** Um comando sobe o Postgres 17, com volume e healthcheck. API e frontend continuam nos scripts do pnpm.
- **Alternativa.** Um banco instalado localmente varia porta, versão e usuário entre máquinas.
- **Manutenção.** A versão da imagem fica no `docker-compose.yml`. O volume preserva os dados entre reinícios.

### pnpm e Turborepo

- **Motivo.** API e frontend dividem o repositório e os comandos de desenvolvimento.
- **Benefício.** `pnpm dev`, `pnpm test`, `pnpm lint` e `pnpm build` disparam os dois apps a partir da raiz.
- **Alternativa.** Dois repositórios separados duplicariam instalação, ambiente e o roteiro do README.
- **Manutenção.** A versão do pnpm fica em `packageManager`. Um comando na raiz alcança os dois pacotes.

### Node.js, node:test e tsx

- **Motivo.** O NestJS desta entrega exige Node.js 22.12 ou superior. Os testes usam `node:test`, executado com `tsx`.
- **Benefício.** A suíte cobre regra da API e renderização da interface sem um framework de teste adicional.
- **Alternativa.** Jest acrescentaria configuração e transformação para o mesmo conjunto de testes.
- **Manutenção.** `pnpm test` na raiz executa API e frontend.

## 18. Análise crítica

### Limitações atuais

- O logout remove o token no navegador. Um JWT já emitido continua válido até expirar, porque o servidor não guarda lista de revogação.
- O token fica em `sessionStorage`. Um script executado na página pode lê-lo. A interface não renderiza HTML arbitrário e a validade configurada limita a janela.
- Há um único tipo de colaborador. Autoria e status separam editar, excluir e avançar. Não há atendente, administrador nem limite de tentativas de login.
- O status atual substitui o anterior. Não há trilha de quem mudou o status nem quando.
- Duas gravações aceitas ao mesmo tempo seguem a última commitada. Não há versão nem bloqueio.
- A proteção das rotas da interface acontece no cliente, depois do carregamento. Quem chama a API sem token recebe `401`.
- O filtro de período usa dia UTC.
- API e frontend rodam no host. O Docker Compose sobe somente o PostgreSQL. Não há CI nem deploy em nuvem.

### O que eu faria em produção

- Guardaria a sessão em cookie `HttpOnly`, `Secure` e `SameSite`, com refresh ou revogação, para o logout invalidar o token no servidor.
- Separaria solicitante e atendente se a empresa tratasse a fila como trabalho de uma área, em vez de uma lista comum a todos os colaboradores.
- Registraria histórico de status, com autor e data, antes de permitir reabertura ou auditoria.
- Publicaria API e frontend com HTTPS, limite de tentativas de login e um pipeline de teste no envio do código.
- Incluiria API e frontend no Compose, ou num ambiente equivalente, para a subida deixar de depender dos scripts do host.

### Requisitos que poderiam ser aperfeiçoados

O texto não fixava os pontos abaixo. A regra adotada em cada um está na seção 9.

- Quem pode editar e excluir: qualquer autenticado, ou só o autor.
- Quem pode mudar o status, já que não há perfil de atendente.
- Se a listagem e o dashboard são da pessoa logada ou da equipe inteira.
- Se uma solicitação em atendimento ainda pode ser alterada, e se uma concluída pode voltar.

As decisões tomadas nesses pontos estão na seção 9.

## 19. Conclusão

O Portal de Solicitações Internas implementa o fluxo pedido:

```text
autenticação
→ criação
→ consulta
→ filtros
→ acompanhamento
→ alteração de status
→ conclusão
```

A API concentra autenticação, validação, autorização e persistência. A interface cobre o mesmo fluxo, com listagem paginada e dashboard global. A estrutura do banco nasce da migration Prisma. O PostgreSQL local sobe pelo Docker Compose. API e frontend sobem com pnpm.

As escolhas de sessão, de escopo e de execução local estão neste memorial. O dicionário de dados está em `docs/modelo-de-dados.md` e o contrato HTTP está em `docs/api.md`.
