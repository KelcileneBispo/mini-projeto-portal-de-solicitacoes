# Regras de negócio — Portal de Solicitações Internas

Fase 1. Estas regras serão implementadas no backend. O frontend pode espelhá-las para a interface, mas não as substitui.

Valores persistidos de status: `ABERTO`, `EM_ATENDIMENTO`, `CONCLUIDO`.

Valores persistidos de categoria: `TI`, `RH`, `COMPRAS`, `FINANCEIRO`, `INFRAESTRUTURA`.

Rótulos de tela: Aberto, Em Atendimento, Concluído, TI, RH, Compras, Financeiro, Infraestrutura.

## 1. Regras adotadas

### Acesso e sessão

| ID | Regra |
| --- | --- |
| RN01 | Apenas usuários autenticados acessam recursos protegidos. A única rota pública é o login. |
| RN02 | O login exige usuário e senha. Os dois precisam corresponder ao cadastro. |
| RN03 | Usuário ou senha inválidos produzem a mesma resposta. A API não revela qual dos dois falhou nem se o usuário existe. |
| RN04 | A sessão dura 8 horas a partir da emissão do token. Depois disso o token não autentica. |
| RN05 | O logout encerra a sessão no cliente, que descarta o token. O servidor não mantém lista de tokens revogados. |
| RN06 | Não há auto-cadastro, recuperação de senha nem edição de perfil. Contas existem somente pela carga inicial. |
| RN07 | A senha é armazenada somente como hash bcrypt. Nenhuma resposta inclui senha ou hash. |
| RN08 | O usuário de login é comparado sem distinção de maiúsculas e minúsculas e gravado em minúsculas. |

### Criação

| ID | Regra |
| --- | --- |
| RN09 | Toda solicitação começa como `ABERTO`. |
| RN10 | O usuário autenticado é associado automaticamente como solicitante. O valor vem do token, não do corpo da requisição. |
| RN11 | A data de criação é definida pelo servidor no momento da gravação. |
| RN12 | O cliente não envia código, solicitante, datas nem status na criação. Campo não previsto é recusado. |
| RN13 | A categoria é obrigatória e precisa ser uma das cinco categorias fechadas. |
| RN14 | Título é obrigatório, de 3 a 120 caracteres, após remover espaços nas extremidades. |
| RN15 | Descrição é obrigatória, de 10 a 2000 caracteres, após remover espaços nas extremidades. |

### Edição e exclusão

| ID | Regra |
| --- | --- |
| RN16 | Solicitações abertas podem ser editadas somente pelo solicitante. |
| RN17 | A edição altera apenas título, descrição e categoria. Não altera status, autor, código nem data de criação. |
| RN18 | Solicitações abertas podem ser excluídas somente pelo solicitante. |
| RN19 | A exclusão é física e definitiva. Não há lixeira nem restauração. |
| RN20 | Solicitação `EM_ATENDIMENTO` não pode ser editada nem excluída. |
| RN21 | Solicitação `CONCLUIDO` não pode ser editada nem excluída. |
| RN22 | Colaborador que não é o autor recebe recusa ao editar ou excluir, mesmo que a solicitação esteja aberta. |
| RN23 | É obrigatório enviar ao menos um campo editável na alteração de conteúdo. |

### Status

| ID | Regra |
| --- | --- |
| RN24 | Qualquer usuário autenticado pode alterar o status de qualquer solicitação, inclusive a de outro autor. |
| RN25 | A única transição a partir de `ABERTO` é `EM_ATENDIMENTO`. |
| RN26 | A única transição a partir de `EM_ATENDIMENTO` é `CONCLUIDO`. |
| RN27 | `CONCLUIDO` é terminal. Não há reabertura nem novo status. |
| RN28 | Não é permitido pular de `ABERTO` para `CONCLUIDO`. |
| RN29 | Não é permitido informar o status em que a solicitação já está. |
| RN30 | A mudança de status não altera título, descrição, categoria, autor nem data de criação. |

### Consulta e dashboard

| ID | Regra |
| --- | --- |
| RN31 | Todo usuário autenticado consulta a listagem e o detalhe de todas as solicitações. |
| RN32 | Os filtros de período, categoria, status e título combinam-se com lógica E. |
| RN33 | Filtro omitido não restringe aquele critério. |
| RN34 | O texto livre incide somente no título, sem distinção de maiúsculas e minúsculas, por trecho contido. `%` e `_` digitados são literais, não curingas. |
| RN35 | O período filtra a data de criação. `from` e `to` são inclusivos. Pode-se informar só um dos dois. Se `from` for posterior a `to`, a consulta é inválida. |
| RN36 | A ordenação da listagem é fixa: data de criação decrescente e, no desempate, código decrescente. |
| RN37 | O código exibido é o identificador numérico da solicitação. |
| RN38 | O dashboard conta todas as solicitações do sistema: total, `ABERTO`, `EM_ATENDIMENTO` e `CONCLUIDO`. |
| RN39 | O dashboard não aplica os filtros da listagem e não restringe pelo usuário logado. |
| RN40 | A soma de abertas, em atendimento e concluídas é igual ao total. |

