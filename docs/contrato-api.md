# ObraFlow / Dokimos — Contrato inicial da API

Versão do contrato: **0.1.0**. Data: **24/10/2026**.  
Status: **especificação planejada, ainda sem endpoints implementados**.

- Contexto, entidades, permissões e user stories: [visão geral](visao-geral.md).
- Definição estruturada com schemas, segurança e exemplos de todas as operações: [OpenAPI 3.0.3](openapi.json).

Este contrato define a comunicação entre frontend e backend. A visão geral define as regras do produto; este documento e o OpenAPI formalizam seu transporte HTTP. Mudanças devem atualizar os três arquivos juntos. Os exemplos usam dados fictícios, não são evidência de execução e não contêm credenciais reais.

## 1. Convenções gerais

| Aspecto | Contrato |
|---|---|
| Prefixo | `/api/v1` |
| Documentação interativa futura | `/api/docs`; nesta entrega há apenas o arquivo OpenAPI |
| Origem no navegador | Frontend e API sob a mesma origem, com encaminhamento de `/api`; porta local será definida na infraestrutura |
| Conteúdo | `application/json; charset=utf-8`; requisições com corpo exigem `application/json` |
| Cache | Respostas da API com `Cache-Control: no-store`, incluindo sessão, token CSRF e erros |
| Correlação | `X-Request-Id` em respostas; mesmo UUID em `error.requestId` quando houver erro |
| Nomes no JSON | `camelCase`; nomes internos do banco podem usar `snake_case` |
| IDs | UUIDs; não usar o número legível do pedido como identificador de rota |
| Datas | `YYYY-MM-DD`, com validação de data real |
| Instantes | ISO 8601 em UTC, por exemplo `2026-10-24T13:00:00Z` |
| Dinheiro e quantidade | Strings decimais com ponto; nunca números JSON, notação exponencial ou separador de milhar |
| Nulos | `null` representa ausência; não usar string vazia ou zero para ausência de limite |
| Campos desconhecidos | Recusar no corpo e na query com `400 VALIDATION_ERROR` |
| Campos derivados | Cliente não envia totais, situação, autoria, role da sessão, próxima etapa ou histórico |
| Corpo máximo | 1 MiB; excesso retorna `413 PAYLOAD_TOO_LARGE` |
| Resposta de recurso | Objeto diretamente, sem envelope `data` |
| Resposta de lista | `{ "data": [...], "meta": {...} }` |
| Operação sem conteúdo | `204`, sem JSON ou corpo vazio representado como objeto |

Textos recebem trim antes da validação, exceto senha. E-mail recebe trim e normalização em minúsculas. Busca ignora diferenças de maiúsculas/minúsculas; normalização de acentos não é exigida. Objetos de entrada são fechados: enviar campos de servidor, como `requesterId` ou `total`, gera erro em vez de alterar esses dados silenciosamente.

Não há exclusão física de usuários, obras, fornecedores ou pedidos, nem troca de role, edição de pedido enviado ou mudança de responsável de uma etapa existente nesta versão.

## 2. Sessão, cookie e CSRF

### 2.1 Sessão autenticada

- Login local por e-mail e senha; senha persistida somente como hash.
- Sessão persistida no PostgreSQL; cookie contém somente identificador opaco, sem dados de usuário ou role.
- Nome do cookie: `obraflow.sid`; atributos `HttpOnly`, `SameSite=Lax`, `Path=/` e sem `Domain`.
- `Secure` obrigatório em HTTPS; desabilitado somente no ambiente HTTP local de desenvolvimento.
- Validade absoluta de **8 horas a partir do login**: atividade e consultas não renovam a expiração.
- Expiração é conferida no servidor, independentemente de o navegador ainda enviar o cookie.
- Login bem-sucedido regenera o identificador de sessão e o token CSRF, invalidando a sessão anônima anterior.
- Logout remove a sessão do banco e limpa o cookie com os mesmos atributos de caminho e domínio. Confirmar sucesso somente depois da invalidação persistida.
- A API resolve identidade e role no servidor. Não aceita `X-Demo-User-Id`, role em cabeçalho ou autoria de decisão enviada pelo cliente como mecanismos de acesso.
- O identificador da sessão não é retornado no JSON, exposto ao JavaScript nem registrado em logs.
- As respostas `401` fazem a interface encerrar o contexto autenticado e limpar os caches privados. O servidor expira o cookie inválido quando aplicável.
- Sessões são infraestrutura técnica, não novas roles ou responsabilidades do negócio. Não usar armazenamento apenas em memória como fonte de verdade.

### 2.2 Proteção CSRF e inicialização

