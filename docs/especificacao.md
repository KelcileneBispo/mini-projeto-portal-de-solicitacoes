# Especificação — Portal de Solicitações Internas

Fase 1: especificação. Este documento descreve o que o sistema faz. Não autoriza implementação.

## 1. Objetivo

Permitir que colaboradores autenticados registrem solicitações internas e acompanhem a evolução delas até a conclusão, em um portal web único.

O sistema concentra quatro operações: autenticar o colaborador, registrar e manter solicitações abertas, consultar a fila com filtros e enxergar um resumo quantitativo no dashboard.

## 2. Escopo

### Dentro do escopo

- Login com usuário e senha, sessão por token e logout.
- Cadastro, edição e exclusão de solicitações, com as restrições definidas em `regras-de-negocio.md`.
- Listagem com código, título, categoria, solicitante, data de abertura e status.
- Consulta de detalhes.
- Alteração de status dentro do ciclo Aberto → Em Atendimento → Concluído.
- Filtros combináveis por período, categoria, status e texto do título.
- Dashboard com quatro quantidades: total, abertas, em atendimento e concluídas.
- API REST independente do frontend, persistência em PostgreSQL e integridade no banco.
- Validação e tratamento de erros no backend.
- Interface web que consome a API.

### Fora do escopo

Perfis e permissões avançadas, notificações, histórico de alterações, anexos, comentários, recuperação de senha, cadastro público de usuários e demais itens listados em `decisoes-tecnicas.md`.

Não há tela de administração nem conceito de atendente exclusivo. Todos os colaboradores autenticados usam o mesmo conjunto de funções, com a diferença de autoria nas regras de edição e exclusão.

## 3. Usuários

Há um único tipo de usuário: o colaborador autenticado.

- Não existe visitante com acesso ao portal.
- Não existe perfil de administrador.
- O colaborador não se cadastra sozinho. As contas usadas no projeto são criadas previamente por carga inicial de desenvolvimento.
- O nome exibido como solicitante vem do cadastro do usuário. O login usa o campo usuário.

## 4. Funcionalidades

| ID | Funcionalidade | Descrição |
| --- | --- | --- |
| F01 | Autenticação | Entrar com usuário e senha, manter a sessão e sair. |
| F02 | Cadastro de solicitação | Registrar título, descrição e categoria. Data, solicitante e status inicial são definidos pelo sistema. |
| F03 | Edição | Alterar título, descrição e categoria de uma solicitação aberta do próprio autor. |
| F04 | Exclusão | Remover uma solicitação aberta do próprio autor. |
| F05 | Listagem | Ver a fila de todas as solicitações, com os campos exigidos. |
| F06 | Detalhe | Consultar uma solicitação, inclusive a descrição. |
| F07 | Status | Avançar o status no ciclo permitido. |
| F08 | Filtros | Combinar período, categoria, status e texto do título. |
| F09 | Dashboard | Ver as quatro quantidades globais. |

## 5. Requisitos funcionais

### RF01 — Login

O sistema autentica com usuário e senha. Credencial inválida não informa se o usuário existe. Senha não é armazenada em texto puro e não retorna nas respostas.

### RF02 — Sessão

Após o login, o cliente recebe um token de acesso com prazo de validade. Rotas protegidas exigem esse token. O logout encerra o uso do token no cliente. O detalhe do mecanismo está em `arquitetura.md` e `decisoes-tecnicas.md`.

### RF03 — Acesso restrito

Toda operação, exceto o login, exige colaborador autenticado. A interface também esconde as telas internas de quem não tem sessão, mas a regra é garantida pela API.

### RF04 — Criar solicitação

O colaborador informa título, descrição e categoria. O sistema grava data de criação, usuário solicitante e status inicial Aberto. O cliente não escolhe esses três valores.

Categorias aceitas: TI, RH, Compras, Financeiro e Infraestrutura.

### RF05 — Editar solicitação

É possível editar título, descrição e categoria enquanto a solicitação está aberta e pertence ao usuário autenticado. Status não é alterado por esta ação.

### RF06 — Excluir solicitação

É possível excluir uma solicitação aberta do próprio autor. A exclusão remove o registro.

### RF07 — Listar solicitações

A listagem de todos os colaboradores autenticados mostra código, título, categoria, solicitante, data de abertura e status. A ordem é da mais recente para a mais antiga.

### RF08 — Consultar detalhes

A consulta exibe os dados da listagem mais a descrição e a data da última atualização.

