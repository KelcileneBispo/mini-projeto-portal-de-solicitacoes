# Decisões técnicas — Portal de Solicitações Internas

Fase 1. As escolhas abaixo servem a um portal pequeno, com API e interface separadas, em prazo de cerca de cinco dias. A justificativa está ligada a esse escopo.

## 1. Decisões da stack

### TypeScript

Frontend, backend e o pacote compartilhado usam TypeScript. Categorias, status e o formato dos recursos ficam tipados nos dois lados. Isso reduz erro de contrato durante a implementação curta, quando as mesmas entidades serão mexidas várias vezes.

### Next.js e React

O frontend é uma aplicação Next.js com React. O processo pede interface web com formulários, listagem, filtros e dashboard, e a stack prevista já aponta para esse conjunto. O App Router organiza as poucas telas do portal. As telas autenticadas são cliente da API NestJS: o Next.js não implementa regra de negócio nem acessa o banco.

### NestJS

A API fica em NestJS. O domínio se divide de forma direta em autenticação, solicitações e dashboard. Módulos, validação e guard de JWT cobrem o que o enunciado pede sem montar essa estrutura à mão. A API permanece utilizável sem o frontend.

### REST

O contrato é REST sobre HTTP JSON. Os recursos são poucos e as operações mapeiam bem para os verbos já definidos: criar, listar, detalhar, editar, excluir e mudar status. Um cliente HTTP simples consegue demonstrar o backend no processo seletivo. GraphQL ou RPC não trazem ganho para esse conjunto de telas.

### PostgreSQL

Os dados são relacionais: usuário, solicitação, categoria fechada, status fechado e integridade referencial. PostgreSQL sustenta chave estrangeira, enum, unicidade e checagem de tamanho no próprio banco. É suficiente para a fila e para as contagens do dashboard.

### Prisma

Prisma é a camada de acesso ao PostgreSQL. Entrega cliente tipado, definição da estrutura e migrations, que são o mecanismo de criação do banco pedido no enunciado. O dicionário de `modelo-de-dados.md` é a referência que o schema futuro deve seguir. Consultas parametrizadas pelo cliente evitam montar SQL com concatenação de entrada do usuário.

### JWT

A sessão é um JWT de acesso, assinado com segredo vindo de variável de ambiente, válido por 8 horas. O frontend envia `Authorization: Bearer`. A API permanece stateless, fácil de testar com ferramenta HTTP e alinhada à stack pedida. O token carrega o mínimo para identificar o usuário, e `GET /auth/me` lê o cadastro atual no banco.

Não há refresh token. A limitação assumida é que o logout não invalida um token já emitido: ele deixa de ser usado pelo cliente e expira pelo prazo. Para este portal de demonstração, isso é preferível a montar armazenamento de sessões.

O token fica em `sessionStorage`. Essa abordagem foi adotada pelo escopo e pelo prazo: o frontend envia o JWT no cabeçalho Bearer, a API pode ser exercida com um cliente HTTP e não é necessário tratar CSRF de cookie nesta entrega. A exposição é que um script executado na página pode ler o `sessionStorage`. A mitigação desta versão é não renderizar HTML arbitrário, não persistir senha e manter a validade de 8 horas.

Como melhoria futura, o token deve ir para cookie `HttpOnly`, `Secure` e `SameSite`, para que scripts da página não o leiam. Essa troca fica fora da implementação atual.

### bcrypt

Senhas da carga inicial são guardadas com hash bcrypt, com custo 10. O login compara o hash. O algoritmo é adequado ao volume deste sistema e já faz parte da stack pedida. O tamanho máximo da senha no login é 72 caracteres, compatível com o limite do bcrypt.

### React Hook Form e Zod

Os formulários de login e de solicitação têm poucos campos e regras claras de tamanho e enum. React Hook Form controla o estado dos formulários. Zod descreve a validação exibida na interface antes do envio. Essa validação não substitui class-validator na API.

### TanStack Query

Listagem, detalhe e dashboard são dados remotos que mudam depois de criar, editar, excluir ou avançar status. TanStack Query cuida do carregamento, do erro e da atualização dessas consultas depois de uma mutação. Evita espalhar estado manual de requisição pelas poucas telas.