Todas as operações `POST`, `PUT`, `PATCH` e `DELETE`, inclusive login e logout, exigem token CSRF vinculado à sessão no cabeçalho `X-CSRF-Token`. Usar padrão de token sincronizado com a sessão; comparar o valor de forma segura. Cookie `SameSite` é proteção adicional, não substitui essa verificação.

Fluxo planejado:

1. Cliente chama `GET /auth/csrf` antes do login.
2. Sem sessão autenticada, o servidor cria ou reutiliza uma sessão anônima persistida, com prazo absoluto de 15 minutos, e retorna seu token. Reutilizar não renova esse prazo.
3. Cliente envia o cookie recebido e o token no `POST /auth/login`.
4. Sucesso do login substitui a sessão anônima por sessão autenticada de 8 horas e retorna um novo token CSRF.
5. Cliente mantém o token CSRF em memória e o envia nas mutações seguintes. Após recarregar a página, pode recuperá-lo em `GET /auth/me` ou `GET /auth/csrf`.
6. Logout exige sessão e token atuais; depois, limpar dados locais e obter novo bootstrap para outro login.

Token CSRF não é credencial de autenticação. Obter `/auth/csrf` publicamente não concede acesso a recursos privados. Seu retorno contém `authenticated` para distinguir contexto anônimo de autenticado.

O navegador acessará a API pela mesma origem. Recusar origem divergente nas mutações; não habilitar CORS com credenciais para origens arbitrárias. Clientes HTTP sem `Origin` continuam obrigados a enviar cookie e token válidos. Um cliente de outra origem só poderá ser habilitado futuramente por configuração explícita.

No OpenAPI, `sessionCookie` e `csrfToken` no mesmo objeto de segurança significam que **ambos** são exigidos. No login, o cookie pode representar sessão anônima; nos endpoints privados, precisa identificar sessão autenticada.

### 2.3 Endpoints de autenticação

| Método e rota | Acesso | Entrada | Sucesso |
|---|---|---|---|
| `GET /auth/csrf` | Público técnico, mesma origem | Sem corpo | `200 Csrf`; pode enviar `Set-Cookie` anônimo |
| `POST /auth/login` | Público de negócio, com sessão anônima e CSRF | `LoginInput` | `200 Session` e `Set-Cookie` autenticado |
| `GET /auth/me` | Autenticado | Sem corpo | `200 Session` |
| `POST /auth/logout` | Autenticado e CSRF | Sem corpo | `204` e remoção do cookie |

Exemplo de login, após bootstrap:

```http
POST /api/v1/auth/login
Content-Type: application/json
Cookie: obraflow.sid=ANONYMOUS_SESSION_EXAMPLE_NOT_VALID
X-CSRF-Token: CSRF_EXAMPLE_NOT_VALID
```

```json
{
  "email": "amanda@example.test",
  "password": "SenhaFicticiaExemplo2026!"
}
```

```json
{
  "user": {
    "id": "00000000-0000-4000-8000-000000000002",
    "name": "Amanda",
    "email": "amanda@example.test",
    "role": "operator"
  },
  "expiresAt": "2026-10-24T21:00:00Z",
  "csrfToken": "ROTATED_CSRF_EXAMPLE_NOT_VALID"
}
```

Os valores de cookie e token acima são marcadores inválidos. A senha é apenas um exemplo de formato; as contas reais do seed local serão documentadas ao implementá-lo.

Credenciais incorretas retornam `401 INVALID_CREDENTIALS` com mensagem genérica, sem revelar se o e-mail existe. Login em uma sessão já autenticada retorna `409 SESSION_ALREADY_AUTHENTICATED`: sair antes de trocar de conta. Limitar o login a 10 tentativas por IP em uma janela de 15 minutos; excesso retorna `429 LOGIN_RATE_LIMITED` com `Retry-After` em segundos.

Sessão privada ausente, inválida ou expirada retorna `401 UNAUTHENTICATED`. Token CSRF ausente ou divergente retorna `403 CSRF_INVALID`; no login, sessão anônima inexistente/expirada também gera esse erro de bootstrap. Em mutações privadas, verificar autenticação antes de CSRF; o cliente não deve interpretar sessão expirada como simples erro de formulário. Novo token não autoriza repetir automaticamente uma operação de negócio.

## 3. Roles e acesso aos recursos

| Recurso/ação | Admin | Operador |
|---|---|---|
| Consultar obras e fornecedores | Sim | Sim, sem exigir responsabilidade por obra |
| Cadastrar usuários/fornecedores e criar/editar obras | Sim | Não |
| Gerir responsabilidades e configuração das alçadas | Sim | Não |
| Criar pedido em qualquer obra cadastrada | Não nesta versão | Sim, mesmo sem responsabilidade |
| Consultar pedidos e histórico | Todos | Próprios ou de cuja cadeia participa |
| Aprovar/rejeitar | Não | Somente na etapa atual atribuída à própria conta, com vínculo ativo |
| Aprovar pedido próprio | Não | Sim, com as mesmas condições de qualquer decisão |

