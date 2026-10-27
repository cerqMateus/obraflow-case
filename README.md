![Banner do desafio ObraFlow](assets/banner.png)

# Desafio Full-stack — ObraFlow

## Execução local — SPEC-001 a SPEC-007

Este incremento implementa infraestrutura, schema do domínio, migrations, seed base, base HTTP estrita, autenticação por sessão PostgreSQL e testes isolados com banco real. A SPEC-005 adiciona login, recuperação de sessão, logout e shell responsivo. A SPEC-006 adiciona oito operações de cadastros por API e administração de obras em `/admin/obras`, com busca paginada, cadastro, detalhe e edição de nome. A SPEC-007 acrescenta listagem, concessão e revogação de responsáveis dentro da obra, com histórico e impedimentos por regras/pedidos. Compras e configuração de alçadas continuam para os próximos marcos. Evidências e limitações estão nos registros das specs. O enunciado original permanece abaixo.

Requisitos: Docker Engine/Desktop com containers Linux e Docker Compose **2.24.4 ou superior** (overlay usa `!override`). Não é necessário instalar Node, pnpm ou PostgreSQL no host. A primeira execução baixa imagens e pacotes pela internet.

Na raiz do repositório, PowerShell:

```powershell
docker run --rm --mount "type=bind,source=$((Get-Location).Path),target=/workspace" -w /workspace node:24.18.1-bookworm-slim node scripts/init-env.mjs
docker compose config --quiet
docker compose up --build -d
```

Em Bash, a primeira linha usa `--mount "type=bind,source=$(pwd),target=/workspace"`; os demais argumentos e comandos são os mesmos. O script copia `.env.example` para `.env`, substitui os dois placeholders por valores criptograficamente aleatórios e recusa sobrescrever arquivo existente. Não publique `.env` nem o remova a cada reinício. `SESSION_SECRET` assina o cookie de sessão e precisa permanecer estável para preservar sessões entre reinícios.