### Integridade

| ID | Regra |
| --- | --- |
| RN41 | Toda solicitação tem exatamente um solicitante existente. |
| RN42 | Usuário que possui solicitação não é removido pela aplicação. Remoção de usuário não faz parte do sistema. |
| RN43 | Em duas gravações simultâneas aceitas, prevalece a última commitada. Não há versão nem bloqueio otimista. |

## 2. Ambiguidades e decisões

Cada item abaixo estava indefinido no enunciado. A decisão foi confirmada na revisão e vale como regra para a implementação. O registro completo das confirmações está em `decisoes-tecnicas.md`.

### A1 — Quem edita ou exclui uma solicitação aberta?

1. Problema. O enunciado diz que solicitações abertas podem ser editadas e excluídas, sem dizer se isso vale para qualquer colaborador ou só para o autor.
2. Decisão. Somente o solicitante edita ou exclui, e somente enquanto o status é `ABERTO`.
3. Justificativa. No portal interno o autor responde pelo texto do pedido. Permitir que outro colaborador apague ou reescreva um pedido aberto destrói informação sem deixar histórico, e histórico está fora do escopo. A autoria já é um dado obrigatório do cadastro, então a restrição não exige perfil novo.
4. Regra adotada. RN16, RN18 e RN22.

### A2 — Quem altera o status?

1. Problema. Não há perfil de atendente nem administrador, mas o sistema precisa sair de Aberto e chegar a Concluído.
2. Decisão. Qualquer colaborador autenticado pode avançar o status de qualquer solicitação.
3. Justificativa. Criar um perfil de atendente contraria o pedido de não introduzir permissões complexas. Restringir a mudança ao autor transformaria o gerenciamento em uma atualização particular, pouco útil numa fila interna compartilhada. A leitura é comum a todos; a mudança de status também. O conteúdo continua protegido pela autoria.
4. Regra adotada. RN24.

### A3 — A listagem mostra só as solicitações do usuário ou todas?

1. Problema. O enunciado pede a coluna Solicitante, filtros globais e um dashboard com quantidades, sem dizer se os dados são individuais ou da equipe.
2. Decisão. Todo autenticado vê todas as solicitações. O dashboard também é global.
3. Justificativa. A coluna Solicitante perde função se cada pessoa só vê os próprios registros. O acompanhamento da evolução, num portal interno sem papéis distintos, é o de uma fila comum. Contagens parciais por usuário não foram pedidas.
4. Regra adotada. RN31, RN38 e RN39.

### A4 — Quais mudanças de status são válidas?

1. Problema. Os três status estão nomeados, mas não há diagrama de transição. Também não se diz se uma concluída pode voltar a aberta ou se pode ir direto ao fim.
2. Decisão. Somente Aberto → Em Atendimento → Concluído, um passo por vez. Concluída é terminal.
3. Justificativa. O texto do problema fala em evolução até a conclusão. A sequência única é fácil de implementar, testar e explicar em cinco dias. Reabertura exigiria regra extra de quem pode reabrir e o que acontece com o conteúdo congelado. Pular etapa apagaria o estado Em Atendimento, que existe para ser usado.
4. Regra adotada. RN25, RN26, RN27 e RN28.

### A5 — Solicitação em atendimento pode ser editada ou excluída?

1. Problema. O enunciado permite editar e excluir o que está aberto e, no direcionamento desta fase, registra que concluída não se edita. Em Atendimento ficou no meio.
2. Decisão. Em Atendimento não se edita e não se exclui. Só se avança para Concluído.
3. Justificativa. Quando o atendimento começa, o pedido precisa permanecer estável. Excluir nesse ponto apagaria um item já assumido pela fila. Concluída segue a mesma trava, acrescida de não mudar mais de status.
4. Regra adotada. RN20 e RN21.

### A6 — Como o colaborador passa a existir?

1. Problema. Há login e não há requisito de cadastro, convite ou integração com diretório corporativo.
2. Decisão. Não existe endpoint de cadastro. Usuários de demonstração serão inseridos pela carga inicial na fase de implementação.
3. Justificativa. Auto-cadastro abriria uma função pública não pedida e aumentaria a superfície de segurança. Diretório corporativo está fora do prazo.
4. Regra adotada. RN06.

### A7 — O que significa controle de sessão e logout com JWT?