Somente `admin` e `operator` são valores válidos de role. Responsabilidade é vínculo de Operador com obra; etapa de regra e etapa de pedido são atribuições ordenadas, não entidades Aprovador.

O acesso do Operador à leitura da cadeia permanece após a conclusão do pedido ou revogação de seu vínculo. Responsabilidade na obra, isoladamente, não libera consulta a pedidos alheios. Listas, filtros, contagens e consulta por ID devem aplicar a mesma política. Pedido inexistente ou fora do acesso de leitura retorna a mesma resposta `404 RESOURCE_NOT_FOUND`.

Nas decisões: validar identidade, acesso de leitura, role, versão esperada, situação/etapa atual e atribuição ativa, nessa ordem. Um Admin com visão global recebe `403 FORBIDDEN` se tentar decidir. Um Operador que não pode sequer consultar o pedido recebe `404`, sem detalhes sobre sua cadeia.

## 4. Paginação, filtros e formatos

Listas de usuários, obras, fornecedores, responsabilidades e pedidos usam:

```json
{
  "data": [],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 0,
    "totalPages": 0
  }
}
```

- `page`: inteiro positivo, padrão 1; `pageSize`: inteiro de 1 a 100, padrão 20.
- Página além da última retorna `data: []` com contagem real, sem ajustar silenciosamente o número solicitado.
- Query booleana aceita literalmente `true` ou `false`; número de página aceita inteiro decimal, sem frações, expoente ou conversão permissiva. Rejeitar parâmetros duplicados.
- Filtros se combinam por AND, antes da paginação; contagens nunca incluem pedidos sem acesso.
- Listas de nomes: `name ASC, id ASC`; responsabilidades: `grantedAt DESC, id ASC`; pedidos: `createdAt DESC, id ASC`.
- Datas da mesma listagem e contagens devem refletir uma visão consistente do banco. Paginação por offset não garante estabilidade entre páginas consultadas em instantes distintos.
- Regras retornam conjunto completo limitado a 50 faixas; cada cadeia aceita até 20 etapas. Não paginar a edição atômica da configuração.

### Limites e normalização

| Campo/conjunto | Limite |
|---|---|
| Nome de usuário e obra | 1 a 120 caracteres após trim |
| Nome de fornecedor | 1 a 160 caracteres após trim |
| E-mail | Até 254 caracteres, formato válido, único após normalização |
| Senha no cadastro | 12 a 128 caracteres; não aplicar trim |
| Senha no login | 1 a 128 caracteres; validação das credenciais no servidor |
| Descrição de item | 1 a 500 caracteres após trim |
| Unidade | Texto de 1 a 10 caracteres após trim; exemplos `un`, `kg`, `m`, `m²`, `m³`, `h` |
| Observações | Opcionais, até 2.000 caracteres; omissão, `null` ou somente espaços viram `null` |
| Motivo de rejeição | 1 a 1.000 caracteres após trim |
| Itens por pedido | 1 a 100 |
| Faixas por obra | 0 a 50 |
| Etapas por faixa | 1 a 20, sem repetir operador |
| Quantidade | Maior que zero e até `999999.999`; até três casas na entrada |
| Preço unitário | De `0` a `9999999999.99`; até duas casas na entrada |
| Total de item/pedido e limites de faixa | Até `9999999999999999.99`; duas casas no transporte |

Rejeitar valores acima dos limites ou precisão, sem truncamento. Quantidade pode entrar como `"2.5"` e retorna `"2.500"`; preço pode entrar como `"50"` e retorna `"50.00"`. Limites de faixa e totais já usam duas casas. Zero nunca é quantidade válida.

Armazenamento financeiro planejado: quantidade `DECIMAL(9,3)`, preço `DECIMAL(12,2)`, totais/limites `DECIMAL(18,2)`. Arredondar cada total de item em `ROUND_HALF_UP` e somar os valores arredondados; validar limite de total antes da gravação. Um conjunto de itens individualmente válido ainda pode exceder o total permitido, resultando em `400 TOTAL_LIMIT_EXCEEDED`.

## 5. Usuários, obras e fornecedores

| Método e rota | Acesso | Entrada/query | Sucesso |
|---|---|---|---|
| `GET /users` | Admin | Paginação, `role`, `search` | `200 UserPage` |
| `POST /users` | Admin + CSRF | `name`, `email`, `password`, `role` | `201 User` |
| `GET /projects` | Admin/Operador | Paginação, `search` | `200 ProjectPage` |
| `POST /projects` | Admin + CSRF | `name` | `201 Project` |
| `GET /projects/{projectId}` | Admin/Operador | UUID na rota | `200 Project` |
| `PATCH /projects/{projectId}` | Admin + CSRF | `name` obrigatório | `200 Project` |
| `GET /suppliers` | Admin/Operador | Paginação, `search` | `200 SupplierPage` |
| `POST /suppliers` | Admin + CSRF | `name` | `201 Supplier` |