### Docker e Docker Compose

Compose sobe o PostgreSQL de forma reproduzível e pode subir API e frontend juntos. O avaliador não depende de uma instalação manual do banco. Não há Kubernetes nem deploy em nuvem: o alvo é execução local.

### Monorepo com pnpm e Turborepo

API e frontend são dois aplicativos do mesmo projeto e compartilham os enums de categoria e status. pnpm organiza o workspace. Turborepo dispara os comandos dos pacotes sem exigir um processo de build elaborado. O pacote `packages/shared` não contém regra de negócio.

### class-validator

A validação de entrada da API fica no NestJS com class-validator, em conjunto com rejeição de campos não previstos. As mensagens expostas seguem o padrão de `api.md`. Repetir a validação no servidor é obrigatório, mesmo quando o formulário já validou.

## 2. Decisões de desenho ligadas ao prazo

| Decisão | Motivo neste projeto |
| --- | --- |
| Um único tipo de colaborador | O enunciado não define papéis. Autoria e status resolvem a diferença de permissão. |
| JWT de 8 horas, sem revogação no servidor | Atende sessão e logout da interface sem tabela de token. |
| Paginação `page` e `limit` | Impede lista sem teto. Não inclui cursor, scroll infinito nem exportação. |
| Contagem do dashboard no SQL | Quatro números não justificam carregar todas as linhas. |
| Última escrita vence | Não há requisito de edição simultânea controlada. |
| Carga inicial de usuários | Existe login e não existe cadastro. |
| Mensagens de erro em português | Os usuários da interface são colaboradores internos. |
| Identificador inteiro visível | Cumpre a coluna Código sem outro identificador. |

## 3. Decisões que NÃO serão implementadas

Itens que um portal real poderia ter e que ficam de fora porque não foram pedidos e estourariam o prazo sem melhorar o atendimento do enunciado.

| Item | Por que fica de fora |
| --- | --- |
| RBAC, administrador e perfil de atendente | Não há requisito de papéis. A matriz de autoria e status é suficiente. |
| Cadastro público, convite e integração com diretório | Só o login foi pedido. Usuários vêm da carga inicial. |
| Recuperação e troca de senha | Não há requisito e exigiria fluxo extra de identidade. |
| Refresh token e revogação imediata no servidor | Aumenta sessão e armazenamento para um ganho desnecessário nesta demonstração. |
| Notificações por e-mail ou no navegador | O acompanhamento é feito pela listagem e pelo dashboard. |
| Histórico, auditoria e trilha de status | O requisito pede o status atual, não cada mudança. |
| Anexos | Não há campo de arquivo. |
| Comentários | A descrição única cobre o conteúdo do pedido. |
| Atribuição de responsável, prioridade e SLA | Não há campos nem regras correspondentes. |
| Reabertura de solicitação concluída | O ciclo adotado termina em Concluído. |
| Soft delete e lixeira | A exclusão permitida é física e só em Aberto. |
| Paginação avançada, ordenação escolhida pelo usuário e exportação | A listagem usa página, limite e ordem fixa. |
| Busca na descrição | O texto livre foi limitado ao título. |
| Dashboard filtrado ou por usuário | As quatro quantidades são globais. |
| Edição de perfil | Nome e login não mudam pela aplicação. |
| Tempo real com WebSocket | Atualizar após cada ação e ao entrar na tela é suficiente. |
| Internacionalização e vários fusos configuráveis | A interface é em português e o filtro de data é UTC. |
| Suíte automatizada extensa | A verificação prevista desta entrega são os critérios de aceite. Testes automatizados das transições e da autoria só entram se sobrar prazo, sem mudar o contrato. |
| CI/CD, nuvem, HTTPS obrigatório e limite de taxa | O alvo é Docker local. Esses controles são de operação contínua, não do enunciado. |
| Backend dentro do Next.js | Duplicaria a API e acoplaria a regra à interface. |
| Cookie `HttpOnly`, `Secure` e `SameSite` | Melhoria futura de sessão. Nesta entrega o JWT permanece em `sessionStorage`. |

## 4. Decisões confirmadas