1. Problema. O enunciado pede controle de sessão e logout, e a stack pede JWT, que é stateless. Um logout com invalidação imediata no servidor exige armazenamento extra de tokens.
2. Decisão. A sessão é o próprio JWT de 8 horas, guardado em `sessionStorage`. O logout remove o token no cliente. Não há blacklist nem refresh token.
3. Justificativa. Atende login, expiração e saída da interface sem infraestrutura adicional, dentro do prazo do projeto. A limitação — token copiado continua válido até expirar, e um script na página pode ler o `sessionStorage` — fica explícita. O endpoint `POST /auth/logout` existe para o fluxo da interface, sem revogar o token no servidor. Cookie `HttpOnly`, `Secure` e `SameSite` permanece como melhoria futura.
4. Regra adotada. RN04 e RN05.

### A8 — O que é o código da solicitação?

1. Problema. A listagem exige Código, sem formato.
2. Decisão. O código é o identificador inteiro sequencial, gerado pelo banco, visível ao usuário.
3. Justificativa. Um segundo código legível duplicaria identificadores sem requisito de máscara, ano ou prefixo.
4. Regra adotada. RN37.

### A9 — O período filtra qual data, e em qual fuso?

1. Problema. Não está dito se o período usa abertura, atualização ou conclusão, nem como tratar fuso horário.
2. Decisão. O período usa somente a data de criação. `from` e `to` são datas `YYYY-MM-DD` inclusivas, interpretadas em UTC do início do dia até o fim do dia.
3. Justificativa. A data pedida na listagem é a data de abertura, equivalente à criação. Não há data de conclusão separada. UTC evita ambiguidade entre API e banco neste projeto local. A interface deve deixar claro que o filtro é por data de abertura.
4. Regra adotada. RN35.

### A10 — A busca textual olha só o título?

1. Problema. "Texto livre pelo título" pode ser lido como busca só no título ou como busca livre que inclui o título.
2. Decisão. A busca olha exclusivamente o título.
3. Justificativa. É a leitura direta do requisito. Incluir a descrição ampliaria o comportamento e o custo da consulta sem estar pedido.
4. Regra adotada. RN34.

### A11 — Exclusão some com o registro ou apenas o oculta?

1. Problema. Excluir pode ser físico ou lógico. Não há requisito de auditoria.
2. Decisão. Exclusão física.
3. Justificativa. Não existe histórico, lixeira nem relatório de excluídos. Soft delete acrescentaria coluna e filtro obrigatório em toda consulta. Como só o autor exclui, e só enquanto está aberto, o impacto fica limitado a pedidos que ainda não entraram em atendimento.
4. Regra adotada. RN19.

### A12 — O dashboard acompanha o filtro da lista?

1. Problema. Não está dito se os números são do sistema inteiro ou do resultado filtrado.
2. Decisão. O dashboard é sempre global e independente dos filtros.
3. Justificativa. O requisito lista quatro quantidades do conjunto de solicitações, não um resumo da consulta. Filtros permanecem na listagem. Isso também mantém `GET /dashboard` simples.
4. Regra adotada. RN39.

## 3. Limites de campos usados pelas regras

| Campo | Regra |
| --- | --- |
| Usuário | Obrigatório, 3 a 50 caracteres, apenas letras minúsculas, dígitos, ponto e sublinhado, único. |
| Senha no login | Obrigatória, 8 a 72 caracteres. O teto acompanha o limite do bcrypt. |
| Nome do solicitante | Obrigatório no cadastro interno, 2 a 120 caracteres. Não é editável pela API do portal. |
| Título | RN14. |
| Descrição | RN15. |
| Categoria | RN13. |
| Status | Apenas os três valores, com RN25 a RN29. |

## 4. Matriz resumida de permissão

Não há papéis. A matriz distingue apenas autoria e status.

| Ação | Autor, Aberto | Outro, Aberto | Qualquer, Em Atendimento | Qualquer, Concluído |
| --- | --- | --- | --- | --- |
| Ver | sim | sim | sim | sim |
| Editar conteúdo | sim | não | não | não |
| Excluir | sim | não | não | não |
| Avançar status | sim, para Em Atendimento | sim, para Em Atendimento | sim, para Concluído | não |

## 5. O que a API já aplica

A Fase 2.6 aplica no backend a criação, a consulta, a edição, a exclusão física, a transição de status, os filtros da listagem e o dashboard (RN09–RN41).

Na edição e na exclusão, a API decide nesta ordem: `404` se a solicitação não existe, `403` se existe e o usuário não é o autor, `409` se o autor é o correto e o status não é `ABERTO`. A mudança de status usa `404` e, para transição inválida, `409`.

A listagem é global. Os filtros de categoria, status, título e período combinam-se antes da paginação. `page` começa em 1, `limit` vale 20 por padrão e no máximo 100, e `meta.totalPages` acompanha o total filtrado. O dashboard conta todas as solicitações, sem filtro e sem restringir pelo usuário logado.