Schemas e exemplos de cada resposta estão no OpenAPI. Usuário retornado contém somente `id`, `name`, `email` e `role`; nunca senha ou hash. E-mail duplicado retorna `409 EMAIL_ALREADY_EXISTS`.

Exemplo de cadastro de obra:

```json
{
  "name": "Residencial Horizonte"
}
```

Resposta `201`:

```json
{
  "id": "00000000-0000-4000-8000-000000000010",
  "name": "Residencial Horizonte",
  "rulesRevision": 0
}
```

Obra nasce sem regras e sem responsabilidades. Todas as obras cadastradas ficam disponíveis aos operadores; arquivamento não está incluído. Alterar nome da obra não modifica nomes copiados em pedidos antigos nem incrementa a revisão de regras.

Respostas `201` de projetos e pedidos enviam `Location` para seus detalhes. Usuários, fornecedores e responsabilidades retornam o identificador no corpo e não enviam `Location`, pois não há endpoint individual desses recursos nesta versão.

## 6. Responsabilidades por obra

### Consultar — `GET /projects/{projectId}/responsibilities`

Somente Admin. Query: paginação, `active` e `operatorId`; `active` omitido inclui ativos e revogados. Retorno `200 ResponsibilityPage`.

### Conceder — `POST /projects/{projectId}/responsibilities`

Somente Admin + CSRF. Corpo:

```json
{
  "operatorId": "00000000-0000-4000-8000-000000000002"
}
```

Resposta `201 Responsibility`:

```json
{
  "id": "00000000-0000-4000-8000-000000000030",
  "projectId": "00000000-0000-4000-8000-000000000010",
  "operator": {
    "id": "00000000-0000-4000-8000-000000000002",
    "name": "Amanda"
  },
  "active": true,
  "grantedBy": {
    "id": "00000000-0000-4000-8000-000000000001",
    "name": "Admin de demonstração"
  },
  "grantedAt": "2026-10-24T13:00:00Z",
  "revokedBy": null,
  "revokedAt": null
}
```

Cabeçalho `X-Rules-Revision` informa a nova revisão da obra. O destinatário precisa existir e ter role Operador; Admin não pode receber vínculo. Vínculo ativo duplicado retorna conflito. Nova concessão após revogação gera outro ID e preserva o anterior.

### Revogar — `DELETE /projects/{projectId}/responsibilities/{responsibilityId}`

Somente Admin + CSRF. Sem corpo. Sucesso `204` com `X-Rules-Revision` atual.

- Validar que o vínculo pertence à obra informada.
- Bloquear com `409 RESPONSIBILITY_IN_USE` se houver referência em qualquer regra vigente ou etapa `pending`/`waiting` de pedido pendente.
- A resposta de conflito informa contagens e até 10 IDs de faixas/pedidos impeditivos; indicar quando a lista está truncada.
- Sem impedimento, marcar inativo, registrar autor/instante e incrementar revisão uma vez, sem apagar o registro.
- Vínculo já revogado retorna `204`, sem nova alteração, evento ou incremento.
- Etapas de pedidos concluídos não impedem revogação nem perdem histórico ou acesso de leitura por causa dela.

Concessão e revogação incrementam a mesma revisão usada na edição das regras. Uma tela de configuração aberta antes dessas alterações precisará recarregar em caso de conflito.

## 7. Configuração de alçadas

### Consultar — `GET /projects/{projectId}/approval-rules`

Somente Admin. Retorno `200 Configuration` com `projectId`, `revision`, `rules` e `coverage`.

Cada regra contém `id`, `lowerExclusive`, `upperInclusive` e `steps`. Cada etapa retornada contém `id`, `position`, `responsibilityId` e o Operador identificado por `id` e `name`.

`coverage.complete` indica cobertura de todos os totais não negativos representáveis dentro do limite financeiro; `coverage.gaps` lista intervalos descobertos no mesmo formato de limites das faixas. Configuração vazia retorna `rules: []`, `complete: false` e uma lacuna com ambos os limites `null`. É um estado válido de configuração e impede criar pedidos naquela obra.

### Salvar — `PUT /projects/{projectId}/approval-rules`

Somente Admin + CSRF. Enviar o conjunto completo e a revisão lida. Exemplo após conceder duas responsabilidades, com revisão atual 2:

