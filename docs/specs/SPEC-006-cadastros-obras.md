---
id: SPEC-006
status: planned
depends_on: ["SPEC-005"]
user_stories: ["US-12", "US-14"]
operation_ids: ["listUsers", "createUser", "listProjects", "createProject", "getProject", "updateProject", "listSuppliers", "createSupplier"]
---

# SPEC-006 — Cadastros auxiliares e gestão de obras

## Objetivo

Entregar o primeiro incremento administrativo: Admin cria e edita obras pela interface; usuários e fornecedores podem ser cadastrados por API e os catálogos paginados servem às funcionalidades seguintes.

## Entradas e dependências

Dependência: [005](SPEC-005-login-frontend.md). Consultar schemas `User`, `Project`, `Supplier` e páginas no [OpenAPI](../openapi.json), seções 3–5 do [contrato](../contrato-api.md) e Obras no [design](../design-frontend.md).

## Escopo e entregáveis

Implementar as oito operações de `operation_ids`; módulos `users`, `projects`, `suppliers`, serviços frontend de catálogos e administração de obras. Usuários/fornecedores continuam sem telas de cadastro.

## Fora do escopo

Sem endereço, orçamento, situação, exclusão/arquivamento de obra, troca de role ou administração visual de usuários/fornecedores. Ainda não conceder responsabilidade nem editar alçadas nesta tela.

## Tarefas de execução

1. [ ] Implementar consultas de usuários (somente Admin) e obras/fornecedores (ambas as roles), com projeção de campos permitidos, busca, filtros, paginação e ordem do contrato no servidor.
2. [ ] Implementar criação de usuário por Admin com role fechada, normalização e unicidade de e-mail, hash e retorno sem dados privados. Garantir colisão de e-mail como 409, inclusive concorrente.
3. [ ] Implementar criação de fornecedor por Admin com validação; não inventar CNPJ ou campos não previstos no contrato.
4. [ ] Implementar cadastro/detalhe/edição de nome da obra por Admin; iniciar revisão 0, sem regras/vínculos; edição do nome não incrementa revisão nem altera snapshots de pedidos.
5. [ ] Implementar página `/admin/obras` com lista paginada, busca, Nova obra e edição em painel. Detalhe `/admin/obras/:projectId` identifica a obra; região de responsabilidades será adicionada na SPEC-007.
6. [ ] Mapear erros aos campos e confirmar criação/edição apenas com resposta persistida; invalidar somente consultas pertinentes, preservando filtro/página e edição em falhas.
7. [ ] Preparar hooks e cliente de catálogos para seletores pesquisáveis paginados, sem buscar todo o catálogo. Consumir os endpoints reais; não copiar respostas para store global.
8. [ ] Completar proteção de rotas e controllers: chamadas diretas de Operador às mutações e à listagem de usuários retornam 403, mesmo que a interface não exponha o caminho.

## Critérios e cenários de aceite

- **AC-006-01:** Admin cadastra obra, visualiza revisão 0, edita nome e vê os dados após reload; Operador consulta a obra sem vínculo e não consegue gerenciá-la.
- **AC-006-02:** nova obra sem alçada permanece sem regras; não criar cadeia padrão oculta.
- **AC-006-03:** API de usuários recusa role extra, campo desconhecido e e-mail normalizado duplicado; respostas/logs não expõem senha/hash.
- **AC-006-04:** busca/paginação alcança um registro após a primeira página; listas diferenciam loading, sem cadastros, filtro sem resultado e erro recuperável.
- **AC-006-05:** falha de gravação preserva nome digitado e não acrescenta uma obra fictícia à lista.

## Verificação e conclusão

Executar testes HTTP de sucesso/negação e fronteiras dos oito endpoints, testes de interação da página e E2E Admin cria/edita → Operador consulta. Verificar painel por teclado e tela pequena. Fixtures de pedidos usadas apenas para provar preservação de nome são dados controlados no PostgreSQL, não alegação de endpoint de pedido pronto.

## Comandos de verificação

Comandos planejados, disponíveis após as tarefas e dependências desta spec. Conferir os manifests antes de executar. Integração/E2E exigem o projeto isolado já iniciado conforme [SPECS.md](../../SPECS.md); não usar banco de trabalho. As suites contêm somente comportamentos já implementados neste marco.

```powershell
docker compose --profile tools run --rm backend-tools pnpm run lint
docker compose --profile tools run --rm backend-tools pnpm run typecheck
docker compose --profile tools run --rm backend-tools pnpm run build
docker compose --profile tools run --rm frontend-tools pnpm run lint
docker compose --profile tools run --rm frontend-tools pnpm run typecheck
docker compose --profile tools run --rm frontend-tools pnpm run build
docker compose --profile tools run --rm backend-tools pnpm run test:unit
docker compose -p obraflow-test --env-file .env.test -f compose.yaml -f compose.test.yaml --profile tools run --rm backend-tools pnpm run test:integration
docker compose --profile tools run --rm frontend-tools pnpm run test
docker compose -p obraflow-test --env-file .env.test -f compose.yaml -f compose.test.yaml --profile tools run --rm e2e pnpm run test
```

## Registro de execução

Não iniciada. Preencher endpoints, componentes, cenários, comandos/resultados e evidências.