As decisões abaixo foram confirmadas na revisão da especificação e passam a valer para a implementação. Elas já estão refletidas nas regras de negócio, no modelo, no contrato da API e na arquitetura.

| # | Decisão confirmada |
| --- | --- |
| 1 | O autor edita e exclui apenas as próprias solicitações. |
| 2 | Edição e exclusão só são permitidas com status `ABERTO`. |
| 3 | Qualquer usuário autenticado pode alterar o status de uma solicitação. |
| 4 | O fluxo de status é `ABERTO` → `EM_ATENDIMENTO` → `CONCLUIDO`. |
| 5 | Não é permitido pular etapas nem reabrir uma solicitação concluída. |
| 6 | Solicitações em `EM_ATENDIMENTO` ou `CONCLUIDO` não podem ser editadas nem excluídas. |
| 7 | Dashboard e listagem apresentam dados globais do sistema. |
| 8 | Não haverá cadastro público de usuários. |
| 9 | Os usuários serão criados pelo seed inicial da aplicação. |
| 10 | O id inteiro da solicitação é o código de identificação. |
| 11 | A exclusão das solicitações é física. |
| 12 | O filtro por período usa a data de criação (`createdAt` na API, `created_at` no banco), em dia UTC inclusivo. |
| 13 | A listagem é paginada, com limite padrão de 20 registros e máximo de 100 por página. |
| 14 | A autenticação usa JWT com validade de 8 horas, armazenado em `sessionStorage`. Cookie `HttpOnly`, `Secure` e `SameSite` fica como melhoria futura, para reduzir a exposição do token a scripts executados no navegador. |

## 5. Ordem sugerida das próximas fases

As decisões de produto estão confirmadas. A sequência abaixo é o plano da implementação e só começa quando essa fase for solicitada.

1. Monorepo, Compose do PostgreSQL, schema e migration alinhados a `modelo-de-dados.md`, com carga inicial de dois usuários.
2. Autenticação e o padrão de erro.
3. Solicitações, incluindo autoria, edição, exclusão e transição de status.
4. Filtros e dashboard.
5. Telas que consomem o contrato.
6. README de execução local e roteiro manual dos critérios de aceite.

Cada fase deve preservar a API independente do frontend e as regras no backend.

## 6. Autenticação implementada na Fase 2.4

A Fase 2.4 ligou no backend o que já estava decidido. Não houve mudança de schema, de migration nem das decisões confirmadas na seção 4.

| Ponto | Como ficou no código |
| --- | --- |
| bcrypt | Hash com custo 10. A função `hashPassword` é a mesma no seed e na autenticação. O seed de desenvolvimento deixou de usar `scryptSync`. |
| JWT | Assinado com `JWT_SECRET`, algoritmo HS256. A validade é `JWT_EXPIRES_IN`, definida como `8h` (28800 segundos). Não há segredo nem prazo de reserva no código. Se a variável faltar ou o prazo for inválido, a API não inicia. |
| Conteúdo do token | `sub` com o id em texto, `username`, `iat` e `exp`. Sem nome, senha ou hash. |
| Armazenamento | O frontend guarda o token em `sessionStorage` e o envia em `Authorization: Bearer`. |
| Logout | `POST /auth/logout` exige token válido e responde `204`. Não invalida o JWT. Não há blacklist nem tabela de sessão: invalidar no servidor exigiria armazenamento que esta entrega não tem. O cliente remove o token. Um token copiado continua válido até expirar. |
| Usuários | Não há cadastro público, troca nem recuperação de senha. As contas de desenvolvimento vêm do seed. |
| Melhoria futura | Cookie `HttpOnly`, `Secure` e `SameSite`, para um script da página não ler o token. |
| CORS | A partir da Fase 3.1 a API aceita o navegador somente na origem de `CORS_ORIGIN`. Sem essa configuração, o frontend em `localhost:3000` não consegue chamar a API em `localhost:3001`. |

## 7. Critério para não ampliar escopo

Se uma necessidade nova aparecer durante a implementação, ela só entra se for indispensável para cumprir um requisito já numerado em `especificacao.md`. Caso contrário, permanece nesta lista de exclusões.