Abra [ObraFlow local](http://localhost:8080). A rota técnica [backend e banco](http://localhost:8080/api/technical-status), que retorna `{"status":"ok"}` somente após consultar o PostgreSQL e confirmar todas as migrations da imagem. Esta rota temporária não é operação de negócio. `/health/live` e `/health/ready` ficam internos. Caminhos `/api` desconhecidos chegam ao Nest e retornam erro JSON, sem receber o HTML da SPA. Rotas de negócio futuras usam `/api/v1`.

O [Swagger local](http://localhost:8080/api/docs/) serve o contrato completo, com envio de requisições desabilitado. O arquivo está em `/api/docs/openapi.json`. Das 21 operações descritas, 15 estão implementadas: quatro de autenticação, oito de usuários, obras e fornecedores e três de responsabilidades. Saúde e documentação não consultam dados de negócio.

Somente `127.0.0.1:8080` é publicado. Backend (3000) e PostgreSQL (5432) ficam na rede Compose. Altere `HTTP_PORT` e `APP_ORIGIN` juntos no `.env` para usar outra porta. O serviço `migrate` aplica migrations após o banco saudável; o backend aguarda seu sucesso e o frontend aguarda a prontidão real do backend. Nginx acompanha mudanças do endereço do backend pelo DNS interno do Docker, inclusive após recriação do container. Falha de migration impede a inicialização do backend. Não há reset nem seed automático.

```powershell
docker compose ps
docker compose restart
docker compose down
docker compose up -d
```

`down` sem `--volumes` preserva o volume `obraflow_postgres-data` e `/var/lib/postgresql/data`. Não use `down --volumes` se precisa conservar o banco. Migrations reaplicadas não alteram os dados existentes nem executam seed.

### Migrations e contas fictícias

```powershell
docker compose --profile tools build backend-tools
docker compose --profile tools run --rm backend-tools pnpm run db:generate
docker compose --profile tools run --rm backend-tools pnpm run db:migrate
docker compose --profile tools run --rm backend-tools pnpm run db:seed:base
```

O build já gera o cliente Prisma e `up` já aplica migrations; os comandos explícitos acima também estão disponíveis. `db:migrate` usa somente migrations versionadas, sem reset. O seed base cria quatro contas e dois fornecedores fictícios; não cria obras, vínculos, regras nem pedidos. Repetição preserva hashes e dados; divergência de cadastro causa erro e rollback. Não é um comando para restaurar contas modificadas.

Contas locais de demonstração: `admin@demo.obraflow.test`, `amanda@demo.obraflow.test`, `joao@demo.obraflow.test`, `beatriz@demo.obraflow.test`. Senha fictícia comum: `ObraFlow-Demo-2026!`. Há login por HTTP; a tela pertence à SPEC-005. Nunca reutilize essa senha em um ambiente real.

### Autenticação por HTTP

| Operação | Comportamento |
| --- | --- |
| `GET /api/v1/auth/csrf` | Cria/reutiliza bootstrap anônimo de 15 minutos, ou recupera token da sessão autenticada |
| `POST /api/v1/auth/login` | Recebe e-mail/senha; exige cookie e CSRF; regenera sessão/token e inicia 8 horas absolutas |
| `GET /api/v1/auth/me` | Retorna identidade persistida, expiração e token atuais |
| `POST /api/v1/auth/logout` | Exige sessão/CSRF; invalida no banco e limpa cookie; retorna 204 |

Exemplo PowerShell com contas fictícias após o seed; cookies e tokens permanecem somente na memória do cliente:

```powershell
$api = 'http://localhost:8080/api/v1'
$csrf = Invoke-RestMethod "$api/auth/csrf" -SessionVariable loginSession
$headers = @{ 'X-CSRF-Token' = $csrf.csrfToken; Origin = 'http://localhost:8080' }
$body = @{ email = 'amanda@demo.obraflow.test'; password = 'ObraFlow-Demo-2026!' } | ConvertTo-Json
$identity = Invoke-RestMethod "$api/auth/login" -Method Post -WebSession $loginSession -Headers $headers -ContentType 'application/json' -Body $body
Invoke-RestMethod "$api/auth/me" -WebSession $loginSession | Select-Object user, expiresAt
$headers['X-CSRF-Token'] = $identity.csrfToken
Invoke-RestMethod "$api/auth/logout" -Method Post -WebSession $loginSession -Headers $headers
```

O token muda no login: use sempre o retornado pela resposta atual. Atividade não prolonga a sessão. Sem bootstrap/token, login retorna 403; sessão privada ausente/expirada retorna 401. Consulte [sessão](docs/specs/SPEC-004-autenticacao-backend.md) e o [contrato](docs/contrato-api.md#2-sessão-cookie-e-csrf).

### Banco exclusivo de testes

```powershell
docker run --rm --mount "type=bind,source=$((Get-Location).Path),target=/workspace" -w /workspace node:24.18.1-bookworm-slim node scripts/init-env.mjs --test
docker compose -p obraflow-test --env-file .env.test -f compose.yaml -f compose.test.yaml config --quiet
docker compose -p obraflow-test --env-file .env.test -f compose.yaml -f compose.test.yaml up --build -d
docker compose -p obraflow-test --env-file .env.test -f compose.yaml -f compose.test.yaml --profile tools build backend-tools
docker compose -p obraflow-test --env-file .env.test -f compose.yaml -f compose.test.yaml --profile tools run --rm backend-tools pnpm run test:unit
docker compose -p obraflow-test --env-file .env.test -f compose.yaml -f compose.test.yaml --profile tools run --rm backend-tools pnpm run test:integration
```

O bootstrap recusa sobrescrever `.env.test`. O projeto usa banco `obraflow_test`, volume `obraflow-test_postgres-test-data`, rede própria, porta 18080 e origem interna `http://frontend`. Integração limpa fixtures **somente** depois de verificar configuração e destino SQL efetivo; uma URL de trabalho é recusada. Não execute integração/E2E simultaneamente no mesmo banco. As suítes verificam persistência, autenticação HTTP, proteção por role, cadastros e responsabilidades; não provam os fluxos futuros de criação/decisão de compras ou configuração de alçadas. Detalhes de modelo, transação, hash, store e guardas: [persistência](docs/persistencia.md).

### Desenvolvimento

```powershell
docker compose -f compose.yaml -f compose.dev.yaml config --quiet
docker compose -f compose.yaml -f compose.dev.yaml up --build -d
```

Também usa `http://localhost:8080` e `/api` na mesma origem. Vite encaminha a API sem reescrever prefixo, Host ou Origin. `frontend/src`, `frontend/index.html` e `backend/src` são montados para atualização automática; dependências Linux ficam na imagem, sem montar `node_modules` do Windows. Alterações em manifests, lockfile e configurações exigem novo build. Para retornar ao modo compilado, execute `docker compose up --build -d`.

### Qualidade

Os serviços do perfil `tools` contêm fontes e ferramentas, ausentes das imagens finais:

```powershell
docker compose --profile tools build backend-tools frontend-tools
docker compose --profile tools run --rm backend-tools pnpm run lint
docker compose --profile tools run --rm backend-tools pnpm run typecheck
docker compose --profile tools run --rm backend-tools pnpm run build

docker compose --profile tools run --rm backend-tools pnpm -w run contract:check

docker compose --profile tools run --rm backend-tools pnpm -w run contract:test
docker compose --profile tools run --rm frontend-tools pnpm run lint
docker compose --profile tools run --rm frontend-tools pnpm run typecheck
docker compose --profile tools run --rm frontend-tools pnpm run build
```

Desenvolvimento opcional no host: Node **24.18.1**, Corepack e pnpm **10.20.0** (`corepack pnpm install --frozen-lockfile`, `corepack pnpm --filter @obraflow/backend db:generate`, depois `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm build`). O backend precisa das variáveis do banco e de acesso à rede dele; o fluxo recomendado usa Docker. `test:unit` e `test:integration` existem no backend; a integração exige o ambiente isolado acima. `e2e/` contém o pacote `@obraflow/e2e` e os cenários Playwright de autenticação, obras e responsabilidades.

### Login e validação integrada

Depois do seed base, acessar `/login`. O cliente chama `/api/v1/auth/me` ao iniciar, faz bootstrap CSRF antes de entrar e usa somente caminhos da mesma origem. Cookie é gerenciado pelo navegador; token CSRF fica apenas em memória. Logout/expiração cancelam consultas e limpam os dados privados; respostas de uma geração de sessão anterior são recusadas. Mutações não têm retry automático. Falha de comunicação mantém estado de erro, sem assumir sessão inexistente. Pedidos e alçadas futuras exibem indisponibilidade explícita; não há listas fictícias.

```powershell
docker compose --profile tools run --rm frontend-tools pnpm run test
# Estas etapas constroem imagens:
docker compose -p obraflow-test --env-file .env.test -f compose.yaml -f compose.test.yaml --profile tools build backend-tools frontend-tools e2e
docker compose -p obraflow-test --env-file .env.test -f compose.yaml -f compose.test.yaml up --build -d
docker compose -p obraflow-test --env-file .env.test -f compose.yaml -f compose.test.yaml --profile tools run --rm backend-tools pnpm run db:seed:base
docker compose -p obraflow-test --env-file .env.test -f compose.yaml -f compose.test.yaml --profile tools run --rm e2e pnpm run test
```

E2E requer `COMPOSE_PROJECT_NAME=obraflow-test` e origem `http://frontend`; recusa outra configuração. Usa Chromium em desktop e 320 px, API e banco reais, sem interceptar login. Screenshots são gravados em `e2e/evidence/` (ignorado pelo Git), sem traces de credenciais. Login, shell, lista, painel e detalhe foram capturados e inspecionados na SPEC-006; a SPEC-007 acrescenta seleção, confirmação e histórico de responsabilidades. O runner fixa Playwright 1.56.1 e copia Node 24.18.1 para a imagem dos navegadores. Build e quatro cenários Playwright passaram em desktop e móvel, reutilizando as sessões existentes para cobrir responsabilidades dentro do limite real de login. Para repetir imediatamente a suíte inteira, reinicie somente o backend do projeto de testes (`docker compose -p obraflow-test --env-file .env.test -f compose.yaml -f compose.test.yaml restart backend`) ou aguarde a janela de 15 minutos. Não executar integração do backend simultaneamente com E2E no mesmo banco. Após integração, executar seed base antes do navegador.

### Obras e catálogos — SPEC-006

Admin acessa `/admin/obras`: busca e paginação ficam na URL, “Nova obra” cadastra e “Editar” abre painel lateral. O nome só é confirmado após a resposta persistida. O detalhe `/admin/obras/:projectId` mostra nome, revisão de alçadas e responsáveis; a configuração de regras será acrescentada na SPEC-008. Uma obra nova tem revisão 0, sem regras nem vínculos. Não há exclusão, endereço, orçamento ou situação de obra.

### Responsáveis por obra — SPEC-007

No detalhe da obra, Admin usa “Adicionar responsável” para pesquisar e paginar Operadores. O filtro de situação permite consultar ativos e revogados; a ausência de filtro inclui ambos. A confirmação de revogação identifica pessoa e obra. Em uso, a API retorna contagens completas e até 10 IDs por grupo, com aviso de truncamento. A tela apresenta somente referências devolvidas pelo servidor. Histórico e decisões existentes são preservados.

| Operação (somente Admin) | Comportamento |
| --- | --- |
| `GET /api/v1/projects/:projectId/responsibilities` | Paginação, filtros `active` e `operatorId` |
| `POST /api/v1/projects/:projectId/responsibilities` | Corpo `{ "operatorId": "UUID" }`, sessão e CSRF; 201 e `X-Rules-Revision` |
| `DELETE /api/v1/projects/:projectId/responsibilities/:id` | Sessão e CSRF; 204 e revisão, ou 409 `RESPONSIBILITY_IN_USE` |

Repetir uma revogação já efetivada retorna 204 sem novo incremento. Uma nova concessão cria outro ID. O vínculo não cria uma role e não concede acesso a todos os pedidos da obra. Configuração de regras e criação/decisão de pedidos ainda não estão disponíveis.

### Catálogos por HTTP

| Operação HTTP em `/api/v1` | Acesso |
| --- | --- |
| `GET /users`, `POST /users` | Admin |
| `GET /projects`, `GET /projects/{projectId}` | Admin e Operador, mesmo sem vínculo |
| `POST /projects`, `PATCH /projects/{projectId}` | Admin |
| `GET /suppliers` | Admin e Operador |
| `POST /suppliers` | Admin |

Todas as escritas exigem sessão e CSRF. Listas aceitam `page`, `pageSize` e `search`; usuários também aceitam `role`. Cadastros de usuário recebem `name`, `email`, `password` e `role` (`admin` ou `operator`); obras e fornecedores recebem somente `name`. Os exemplos e limites completos permanecem no [contrato](docs/contrato-api.md#5-usuários-obras-e-fornecedores) e no [OpenAPI](docs/openapi.json). Usuários e fornecedores não têm telas de cadastro.

Para validar, execute os comandos de qualidade acima, `pnpm run test:integration` em `backend-tools` no Compose isolado e o seed base antes do E2E. O novo cenário Playwright usa API e PostgreSQL reais: Admin cadastra/edita e recarrega; Operador consulta a mesma obra por HTTP e recebe 403 nas mutações. Screenshots desktop/móvel ficam em `e2e/evidence/`. Não execute integração e E2E simultaneamente no mesmo banco.

## Decisões técnicas

- SPEC-007: concessão e revogação usam transação com bloqueio parametrizado da obra (`FOR UPDATE`) antes das leituras de elegibilidade e referências. A revisão incrementa somente em alterações efetivas; uma nova concessão após revogação gera outro registro. Listagem usa snapshot `RepeatableRead`. O schema existente atende ao incremento, sem migration ou dependência nova. Regras e pedidos usados para provar impedimentos são fixtures PostgreSQL; suas rotas ainda não existem. O fluxo completo será retomado na SPEC-012.
- SPEC-006: consultas paginadas fazem contagem e seleção na mesma transação `RepeatableRead`, com projeção explícita, ordenação por nome/ID e busca literal sem distinguir maiúsculas. Unicidade de e-mail é garantida pelo banco e traduzida em 409, inclusive concorrente. Nome da obra é atualizado sem tocar em revisão ou snapshots. Não houve alteração de schema/contrato nem dependências novas.
- O lint do backend declara os mesmos metadados de decorators do TypeScript, preservando imports de DTOs necessários à validação HTTP em execução. O painel lateral usa o diálogo modal nativo, com foco inicial, contenção de foco e Escape; comportamento real é verificado no Playwright. Dados remotos ficam no TanStack Query, com chaves por identidade/filtros/página e cancelamento pelo cliente HTTP.

- Workspace pnpm com um lockfile, versões exatas e TypeScript 5.9.3 estrito. Node 24.18.1 é a base comum do host opcional e das imagens; pnpm 10.20.0 é ativado pelo Corepack. React 19.2.0, Vite 8.0.10 e Nest 11.1.16 são versões fixadas compatíveis com esse runtime, sem depender da tag `latest`.
- ESLint 10.13.0 e typescript-eslint 8.72.0 validam as duas aplicações. Nest é aplicação independente, sem modo especial de monorepo do CLI. O build do backend usa `tsc` com metadados de decorators.
- PostgreSQL 17.6 em Debian, Nginx 1.28.0 Alpine e imagens multi-stage. O backend final executa como usuário `node`, com apenas dependências de produção e código compilado; o frontend final contém Nginx e assets públicos. `.env` fica fora do contexto de build; segredos entram apenas em runtime no backend/banco, nunca no frontend.
- `decimal.js` 10.6.0 foi escolhida e fixada em ambas as aplicações para a futura política comum: strings decimais, `ROUND_HALF_UP` por item em duas casas, soma de itens arredondados e limites explícitos. Cálculos financeiros ainda não estão implementados. Prisma/client 6.19.3 implementam o modelo e migrations, incluindo SQL para checks, índice parcial e sequência. Essa versão mantém a integração CommonJS existente; o cliente é gerado explicitamente para o sistema da imagem. `pg` 8.16.3 é usado pelo harness de testes e pelo store de sessão.
- Senhas usam scrypt nativo assíncrono (N=131072, r=8, p=1), salt aleatório de 16 bytes por conta e comparação em tempo constante. Express-session 1.18.2 e connect-pg-simple 10.0.0 usam a tabela técnica já criada pela migration, com renovação desativada e prazo absoluto validado no servidor. [Decisões de persistência](docs/persistencia.md).
- A SPEC-003 configura DTOs fechados com class-validator/class-transformer, sem conversão implícita, query simples sem duplicatas, parsing explícito de paginação/booleanos, UUIDs e projeções obrigatórias em listas. As futuras operações precisam declarar seus DTOs e usar esses helpers; nenhum controller de teste entra no runtime. A SPEC-004 protege rotas por padrão, exige origem/CSRF nas mutações e resolve identidade/role no banco. A SPEC-005 implementa a identidade do login/shell com Tailwind 4.3.3, Manrope local e primitivos do padrão shadcn/ui. React Router 7.9.5 fixa rotas, TanStack Query 5.90.3 mantém sessão e cache, e React Hook Form 7.66.0 com Zod 4.1.12 valida o login.
- Configuração de início valida banco, segredo de sessão com ao menos 32 caracteres e sem placeholders, origem canônica, ambiente e porta. `APP_ENV=local` no Compose permite HTTP somente em origem local; `APP_ENV=production` exige HTTPS. `PORT=3000` é interno, separado de `HTTP_PORT`. `COOKIE_SECURE`, se definido, deve coincidir com o protocolo da origem. `TRUST_PROXY_IPS` aceita somente IPs literais explícitos; vazio não confia em cabeçalhos encaminhados. O limite de login é local ao processo e reinicia com ele; atrás do Nginx sem proxy confiável, clientes compartilham o limite por IP do proxy. [detalhes](docs/specs/SPEC-004-autenticacao-backend.md).
- Nginx preserva caminhos `/api`, Host e Origin e mantém fallback SPA separado. O backend aplica o limite de 1 MiB, exige JSON para corpos e padroniza inclusive erros de parser em `{ error: { code, message, fields, details, requestId } }`. Respostas levam `Cache-Control: no-store`, UUID de correlação gerado no servidor e cabeçalhos contra MIME sniffing/framing. Erros inesperados são seguros; logs usam uma lista permitida de evento, correlação, status e código, sem serializar entradas ou exceções.
- `contract:check` usa Swagger Parser e Ajv com formatos para validar estrutura, referências locais, unicidade de operationIds e todos os exemplos inline (schemas, parâmetros, headers e corpos). Testes de regressão corrompem cópias em memória para comprovar rejeição. Isso valida especificação, não endpoints. O contrato versionado e os nomes das migrations são empacotados na imagem final; fontes, testes e ferramentas permanecem fora dela.
- Para produção faltam HTTPS, gestão externa de segredos, atualização contínua das imagens/dependências, backups, observabilidade e endurecimento operacional. Este Compose é uma base local, sem promessa de disponibilidade de produção.

Evidências e pendências: registros da [SPEC-001](docs/specs/SPEC-001-base-workspace-docker.md#registro-de-execução), [SPEC-002](docs/specs/SPEC-002-schema-migrations-testes.md#registro-de-execução), [SPEC-003](docs/specs/SPEC-003-base-http-contrato.md#registro-de-execução) e [SPEC-004](docs/specs/SPEC-004-autenticacao-backend.md#registro-de-execução). A SPEC-005 teve sua validação E2E/visual retomada durante a SPEC-006. A SPEC-006 valida cadastros/obras e a [SPEC-007](docs/specs/SPEC-007-responsabilidades.md#registro-de-execução) valida responsabilidades: 80 testes de integração PostgreSQL, 22 testes frontend e quatro cenários E2E passaram, além de lint/tipos/build pertinentes e contrato. Cinco testes unitários preexistentes de configuração de proxy continuam falhando; não há afirmação de suíte global verde. SPEC-008 e posteriores continuam planejadas.

---

Bem-vindo(a) ao nosso processo seletivo! Estamos buscando alguém com curiosidade técnica, autonomia e, acima de tudo, **visão de produto e criatividade** para transformar problemas reais em soluções.
## Contexto

O **ObraFlow** é uma plataforma para empresas do setor de construção civil, concebida como parte de um [ERP (*Enterprise Resource Planning*)](https://pt.wikipedia.org/wiki/Sistema_integrado_de_gest%C3%A3o_empresarial).

O **Dokimos** é o serviço de aprovações do ObraFlow. Ele gerencia **alçadas de aprovação**: regras que definem quem pode autorizar uma decisão e em qual ordem, de acordo com o contexto do pedido — neste caso, a obra e o valor da compra.

A gestão de alçadas é necessária para que a empresa mantenha controle financeiro e operacional. Compras de menor impacto podem ser decididas rapidamente por responsáveis próximos à obra; compras de maior valor exigem revisão adicional de pessoas com maior responsabilidade. Isso reduz o risco de gastos indevidos, evita que uma única pessoa aprove decisões além de sua responsabilidade e cria uma trilha auditável de quem aprovou ou rejeitou cada pedido.

Também é importante que essas regras sejam configuráveis por obra: projetos diferentes podem ter orçamentos, portes e responsáveis distintos. Assim, o sistema deve identificar a regra aplicável no momento da criação do pedido, formar a cadeia de aprovadores e só avançar para a próxima pessoa depois da aprovação anterior. Em caso de rejeição, o fluxo é interrompido e o motivo fica registrado no histórico.

Em produção, uma regra simples seria:

```text
Obra 1 — valor até R$ 10.000,00
-> Aprovadores: João
Obra 1 — valor acima de R$ 10.000 
-> Aprovadores: Amanda
```

*   Se um pedido na Obra 1 custar **R$ 8.000,00**, basta o clique da João para ser aprovado.
*   Se custar **R$ 12.500,00**, João precisa aprovar primeiro. Só depois da aprovação dela é que o pedido fica liberado para o Amanda decidir. Se a João (ou o Amanda) rejeitar, o pedido é cancelado na hora e precisa ter um motivo registrado.

Neste desafio você vai construir a **versão simplificada** desse fluxo: as telas de um sistema de pedidos de compra com aprovação por alçada.

---

# Backend e persistência

Você deve projetar e implementar a [API](https://pt.wikipedia.org/wiki/Interface_de_programa%C3%A7%C3%A3o_de_aplica%C3%A7%C3%B5es) (ou outro mecanismo de comunicação entre front-end e servidor) e a persistência necessários para suportar o desafio. O contrato, as rotas e o formato dos dados são livres, desde que atendam aos comportamentos abaixo:

* cadastrar e listar obras, usuários, fornecedores, pedidos e regras de alçada;
* criar pedidos com cabeçalho e **N itens**; calcular e persistir seus totais;
* determinar a cadeia de aprovadores conforme a obra e o valor total do pedido;
* registrar aprovações e rejeições, incluindo o motivo obrigatório de rejeição;
* impedir decisões fora da ordem da alçada e preservar o histórico;
* criar, editar, remover e consultar níveis e aprovadores das regras por obra;
* garantir a consistência das leituras e escritas dos dados.

Inclua dados de demonstração suficientes para avaliar o fluxo: ao menos 2 obras, usuários, regras e pedidos em diferentes estados.

Documente no `README.md` como iniciar a aplicação, popular os dados (quando aplicável) e consumir a API. Se optar por expor uma API HTTP, documente também os principais endpoints e payloads.

---

# Tecnologias

A stack é **livre**. Escolha as tecnologias de front-end, back-end, banco de dados, ORM, biblioteca de estilos, testes e infraestrutura que considerar mais adequadas.

A única exigência é que a aplicação possa ser executada localmente conforme as instruções do seu `README.md`, sem depender de serviços pagos ou de credenciais externas.

Testes são desejáveis, mas não obrigatórios.

---

# O que você vai construir

Três telas. O layout é livre — **não entregamos Figma, API ou implementação de referência**. O desenho das telas e as decisões de produto são parte da avaliação.

## 1. Cadastro de pedido de compra

Um pedido de compra representa uma solicitação ao fornecedor e deve conter **um ou mais itens**. A alçada é determinada pelo **valor total do pedido**, e não pelo valor isolado de um item.


### Dados gerais

| Campo | Obrigatório | Comportamento esperado |
|---|---:|---|
| Obra | Sim | Lista as obras disponíveis para o pedido. |
| Fornecedor | Sim | Identifica o fornecedor do pedido. |
| Data do pedido | Sim | Data de emissão do pedido. |
| Observações internas | Não | Campo livre para justificar ou complementar a solicitação. |

Não é **obrigatório** criar uma tela de cadastro de fornecedor, obra ou usuário — se quiser, considere que esses dados já existem no sistema. A tela deve apenas permitir selecionar a obra e o fornecedor do pedido.

### Itens do pedido

A tela começa com um item em branco e deve permitir **adicionar, editar e remover N itens** antes do envio. Cada item deve ter, no mínimo:

| Campo | Obrigatório | Comportamento esperado |
|---|---:|---|
| Descrição | Sim | Descreve claramente o material ou serviço. |
| Quantidade | Sim | Número positivo; pode aceitar decimais. |
| Unidade | Sim | Por exemplo: `un`, `kg`, `m`, `m²` ou `h`. |
| Preço unitário | Sim | Valor monetário não negativo. |
| Total do item | Calculado | `quantidade × preço unitário`; não deve ser editável diretamente. |

O candidato pode definir a experiência de uso mais adequada — por exemplo, uma tabela expansível, um formulário por item ou um drawer — desde que a inclusão de vários itens permaneça clara.

### Totalização e envio

A interface deve exibir o **total do pedido**, calculado pela soma dos totais dos itens. Esse é o valor usado para selecionar a regra de alçada.

O botão **Cadastrar pedido** só deve ficar disponível quando os dados gerais e todos os itens forem válidos. Ao criar o pedido, o back-end deve persistir cabeçalho, itens, total calculado e cadeia inicial de aprovação.
## 2. Aprovação

A tela deve listar pedidos e permitir abrir os detalhes de cada um. A lista pode ser em tabela, cartões ou outra composição clara, mas deve apresentar pelo menos:

| Informação por pedido | Descrição |
|---|---|
| Identificador, obra e fornecedor | Contexto rápido do pedido. |
| Data, quantidade de itens e valor total | Resumo financeiro e operacional. |
| Situação | Pendente, aprovado ou rejeitado. |
| Alçada atual | Aprovadores concluídos, aprovador atual e próximas etapas. |
| Ações | Aprovar ou rejeitar quando houver uma decisão disponível. |

Nos detalhes, apresente os itens — descrição, quantidade, unidade, preço unitário e total — além do histórico de decisões. A lista de pedidos **pendentes** deve refletir o nível atual da alçada, calculado e persistido pelo back-end. A rejeição exige motivo, interrompe o fluxo e fica registrada no histórico. Quando toda a cadeia for concluída, as ações de decisão devem estar desabilitadas com uma explicação.

## 3. Regras da alçada

A tela deve permitir selecionar uma obra e configurar as faixas de valor que definem a cadeia de aprovação. Uma representação mínima pode ser uma tabela como esta:

| Faixa de valor | Aprovadores, na ordem do fluxo | Ações |
|---|---|---|
| Até R$ 10.000,00 | Amanda | Editar / remover |
| Acima de R$ 10.000,00 | Amanda → João | Editar / remover |

A interface deve listar usuários disponíveis e permitir:

* criar, editar e remover níveis/faixas de alçada;
* definir o limite de valor de cada faixa;
* adicionar, remover e reordenar aprovadores em cada faixa;
* listar as regras já salvas para a obra selecionada.

O comportamento para valores sem regra aplicável deve ser definido e documentado pelo candidato — por exemplo, impedir o envio do pedido com uma mensagem clara.

---

# Validações e erros (exigidos)

| Situação | Comportamento esperado |
|---|---|
| Quantidade ou preço unitário inválido, negativo ou não numérico | erro no item correspondente, mensagem compreensível, não envia |
| Pedido sem itens | erro claro; não envia |
| Campos obrigatórios vazios (obra, fornecedor, data ou descrição de item) | erro no campo correspondente; não envia |
| Nenhuma obra cadastrada | empty state amigável, não tela branca |
| API fora do ar / 500 | estado de erro com opção de tentar novamente |
| Rejeitar sem motivo | validação antes do submit |
| Cadeia de alçada já concluída | botão de decisão desabilitado + explicação |

Loading state é obrigatório em toda lista.

---

# 📦 Como entregar (Prazo: 01/11/2026 às 23:59)
O repositório deve conter instruções claras para instalar dependências, configurar o ambiente e iniciar a solução completa (front-end, back-end e banco de dados, quando aplicável). O método de execução é livre; `docker compose` é aceito, mas não obrigatório.

Repositório deve conter:

* código-fonte do front-e˝nd e do back-end;
* dados de demonstração e instruções para criá-los ou carregá-los;
* `README.md` com explicando:
  * screenshots das telas;
  * as tecnologias escolhidas e os motivos da escolha;
  * como a regra de alçada é modelada, calculada e persistida;
  * como o front-end se comunica com o back-end;
  * como a consistência e a integridade dos dados são garantidas;
  * o que mudaria em produção;
1. Faça um **Fork** deste repositório (`https://github.com/ObraFlow/obraflow-case`).
2. Abra um **Pull Request (PR)** para este repositório até **01/11/2026 às 23:59**.
3. **Importante:** Na descrição do seu Pull Request, deixe seu **e-mail e telefone (WhatsApp)** para contato!

---

# Avaliação

| Critério | Peso |
|---|---:|
| Funcionamento completo: front-end, back-end e persistência | 25% |
| Modelagem e implementação das regras de alçada | 20% |
| Qualidade de código, organização e decisões técnicas | 15% |
| **Desenho de UI: hierarquia, clareza, consistência** | 20% |
| Estados (loading / empty / erro), responsividade e validações | 10% |
| Documentação (`## Decisões técnicas`) | 10% |

IA é permitida — mas você precisará explicar cada decisão na entrevista de 30 min.

---

## Contato


**Jonathan Bispo**  
WhatsApp: [+55 71 99204-4335](https://wa.me/5571992044335)  
E-mail: [contrato@obraflow.io](mailto:contrato@obraflow.io)