```json
{
  "expectedRevision": 2,
  "rules": [
    {
      "lowerExclusive": null,
      "upperInclusive": "10000.00",
      "steps": [
        { "responsibilityId": "00000000-0000-4000-8000-000000000030" }
      ]
    },
    {
      "lowerExclusive": "10000.00",
      "upperInclusive": null,
      "steps": [
        { "responsibilityId": "00000000-0000-4000-8000-000000000030" },
        { "responsibilityId": "00000000-0000-4000-8000-000000000031" }
      ]
    }
  ]
}
```

Sucesso `200 Configuration`, com revisão 3 e IDs gerados. Na edição, enviar `id` da faixa existente para preservar sua identidade. IDs de etapas da regra são internos e podem ser regenerados; a ordem do array determina posições consecutivas.

Regras de substituição:

- Faixa existente omitida é removida; `rules: []` remove todas.
- ID de faixa deve pertencer à obra e não pode se repetir no corpo; ID de outra obra ou inexistente gera `400 INVALID_RULE_ID`.
- Cada `responsibilityId` deve pertencer à mesma obra, estar ativo e apontar para Operador.
- Não aceitar posições avulsas ou `operatorId` em lugar do vínculo; não repetir operador na cadeia.
- Limite inferior exclusivo; superior inclusivo. `null` inferior inclui zero; `null` superior remove teto.
- Com ambos os limites presentes, superior precisa ser maior que inferior.
- Validar sobreposição para valores representáveis em centavos; permitir lacunas com indicação em `coverage`.
- Conferir revisão e salvar tudo em uma transação; incrementar uma vez em todo PUT aceito, inclusive sem diferenças. Em repetição com a revisão anterior, retornar conflito.
- Não alterar os pedidos existentes; regras removidas deixam `sourceRuleId` de pedidos como `null`, mantendo a cópia histórica.

`409 RULES_REVISION_CONFLICT` inclui `currentRevision`. A interface preserva o rascunho, informa conflito e permite recarregar para reconciliar; não sobrescreve nem repete o PUT automaticamente.

## 8. Cadastro de pedidos

### `POST /purchase-orders`

Somente Operador + CSRF. Responsabilidade do solicitante na obra **não é exigida**. Corpo:

```json
{
  "projectId": "00000000-0000-4000-8000-000000000010",
  "supplierId": "00000000-0000-4000-8000-000000000020",
  "orderDate": "2026-10-24",
  "notes": "Material para a etapa de fundação.",
  "items": [
    {
      "description": "Cimento",
      "quantity": "10.000",
      "unit": "un",
      "unitPrice": "50.00"
    },
    {
      "description": "Areia",
      "quantity": "2.500",
      "unit": "m³",
      "unitPrice": "200.00"
    }
  ]
}
```

Sucesso `201 Order`, com o mesmo formato completo de `GET /purchase-orders/{orderId}`, `Location` para os detalhes, total `"1000.00"`, `version: 1` e situação `pending`. Ambos os itens totalizam `"500.00"`.

O backend:

1. Deriva solicitante da sessão e valida dados/referências.
2. Calcula totais sem confiar no cliente e valida seus limites.
3. Protege a obra na transação, encontra a faixa aplicável e valida os vínculos ativos da cadeia.
4. Grava cabeçalho, itens e etapas com cópia dos nomes, limites e revisão.
5. Define a primeira etapa como `pending`, demais como `waiting`, sem aprovação automática.

Sem regra aplicável: `400 RULE_NOT_APPLICABLE`; não gravar pedido parcial. Pedido de total zero é válido somente se coberto por faixa. Obra sem responsabilidade para o solicitante não é erro; a cadeia, porém, precisa ser válida.

A referência legível terá formato `PC-000001`, com sequência atribuída no servidor, única e sem garantia de continuidade numérica. Não usar contagem de registros para gerar a referência.

Não há chave de idempotência de cadastro na primeira versão. Falha de rede após envio pode significar pedido já criado: preservar conteúdo, orientar a conferir a lista e não reenviar automaticamente.

## 9. Consulta de pedidos

### Listar — `GET /purchase-orders`

Query: `page`, `pageSize`, `projectId`, `status`, `mineOnly` e `awaitingMyDecision`.

- `status`: `pending`, `approved` ou `rejected`.
- `mineOnly=true`: apenas pedidos criados pela própria conta, restrito ao Operador.
- `awaitingMyDecision=true`: apenas pedidos pendentes cuja etapa atual pertence à própria conta, restrito ao Operador.
- Admin usando qualquer um desses dois filtros como `true` recebe `400 VALIDATION_ERROR`; Admin continua podendo filtrar obra e situação.
- Ambos os filtros podem ser usados juntos para encontrar pedidos próprios aguardando a própria decisão.
- `projectId` sem resultados retorna lista vazia, sem revelar pedidos fora do acesso.

Retorno `200 OrderSummaryPage`. Cada resumo contém:

| Campo | Conteúdo |
|---|---|
| `id`, `reference` | Identidade e número legível |
| `project`, `supplier`, `requester` | Objetos `{id, name}`; nomes históricos de obra e fornecedor |
| `orderDate`, `createdAt` | Data do pedido e instante de criação |
| `itemCount`, `total` | Quantidade de linhas e total calculado |
| `status`, `version` | Situação persistida e versão de decisão |
| `currentStepPosition` | Posição atual ou `null` se concluído |
| `steps` | Cadeia completa e limitada a 20 etapas, com situações e decisões |
| `availableActions` | Disponibilidade e explicação para a conta autenticada |

### Detalhar — `GET /purchase-orders/{orderId}`

Retorno `200 Order`: todos os campos do resumo, mais `notes`, `items`, `ruleSnapshot` e `history`. O OpenAPI contém exemplos completos de pedido pendente, aprovado e rejeitado.

Cada etapa contém `id`, `position`, `responsibilityId`, `operator`, `status`, `decidedBy`, `decidedAt` e `rejectionReason`. Antes da decisão, os três últimos são `null`. Nas etapas `skipped`, também permanecem `null`; não inventar uma rejeição ou autor para etapa não executada.

`ruleSnapshot` contém `sourceRuleId` opcional/nulo, `revision`, `lowerExclusive` e `upperInclusive` da criação. `history` é a projeção da criação e decisões persistidas, com `type`, `actor`, `occurredAt`, `stepId` e `reason`; não existe endpoint para editar esse histórico.

### Disponibilidade de ações

Exemplo quando a conta pode decidir:

```json
{
  "canApprove": true,
  "canReject": true,
  "reason": null
}
```

Quando indisponível, ambos os booleanos são falsos e `reason` é um código:

| Código | Significado |
|---|---|
| `ORDER_COMPLETED` | Pedido aprovado ou rejeitado |
| `ADMIN_READ_ONLY` | Admin acompanha, mas não decide |
| `WAITING_PREVIOUS_STEP` | Operador pertence a uma etapa futura |
| `NOT_ASSIGNED` | Operador não é o responsável atual nem aguarda etapa futura |
| `RESPONSIBILITY_INACTIVE` | Atribuição atual perdeu elegibilidade; estado defensivo que as regras de revogação devem impedir |

Precedência: pedido concluído, Admin, responsabilidade inativa do operador atual, etapa futura, ausência de atribuição; caso contrário, liberar a decisão atual. Os booleanos são conveniência para apresentação e não substituem as verificações do endpoint de decisão.

## 10. Aprovação e rejeição

### `POST /purchase-orders/{orderId}/decisions`

Somente Operador atribuído à etapa atual, com sessão e CSRF válidos. Aprovar:

```json
{
  "stepId": "00000000-0000-4000-8000-000000000060",
  "expectedVersion": 1,
  "decision": "approve"
}
```

Rejeitar:

```json
{
  "stepId": "00000000-0000-4000-8000-000000000060",
  "expectedVersion": 1,
  "decision": "reject",
  "reason": "Quantidade superior à necessidade da obra."
}
```

`reason` é obrigatório e não vazio em `reject`; é proibido em `approve`. `stepId` deve ser a etapa atual e `expectedVersion` deve corresponder à versão recebida nos detalhes. Autor e instante vêm do servidor.

Sucesso `200 Order` atualizado:

- Aprovação intermediária: etapa `approved`, próxima `pending`, pedido continua `pending`.
- Última aprovação: pedido `approved`, sem etapa atual, ações desabilitadas.
- Rejeição: etapa `rejected`, motivo persistido, futuras `skipped`, pedido `rejected`, sem etapa atual.
- Em todos os casos, incrementar `version` em 1 e incluir a decisão no histórico.

O solicitante pode ser o operador atual e aprovar manualmente a própria compra. Ter responsabilidade pela obra sem estar na etapa atual não permite decidir.

### Concorrência e repetição

Obra é bloqueada antes do pedido, na mesma ordem usada nas demais operações. Dentro da transação, conferir novamente responsabilidade ativa, versão, etapa e situação. Duas requisições concorrentes da mesma versão podem gerar somente uma transição; a outra recebe `409 ORDER_VERSION_CONFLICT`.

Se a versão estiver correta, mas o pedido já estiver concluído, retornar `409 ORDER_ALREADY_COMPLETED`. Se a etapa não for a atual, retornar `409 STEP_NOT_CURRENT`. Versão/etapa corretas com outro operador recebem `403 NOT_CURRENT_OPERATOR`; vínculo inválido recebe `403 RESPONSIBILITY_NOT_ACTIVE`.