### RF09 — Alterar status

Qualquer colaborador autenticado pode alterar o status de qualquer solicitação, somente na sequência Aberto → Em Atendimento → Concluído. Solicitação concluída não muda mais de status.

### RF10 — Filtrar

Os filtros abaixo podem ser usados juntos. A combinação é lógica E (todos os critérios informados precisam ser atendidos).

- Período, pela data de criação, com início e fim inclusivos. Cada extremo é opcional.
- Categoria.
- Status.
- Texto livre aplicado ao título, sem distinção de maiúsculas e minúsculas, por correspondência parcial.

Sem filtros, a listagem traz as solicitações existentes, respeitando a paginação simples.

### RF11 — Dashboard

O dashboard exibe, sobre todas as solicitações do sistema:

- quantidade total;
- quantidade em Aberto;
- quantidade em Em Atendimento;
- quantidade em Concluído.

Os números não seguem os filtros da tela de listagem e não são restritos ao usuário logado.

## 6. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF01 | A API é a fonte das regras de negócio. O frontend valida para melhorar a interação, e o backend valida de novo. |
| RNF02 | A API não depende de telas específicas. Um cliente HTTP consegue exercê-la com token válido. |
| RNF03 | PostgreSQL garante tipos, obrigatoriedade, unicidade, enumeração e chave estrangeira. |
| RNF04 | Senhas são armazenadas com hash bcrypt. O token é assinado e tem expiração. |
| RNF05 | Erros de API seguem um formato único, em português, sem pilha de exceção nem segredo interno. |
| RNF06 | A stack prevista é Next.js, NestJS, Prisma, PostgreSQL, Docker Compose, pnpm e Turborepo, conforme `decisoes-tecnicas.md`. |
| RNF07 | O projeto deve permanecer compreensível em um prazo de cerca de cinco dias. Simplicidade prevalece sobre mecanismos extras. |
| RNF08 | Datas trafegam em ISO-8601 UTC. Filtro de período usa data de calendário `YYYY-MM-DD`. |
| RNF09 | A interface é em português e cobre login, dashboard, listagem, cadastro e detalhe. |
| RNF10 | Em conflito de edição simultânea, vale a última gravação aceita pelo servidor. Não há trava otimista. |

## 7. Casos de uso principais

### CU01 — Entrar no portal

- Ator: colaborador.
- Pré-condição: possui conta criada na carga inicial.
- Fluxo: informa usuário e senha; o sistema valida; o colaborador acessa o dashboard.
- Exceção: usuário ou senha incorretos; a mensagem é genérica e a sessão não é criada.
- Pós-condição: existe token válido associado ao colaborador.

### CU02 — Sair do portal

- Ator: colaborador autenticado.
- Fluxo: aciona sair; o cliente descarta o token e volta à tela de login.
- Pós-condição: as telas internas e a API protegida deixam de aceitar aquele uso da sessão.

### CU03 — Registrar solicitação

- Ator: colaborador autenticado.
- Fluxo: informa título, descrição e categoria; confirma; o sistema grava a solicitação como Aberta, no nome dele, com a data atual.
- Exceção: campo inválido ou ausente; nada é gravado.
- Pós-condição: a solicitação aparece na listagem e entra nas contagens do dashboard.

### CU04 — Editar solicitação aberta

- Ator: autor da solicitação.
- Pré-condição: status Aberto.
- Fluxo: altera título, descrição e/ou categoria; o sistema grava.
- Exceções: não é o autor; status não está aberto; dados inválidos. O conteúdo anterior permanece.
- Pós-condição: apenas os campos de conteúdo mudam. Status e autor permanecem.

### CU05 — Excluir solicitação aberta

- Ator: autor da solicitação.
- Pré-condição: status Aberto.
- Fluxo: confirma a exclusão; o sistema remove o registro.
- Exceções: não é o autor; status não está aberto; solicitação inexistente.
- Pós-condição: o registro não aparece mais na listagem nem no dashboard.

### CU06 — Consultar e filtrar

- Ator: colaborador autenticado.
- Fluxo: abre a listagem e, se quiser, combina período, categoria, status e texto do título.
- Pós-condição: a lista mostra só as solicitações que atendem a todos os filtros informados.

### CU07 — Ver detalhes

- Ator: colaborador autenticado.
- Fluxo: abre uma solicitação da lista e vê o conteúdo completo.
- Exceção: identificador inexistente.

### CU08 — Alterar status

