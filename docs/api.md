# Contrato da API — Portal de Solicitações Internas

Contrato REST. Na Fase 2.4 foram implementados os endpoints de autenticação. Na Fase 2.5 foram implementados os endpoints de solicitações. Na Fase 2.6 a listagem passou a aceitar filtros combináveis e paginação completa, e `GET /dashboard` passou a devolver os totais globais.

Base local prevista: `http://localhost:3001`. O navegador só é aceito a partir da origem em `CORS_ORIGIN`. Não há origem curinga.

Formato: JSON, UTF-8. Datas de resposta em ISO-8601 UTC. Nomes de campos JSON em camelCase.

Rotas protegidas exigem:

```http
Authorization: Bearer <token>
```

Ausência, adulteração ou expiração do token respondem `401` antes da regra de negócio.

## 1. Convenções

### Recursos

| Recurso | Significado |
| --- | --- |
| Auth | Sessão do colaborador. |
| Requests | Solicitações internas. |
| Dashboard | Contagens globais. |

### Enums em JSON

Categoria: `TI`, `RH`, `COMPRAS`, `FINANCEIRO`, `INFRAESTRUTURA`.

Status: `ABERTO`, `EM_ATENDIMENTO`, `CONCLUIDO`.

### Paginação da listagem

| Query | Regra | Padrão |
| --- | --- | --- |
| `page` | Inteiro maior ou igual a 1. | `1` |
| `limit` | Inteiro de 1 a 100. | `20` |

### Solicitação completa

Usada em criação, detalhe, edição e mudança de status.

```json
{
  "id": 15,
  "title": "Acesso à VPN",
  "description": "Preciso de acesso à VPN para o trabalho remoto desta semana.",
  "category": "TI",
  "status": "ABERTO",
  "createdAt": "2026-09-29T17:00:00.000Z",
  "updatedAt": "2026-09-29T17:00:00.000Z",
  "requester": {
    "id": 1,
    "name": "Ana Souza",
    "username": "ana.souza"
  }
}
```

### Item de listagem

A lista omite a descrição, que permanece no detalhe.

```json
{
  "id": 15,
  "title": "Acesso à VPN",
  "category": "TI",
  "status": "ABERTO",
  "createdAt": "2026-09-29T17:00:00.000Z",
  "requester": {
    "id": 1,
    "name": "Ana Souza",
    "username": "ana.souza"
  }
}
```

### Usuário público

```json
{
  "id": 1,
  "name": "Ana Souza",
  "username": "ana.souza"
}
```

Nunca inclui `password` nem `passwordHash`.

## 2. Padrão de erro