Conflito nunca implica decisão parcial ou liberação de duas etapas. Retornar `currentVersion` e `currentStepId` apenas depois de conferir acesso ao pedido. A interface informa que o pedido mudou, recarrega lista/detalhes e não repete a decisão automaticamente.

## 11. Revisões e transações

| Controle | Alterações |
|---|---|
| `rulesRevision` da obra / `revision` na configuração | Começa em 0; incrementa em concessão, revogação efetiva e PUT de configuração aceito |
| `expectedRevision` | Valor lido na configuração, exigido no PUT; divergência retorna conflito |
| `version` do pedido | Começa em 1; incrementa a cada decisão aceita |
| `expectedVersion` | Valor lido do pedido, exigido na decisão; divergência retorna conflito |

Criação de pedido, configuração de regras e concessão/revogação seguem o mesmo protocolo de bloqueio da obra. Decisões bloqueiam obra e depois pedido. Todas as escritas de cada caso de uso participam da mesma transação; falhas desfazem a operação inteira.

Uma criação concorrente com alteração de regras captura uma configuração consistente, anterior ou posterior à alteração. Não retornar mistura de etapas de revisões diferentes. Leituras de pedido e suas etapas também usam visão consistente.

`PUT` é a substituição do conjunto, mas este contrato usa revisão obrigatória: repetir um PUT já aceito com a revisão anterior retorna conflito, em vez de aplicar outra alteração. `DELETE` de vínculo já revogado é idempotente e retorna `204`. Cadastro e decisão não são repetidos automaticamente pelo cliente.

## 12. Erros padronizados