- Ator: qualquer colaborador autenticado.
- Fluxo: avança de Aberto para Em Atendimento, ou de Em Atendimento para Concluído.
- Exceções: transição fora dessa sequência; solicitação inexistente.
- Pós-condição: o novo status vale para listagem, detalhe e dashboard. Conteúdo e autor não mudam.

### CU09 — Ver dashboard

- Ator: colaborador autenticado.
- Fluxo: abre o dashboard e vê as quatro quantidades globais.
- Pós-condição: nenhuma solicitação é alterada.

## 8. Critérios de aceite

### Autenticação

- [ ] Login com usuário e senha corretos entrega sessão e permite chamar a API.
- [ ] Login inválido retorna erro genérico, sem criar sessão.
- [ ] Recurso protegido sem token, ou com token expirado ou adulterado, é recusado.
- [ ] Logout devolve o colaborador à tela de login, e o token deixa de ser enviado.
- [ ] A resposta de autenticação e o perfil atual não contêm a senha nem o hash.

### Solicitações

- [ ] Criar com título, descrição e categoria válidos grava status Aberto, autor igual ao usuário do token e data de criação do servidor.
- [ ] Criar sem categoria válida, ou com título ou descrição fora dos limites, não grava.
- [ ] O autor edita título, descrição e categoria enquanto o status é Aberto.
- [ ] Outro colaborador não edita nem exclui essa solicitação.
- [ ] O autor não edita nem exclui solicitação Em Atendimento ou Concluída.
- [ ] Exclusão de solicitação aberta do próprio autor remove o registro de forma definitiva.
- [ ] Status só avança um passo: Aberto para Em Atendimento, depois para Concluído.
- [ ] Não é possível pular etapa, voltar status ou alterar uma solicitação concluída.
- [ ] Qualquer colaborador autenticado consegue executar uma transição válida, inclusive em solicitação de outro autor.

### Consulta e dashboard

- [ ] A listagem mostra código, título, categoria, solicitante, data de abertura e status de todas as solicitações.
- [ ] O detalhe inclui a descrição.
- [ ] Filtros de período, categoria, status e título funcionam isolados e combinados.
- [ ] O texto do título ignora maiúsculas e minúsculas e aceita trecho parcial.
- [ ] O período considera a data de criação, com as datas informadas inclusivas.
- [ ] O dashboard mostra total, abertas, em atendimento e concluídas do sistema inteiro.
- [ ] Criar, avançar status e excluir alteram as contagens de forma coerente.

### Integridade e erros

- [ ] Regra recusada pela API continua recusada mesmo se a interface for contornada.
- [ ] Erros previsíveis usam o formato único da API e mensagens em português.
- [ ] Não existe solicitação sem autor cadastrado, sem categoria válida ou sem status válido.

## 9. Rastreabilidade do enunciado

| Pedido do enunciado | Onde ficou |
| --- | --- |
| Login, sessão e logout | RF01, RF02, CU01, CU02 |
| Só autenticados acessam | RF03 |
| Campos título, descrição e categoria | RF04 |
| Categorias TI, RH, Compras, Financeiro, Infraestrutura | RF04 |
| Data, solicitante e status inicial automáticos | RF04, RN em `regras-de-negocio.md` |
| Editar e excluir solicitação aberta | RF05, RF06, com autoria definida nas regras |
| Colunas da listagem | RF07 |
| Status Aberto, Em Atendimento, Concluído | RF09 |
| Alterar status e consultar detalhes | RF08, RF09 |
| Filtros combináveis | RF10 |
| Quatro indicadores do dashboard | RF11 |
| API, persistência, validação e erros | RNF01, RNF02, RNF05 e `api.md` |
| SQL, estrutura e dicionário de dados | `modelo-de-dados.md` |
| Stack pretendida | `decisoes-tecnicas.md` |

## 10. Telas previstas

A especificação nomeia as telas para orientar a fase de interface. Layout visual não faz parte desta fase.

| Tela | Função |
| --- | --- |
| Login | Usuário, senha e entrada. |
| Dashboard | Quatro quantidades e acesso à listagem. |
| Listagem | Tabela, filtros combináveis e ação de nova solicitação. |
| Nova solicitação | Formulário de criação. |
| Detalhe | Leitura completa, edição quando permitida, exclusão quando permitida e avanço de status quando houver transição válida. |

Um indicador do dashboard pode abrir a listagem já filtrada pelo status correspondente. Isso não cria endpoint nem regra nova: reutiliza `GET /requests`.