Toda resposta de erro tem o mesmo formato.

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Dados inválidos",
  "details": [
    {
      "field": "title",
      "message": "Título deve ter entre 3 e 120 caracteres"
    }
  ]
}
```

| Campo | Uso |
| --- | --- |
| `statusCode` | Mesmo código HTTP da resposta. |
| `error` | Nome curto do status HTTP. |
| `message` | Texto em português, seguro para exibir. |
| `details` | Presente apenas em erro de validação de campos. Cada item tem `field` e `message`. |

Não há stack trace, SQL nem nome de variável interna no corpo.

| HTTP | Quando |
| --- | --- |
| 400 | Corpo, query ou parâmetro inválido, inclusive tipo, enum, período invertido e campo não permitido. |
| 401 | Credencial inválida, token ausente, token inválido ou token expirado. |
| 403 | Autenticado, porém não é o autor na edição ou na exclusão. |
| 404 | Solicitação não encontrada. |
| 409 | Operação incompatível com o status atual ou transição inválida. |
| 500 | Falha inesperada. Mensagem fixa: "Erro interno do servidor". |

Lista vazia e dashboard zerado são sucesso, não erro.

## 3. Auth

### POST /auth/login

| Item | Definição |
| --- | --- |
| Objetivo | Autenticar o colaborador e emitir o token. |
| Autenticação | Não. |
| Parâmetros de rota | Nenhum. |
| Query | Nenhuma. |

Body:

```json
{
  "username": "ana.souza",
  "password": "senha-valida"
}
```

| Campo | Regra |
| --- | --- |
| `username` | Obrigatório, texto de 3 a 50 caracteres depois do trim. A comparação ignora maiúsculas e minúsculas. |
| `password` | Obrigatória, 8 a 72 caracteres. |

Resposta `200`:

```json
{
  "accessToken": "<jwt>",
  "tokenType": "Bearer",
  "expiresIn": 28800,
  "user": {
    "id": 1,
    "name": "Ana Souza",
    "username": "ana.souza"
  }
}
```

`expiresIn` é a validade em segundos. O valor adotado é 28800, equivalentes a 8 horas.

O JWT contém `sub` com o id do usuário em texto, `username`, `iat` e `exp`. Não contém nome, senha nem permissão. A API usa `sub` para identificar o solicitante. Nome e demais dados públicos vêm do banco em `GET /auth/me` e nas solicitações.

Os exemplos de usuário ilustram o formato do recurso. A carga de desenvolvimento usa os usernames `ana`, `bruno` e `carla`. As senhas dessa carga não fazem parte deste contrato.

Erros:

| HTTP | Situação |
| --- | --- |
| 400 | Campo ausente ou fora do formato. Corpo no padrão de erro, com `details`. |
| 401 | Usuário inexistente ou senha incorreta. A mensagem é a mesma nos dois casos. |

```json
{
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Usuário ou senha inválidos"
}
```

### POST /auth/logout

| Item | Definição |
| --- | --- |
| Objetivo | Apoiar a saída da interface. O cliente descarta o token do `sessionStorage` depois da chamada, mesmo se esta requisição falhar. O servidor não revoga o JWT: não há blacklist nem tabela de sessão, porque o token é stateless e expira em 8 horas. |
| Autenticação | Sim. |
| Parâmetros de rota | Nenhum. |
| Query | Nenhuma. |
| Body | Vazio. |

Resposta `204` sem corpo.

Erros:

| HTTP | Situação |
| --- | --- |
| 401 | Token ausente, inválido ou expirado. Mensagem: "Não autenticado". |

Se o logout HTTP falhar, o frontend ainda assim remove o token local.

### GET /auth/me

| Item | Definição |
| --- | --- |
| Objetivo | Retornar o colaborador do token atual. |
| Autenticação | Sim. |
| Parâmetros de rota | Nenhum. |
| Query | Nenhuma. |
| Body | Nenhum. |

Resposta `200`: objeto de usuário público.

Erros:

| HTTP | Situação |
| --- | --- |
| 401 | Token ausente, inválido ou expirado. Mensagem: "Não autenticado". |
| 401 | Usuário do token não existe mais. A mensagem também é "Não autenticado". |

```json
{
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Não autenticado"
}
```

## 4. Requests

### POST /requests

| Item | Definição |
| --- | --- |
| Objetivo | Criar solicitação aberta para o usuário autenticado. |
| Autenticação | Sim. |
| Parâmetros de rota | Nenhum. |
| Query | Nenhuma. |

Body:

```json
{
  "title": "Acesso à VPN",
  "description": "Preciso de acesso à VPN para o trabalho remoto desta semana.",
  "category": "TI"
}
```

| Campo | Regra |
| --- | --- |
| `title` | Obrigatório. De 3 a 120 caracteres depois do trim. |
| `description` | Obrigatória. De 10 a 2000 caracteres depois do trim. |
| `category` | Obrigatória. Um dos enums de categoria. |

Qualquer outro campo, em especial `status`, `requesterId`, `createdAt` e `id`, produz `400`.

Resposta `201`: solicitação completa. `status` é `ABERTO`. `requester` é o usuário do token. `createdAt` é definida pelo servidor.

Erros:

| HTTP | Situação |
| --- | --- |
| 400 | Validação ou campo não permitido. |
| 401 | Não autenticado. |

### GET /requests

| Item | Definição |
| --- | --- |
| Objetivo | Listar solicitações de todos os autores, com filtros combinados por E e paginação simples. |
| Autenticação | Sim. |
| Parâmetros de rota | Nenhum. |
| Body | Nenhum. |

Query:

| Query | Regra |
| --- | --- |
| `page` | Opcional. Inteiro maior ou igual a 1. Padrão `1`. |
| `limit` | Opcional. Inteiro de 1 a 100. Padrão `20`. |
| `category` | Opcional. Enum de categoria. |
| `status` | Opcional. Enum de status. |
| `title` | Opcional. Trecho do título, até 120 caracteres, sem distinção de maiúsculas e minúsculas. Vazio ou só espaços é ignorado. |
| `from` | Opcional. Data `YYYY-MM-DD` em UTC. Inclusivo: `createdAt` a partir do início desse dia. |
| `to` | Opcional. Data `YYYY-MM-DD` em UTC. Inclusivo no dia inteiro: `createdAt` anterior ao início do dia seguinte. |

Exemplo:

```http
GET /requests?status=ABERTO&category=TI&title=vpn&from=2026-09-01&to=2026-09-30&page=1&limit=20
```

Resposta `200`:

```json
{
  "data": [
    {
      "id": 15,
      "title": "Acesso à VPN",
      "category": "TI",
      "status": "ABERTO",
      "createdAt": "2026-09-29T17:00:00.000Z",
      "requester": {
        "id": 1,
        "name": "Ana Souza",
        "username": "ana.souza"
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

Os filtros enviados valem ao mesmo tempo. Omitir um filtro não restringe aquele critério. A consulta aplica os filtros no banco, conta o total filtrado e só então ordena e recorta a página.

`total` é a quantidade que atende aos filtros, não o total da tabela. `totalPages` é o teto de `total / limit`. Sem registros, `totalPages` é `0`. Com 45 registros e `limit` 20, `totalPages` é `3`.

`data` vem ordenado por `createdAt` decrescente e `id` decrescente. Sem resultados, ou com `page` além da última página, a resposta continua `200`, com `data` vazio e o `total` filtrado.

`title` busca um trecho do título, sem distinção de maiúsculas e minúsculas. Não busca na descrição. `%` e `_` são texto literal. Título vazio ou só com espaços é ignorado.

`from` e `to` usam `createdAt` em UTC e aceitam somente `YYYY-MM-DD`. `from=2026-09-01` inclui qualquer horário de 01/09/2026. `to=2026-09-30` inclui qualquer horário de 30/09/2026, porque o limite superior é o início de 01/10/2026, não o início do próprio dia 30. Pode-se informar só um dos dois. Data inexistente, formato diferente ou `from` posterior a `to` retornam `400`.

Erros:

| HTTP | Situação |
| --- | --- |
| 400 | Paginação, enum, data ou período com `from` posterior a `to`. |
| 401 | Não autenticado. |

### GET /requests/:id

| Item | Definição |
| --- | --- |
| Objetivo | Consultar o detalhe de uma solicitação. |
| Autenticação | Sim. |
| Parâmetros de rota | `id`: inteiro positivo. |
| Query | Nenhuma. |
| Body | Nenhum. |

Resposta `200`: solicitação completa.

Erros:

| HTTP | Situação |
| --- | --- |
| 400 | `id` não é inteiro positivo. |
| 401 | Não autenticado. |
| 404 | Não existe solicitação com esse `id`. Mensagem: "Solicitação não encontrada". |

### PATCH /requests/:id

| Item | Definição |
| --- | --- |
| Objetivo | Editar conteúdo de solicitação aberta do próprio autor. |
| Autenticação | Sim. |
| Parâmetros de rota | `id`: inteiro positivo. |
| Query | Nenhuma. |

Body: ao menos um dos campos abaixo.

```json
{
  "title": "Acesso à VPN corporativa",
  "description": "Preciso de acesso à VPN corporativa até sexta-feira.",
  "category": "INFRAESTRUTURA"
}
```

| Campo | Regra |
| --- | --- |
| `title` | Opcional. Se enviado, de 3 a 120 caracteres depois do trim. |
| `description` | Opcional. Se enviada, de 10 a 2000 caracteres depois do trim. |
| `category` | Opcional. Se enviada, enum de categoria. |

Campo fora dessa lista, ou corpo sem nenhum campo editável, produz `400`.

Resposta `200`: solicitação completa. `status`, `requester` e `createdAt` permanecem. `updatedAt` muda.

Erros:

| HTTP | Situação |
| --- | --- |
| 400 | `id`, corpo ou campos inválidos. |
| 401 | Não autenticado. |
| 403 | Autenticado, mas não é o autor. Mensagem: "Você só pode alterar suas próprias solicitações". |
| 404 | Solicitação não encontrada. |
| 409 | Status diferente de `ABERTO`. Mensagem: "Apenas solicitações abertas podem ser editadas". |

A checagem de existência acontece de forma que uma solicitação inexistente não seja confundida com falta de autoria: `404` se não existe; `403` se existe e o autor é outro; `409` se o autor é o correto e o status não permite edição.

### DELETE /requests/:id

| Item | Definição |
| --- | --- |
| Objetivo | Excluir fisicamente solicitação aberta do próprio autor. |
| Autenticação | Sim. |
| Parâmetros de rota | `id`: inteiro positivo. |
| Query | Nenhuma. |
| Body | Nenhum. |

Resposta `204` sem corpo.

Erros:

| HTTP | Situação |
| --- | --- |
| 400 | `id` inválido. |
| 401 | Não autenticado. |
| 403 | Não é o autor. Mensagem: "Você só pode excluir suas próprias solicitações". |
| 404 | Solicitação não encontrada. |
| 409 | Status diferente de `ABERTO`. Mensagem: "Apenas solicitações abertas podem ser excluídas". |

A ordem de decisão é a mesma da edição: `404`, depois `403`, depois `409`.

### PATCH /requests/:id/status

| Item | Definição |
| --- | --- |
| Objetivo | Avançar o status uma etapa. |
| Autenticação | Sim. Qualquer colaborador autenticado, autor ou não. |
| Parâmetros de rota | `id`: inteiro positivo. |
| Query | Nenhuma. |

Body:

```json
{
  "status": "EM_ATENDIMENTO"
}
```

| Campo | Regra |
| --- | --- |
| `status` | Obrigatório. Enum de status. Precisa ser exatamente a próxima etapa permitida. |

Outro campo no corpo produz `400`.

Transições aceitas:

| Status atual | Status aceito |
| --- | --- |
| `ABERTO` | `EM_ATENDIMENTO` |
| `EM_ATENDIMENTO` | `CONCLUIDO` |
| `CONCLUIDO` | nenhum |

Resposta `200`: solicitação completa, com o novo status e `updatedAt` atualizado.

Erros:

| HTTP | Situação |
| --- | --- |
| 400 | `id` inválido, `status` ausente, enum inválido ou campo extra. |
| 401 | Não autenticado. |
| 404 | Solicitação não encontrada. |
| 409 | Transição fora da tabela, inclusive mesmo status ou solicitação concluída. Mensagem: "Transição de status não permitida". |

## 5. Dashboard

### GET /dashboard

| Item | Definição |
| --- | --- |
| Objetivo | Retornar as quatro quantidades globais. |
| Autenticação | Sim. |
| Parâmetros de rota | Nenhum. |
| Query | Nenhuma. Não aceita filtro. |
| Body | Nenhum. |

Resposta `200`:

```json
{
  "total": 10,
  "open": 4,
  "inProgress": 3,
  "completed": 3
}
```

| Campo | Conta |
| --- | --- |
| `total` | Todas as solicitações. |
| `open` | `ABERTO`. |
| `inProgress` | `EM_ATENDIMENTO`. |
| `completed` | `CONCLUIDO`. |

Com a base vazia, os quatro valores são `0`.

Erros:

| HTTP | Situação |
| --- | --- |
| 400 | Qualquer parâmetro de query. O dashboard não aceita filtro, página nem limite. |
| 401 | Não autenticado. |

Os totais são globais. Não dependem de `GET /requests` nem do usuário autenticado. `open`, `inProgress` e `completed` somam `total`.

## 6. Mapa rápido

| Método | Rota | Auth | Sucesso |
| --- | --- | --- | --- |
| POST | `/auth/login` | não | 200 |
| POST | `/auth/logout` | sim | 204 |
| GET | `/auth/me` | sim | 200 |
| POST | `/requests` | sim | 201 |
| GET | `/requests` | sim | 200 |
| GET | `/requests/:id` | sim | 200 |
| PATCH | `/requests/:id` | sim | 200 |
| DELETE | `/requests/:id` | sim | 204 |
| PATCH | `/requests/:id/status` | sim | 200 |
| GET | `/dashboard` | sim | 200 |

Não há outros endpoints neste contrato.