Formato único:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Revise os campos informados.",
    "fields": [
      {
        "path": "items.0.quantity",
        "code": "POSITIVE_DECIMAL_REQUIRED",
        "message": "Informe uma quantidade maior que zero com até três casas decimais."
      }
    ],
    "details": {},
    "requestId": "00000000-0000-4000-8000-000000000900"
  }
}
```

`code` orienta o comportamento do cliente; `message` e mensagens de campo são legíveis e podem evoluir sem mudar o significado do código. `fields` sempre é array, vazio quando não houver erros de campo; `details` sempre é objeto; `requestId` é um UUID de correlação gerado no servidor. Não incluir stack traces, SQL, cookies, hashes, senhas ou tokens nos erros.

| HTTP | `error.code` | Uso |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Corpo/query inválidos, campo extra, tipo, formato, limite ou campo obrigatório |
| 400 | `INVALID_OPERATOR_ROLE` | Responsabilidade atribuída a usuário que não é Operador |
| 400 | `RESPONSIBILITY_PROJECT_MISMATCH` | Vínculo de outra obra em uma etapa de regra |
| 400 | `RESPONSIBILITY_NOT_ACTIVE` | Vínculo inativo escolhido na configuração |
| 400 | `INVALID_RULE_ID` | ID de faixa inexistente, duplicado ou de outra obra no PUT |
| 400 | `RULE_RANGE_OVERLAP` | Faixas sobrepostas |
| 400 | `RULE_CHAIN_DUPLICATE_OPERATOR` | Mesmo operador repetido na faixa |
| 400 | `RULE_NOT_APPLICABLE` | Total sem cobertura; nenhuma gravação parcial |
| 400 | `TOTAL_LIMIT_EXCEEDED` | Total calculado ultrapassa a precisão suportada |
| 401 | `INVALID_CREDENTIALS` | Login inválido, sem revelar existência da conta |
| 401 | `UNAUTHENTICATED` | Sessão privada ausente, inválida ou expirada |
| 403 | `FORBIDDEN` | Role não permite a operação ou origem não autorizada |
| 403 | `CSRF_INVALID` | Token/sessão de bootstrap inválidos em mutação |
| 403 | `NOT_CURRENT_OPERATOR` | Conta não é o responsável da etapa atual |
| 403 | `RESPONSIBILITY_NOT_ACTIVE` | Operador atual sem vínculo ativo para decidir |
| 404 | `RESOURCE_NOT_FOUND` | Recurso inexistente, referência inexistente ou pedido sem acesso de leitura |
| 409 | `EMAIL_ALREADY_EXISTS` | E-mail normalizado já cadastrado |
| 409 | `RESPONSIBILITY_ALREADY_ACTIVE` | Vínculo ativo duplicado |
| 409 | `RESPONSIBILITY_IN_USE` | Regras ou etapas pendentes/futuras impedem revogação |
| 409 | `RULES_REVISION_CONFLICT` | Configuração alterada desde sua leitura |
| 409 | `ORDER_VERSION_CONFLICT` | Pedido alterado desde sua leitura |
| 409 | `ORDER_ALREADY_COMPLETED` | Pedido concluído não aceita nova decisão |
| 409 | `STEP_NOT_CURRENT` | Etapa informada não é a etapa atual |
| 409 | `SESSION_ALREADY_AUTHENTICATED` | Sair antes de entrar com outra conta |
| 413 | `PAYLOAD_TOO_LARGE` | Corpo acima de 1 MiB |
| 415 | `UNSUPPORTED_MEDIA_TYPE` | Corpo não enviado como JSON |
| 429 | `LOGIN_RATE_LIMITED` | Limite de tentativas de login |
| 500 | `INTERNAL_ERROR` | Falha inesperada com mensagem segura |

Referências inexistentes a obras, fornecedores, operadores ou responsabilidades geram `404`; vínculos existentes porém inelegíveis geram os erros específicos acima. IDs devem pertencer ao contexto da rota.

### Detalhes de conflitos

- `RULES_REVISION_CONFLICT`: `{ "currentRevision": 4 }`.
- `ORDER_VERSION_CONFLICT` / `STEP_NOT_CURRENT` / `ORDER_ALREADY_COMPLETED`: `{ "currentVersion": 2, "currentStepId": null }`, ou UUID da etapa atual quando houver.
- `RESPONSIBILITY_IN_USE`: `{ "ruleCount": 1, "pendingOrderCount": 2, "ruleIds": [...], "orderIds": [...], "truncated": false }`; arrays limitados a 10 IDs cada, contagens completas.
- Validações de faixas e etapas indicam caminhos como `rules.1.lowerExclusive` ou `rules.0.steps.1.responsibilityId` em `fields`.

## 13. Consumo pelo frontend

- Cliente HTTP único envia cookie de sessão e adiciona o token CSRF às mutações.
- Login e `/auth/me` inicializam identidade, role, expiração e token; nunca guardar identificador de sessão em `localStorage`.
- Listas e detalhes ficam no TanStack Query. Chaves e cache devem distinguir contexto de usuário; ao sair, remover dados privados.
- `401`: encerrar contexto autenticado e apresentar login, preservando somente conteúdo que não exponha dados a outra conta.
- `403`: explicar falta de permissão; se CSRF inválido, permitir recuperar contexto sem repetir automaticamente a mutação.
- `404`: apresentar recurso indisponível sem expor sua existência a conta não autorizada.
- `409`: preservar rascunho quando aplicável, informar conflito e recarregar recurso para revisão manual.
- Erro de lista não é estado vazio; incluir nova tentativa.
- Após cadastro ou decisão aceita, atualizar/inutilizar consultas afetadas e usar a resposta persistida para exibir totais e etapas.
- Falha de rede em mutação tem resultado potencialmente incerto; não configurar tentativas automáticas para cadastro, configuração ou decisão.
- Dados e ações no frontend são apresentação; todas as validações e permissões são executadas novamente na API.

## 14. Rastreabilidade e validação da implementação

| User stories | Operações principais |
|---|---|
| US-01 | Bootstrap CSRF, login, sessão e logout |
| US-02, US-03 | Criação de pedido com itens, cálculo e escolha da faixa |
| US-04, US-05, US-08 | Lista/detalhes, política de leitura e disponibilidade de ações |
| US-06, US-07, US-11, US-16 | Decisão, aprovação própria, rejeição e concorrência |
| US-09, US-10 | Consulta/substituição de faixas e etapas atribuídas |
| US-14, US-15 | Gestão de obras e responsabilidades |
| US-12, US-13 | Erros, execução local, seed e exemplos de consumo |

Critérios para validar a implementação contra o contrato:

1. Schemas e exemplos válidos; respostas não expõem campos privados.
2. Cookies, expiração absoluta, regeneração, CSRF, logout e limite de login exercitados por HTTP.
3. Admin e Operador têm permissões distintas, inclusive em chamadas manuais e consultas por ID.
4. Operador cria sem vínculo; aprovação própria só funciona na etapa atual atribuída.
5. Faixas, responsabilidades e revisões respeitam o mesmo protocolo transacional.
6. Concorrência de decisões testada com conexões independentes no PostgreSQL real.
7. Remoção de regra e revogação permitida preservam nomes, valores e decisões históricas.
8. Frontend diferencia erros de campo, sessão, permissão, conflito e indisponibilidade.

Validar o arquivo OpenAPI e seus exemplos não comprova nenhum desses comportamentos em execução. A API ainda precisa ser implementada e testada.

## 15. Referências

- [NestJS — proteção CSRF](https://docs.nestjs.com/security/csrf)
- [Express Session — persistência, cookie e ciclo de sessão](https://github.com/expressjs/session)
- [OpenAPI 3.0.3 — especificação](https://spec.openapis.org/oas/v3.0.3.html)

Os mecanismos observáveis definidos aqui devem ser preservados independentemente da biblioteca escolhida para sessão e token CSRF. Fixar versões compatíveis e um store PostgreSQL antes da implementação.
