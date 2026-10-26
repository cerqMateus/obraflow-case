---
id: SPEC-006
status: verified
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

1. [x] Implementar consultas de usuários (somente Admin) e obras/fornecedores (ambas as roles), com projeção de campos permitidos, busca, filtros, paginação e ordem do contrato no servidor.
2. [x] Implementar criação de usuário por Admin com role fechada, normalização e unicidade de e-mail, hash e retorno sem dados privados. Garantir colisão de e-mail como 409, inclusive concorrente.
3. [x] Implementar criação de fornecedor por Admin com validação; não inventar CNPJ ou campos não previstos no contrato.
4. [x] Implementar cadastro/detalhe/edição de nome da obra por Admin; iniciar revisão 0, sem regras/vínculos; edição do nome não incrementa revisão nem altera snapshots de pedidos.
5. [x] Implementar página `/admin/obras` com lista paginada, busca, Nova obra e edição em painel. Detalhe `/admin/obras/:projectId` identifica a obra; região de responsabilidades será adicionada na SPEC-007.
6. [x] Mapear erros aos campos e confirmar criação/edição apenas com resposta persistida; invalidar somente consultas pertinentes, preservando filtro/página e edição em falhas.
7. [x] Preparar hooks e cliente de catálogos para seletores pesquisáveis paginados, sem buscar todo o catálogo. Consumir os endpoints reais; não copiar respostas para store global.
8. [x] Completar proteção de rotas e controllers: chamadas diretas de Operador às mutações e à listagem de usuários retornam 403, mesmo que a interface não exponha o caminho.

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

Implementação em 25/10/2026. Oito operações registradas no `AppModule`, nos módulos `users`, `projects` e `suppliers`. DTOs fechados, nomes normalizados, e-mail em minúsculas, scrypt e projeções explícitas sem senha/hash. Contagem e linhas compartilham transação `RepeatableRead`; busca literal case-insensitive, filtros antes da paginação e ordem `name ASC, id ASC`. A constraint de e-mail resolve também disputas simultâneas como `409 EMAIL_ALREADY_EXISTS`.

Frontend: `catalogs` expõe serviços e hooks paginados para obras, usuários e fornecedores; `administration` implementa `/admin/obras`, `/admin/obras/:projectId`, `ProjectPanel` e mutação com invalidação restrita. Busca/página ficam na URL; chaves incluem identidade; requests consomem AbortSignal. O painel usa React Hook Form/Zod, preserva preenchimento em falhas e confirma somente dados persistidos. Rotas administrativas são protegidas no frontend e as permissões são revalidadas no servidor. Operador consulta obras por API sem vínculo; não recebe interface administrativa.

Nenhuma migration, dependência ou alteração de contrato foi necessária. As fixtures de pedidos são criadas diretamente no banco isolado apenas para provar preservação de snapshots. Não há endpoint de compras implementado.

### Validações executadas

As dependências do host estavam incompletas (links para módulos inexistentes). As validações usaram as imagens Docker de ferramentas existentes com fontes e, quando necessário, `eslint.config.mjs` montados somente para leitura. Banco exclusivo: projeto `obraflow-test`, PostgreSQL `obraflow_test`, destino verificado pelo harness antes de limpar fixtures. Migrations versionadas aplicadas nesse destino, sem tocar no banco de trabalho.

| Comando no serviço correspondente | Resultado |
| --- | --- |
| Backend `pnpm run lint`, `typecheck`, `build` | Passaram |
| Backend `pnpm run test:integration` | 67 testes em 5 suítes passaram (5 cenários de catálogos nessa rodada). Após acrescentar limites exatos, os 6 cenários de catálogos passaram novamente em execução focada; cobrem os oito endpoints, contratos de resposta, negações, validação, busca/paginação, e-mail concorrente e snapshots |
| Backend `pnpm run test:unit` | 43 passaram e 5 falharam nos testes preexistentes de `TRUST_PROXY_IPS`; `configuration.ts` não valida esse campo. Arquivos de configuração e teste não foram alterados nesta spec |
| Frontend `pnpm run lint`, `typecheck`, `build` | Passaram |
| Frontend `pnpm run test` | 16 testes em 5 arquivos passaram; 5 cenários novos de interação, erro, vazio, paginação e submissão pendente |
| Raiz `pnpm -w run contract:check` | 21 operações e 159 exemplos válidos; não comprova implementação das operações futuras |
| Raiz `pnpm -w run contract:test` | 4 testes passaram |
| Detector Impeccable dos componentes alterados | Sem achados mecânicos; não substitui inspeção visual |

O Jest também emite aviso preexistente TS151002 sobre módulos híbridos. Nenhum erro de lint/tipos foi silenciado. A configuração ESLint do backend foi alinhada aos decorators/metadados já usados no compilador para evitar sugerir remoção dos imports de DTOs necessários em runtime.

### Navegador e pendências

Build das imagens finais backend/frontend e runner Playwright concluído. O build do runner revelou um link quebrado de Yarn herdado da imagem; `corepack enable pnpm` ativa somente o gerenciador do workspace e resolveu a falha, sem adicionar dependências. Lint/tipos do E2E passaram. A suíte completa `pnpm run test` no serviço `e2e` passou: 4 cenários (autenticação e obras em desktop 1440×900 e móvel 320×740), API e PostgreSQL reais, sem mocks de rede. Reinício do backend isolado entre rodadas reiniciou sua janela de login; nenhuma proteção foi desativada. O cenário de invalidação de sessão foi incorporado ao cenário de troca de conta para reutilizar a sessão e manter a suíte inteira dentro das 10 tentativas de login permitidas.

O primeiro teste real de painel encontrou escape do ciclo de tabulação ao voltar do primeiro controle. Foi corrigido com ciclo explícito Tab/Shift+Tab dentro do diálogo e coberto por regressão de componente e E2E. Depois da correção, lint/tipos/build e os 16 testes do frontend passaram novamente; os 4 E2E passaram em 13,4 segundos.

Inspeção conjunta das seis capturas de obras (lista, painel e detalhe em desktop/móvel): composição alinhada aos tokens, leitura e ações legíveis, nomes quebrando sem overflow da página. Playwright confirma foco inicial, ciclo reverso, Escape, retorno ao acionador, persistência após reload e bloqueio administrativo do Operador. Contraste medido com cores computadas no navegador: ação primária 6,00:1; secundário/página 5,30:1; texto/campo 16,33:1; secundário/painel 5,60:1. Estes pares atendem 4,5:1; não constituem auditoria completa de acessibilidade ou de todos os estados.

Capturas locais, ignoradas pelo Git: `e2e/evidence/projects-list-{desktop,mobile}.png`, `project-panel-{desktop,mobile}.png`, `project-detail-{desktop,mobile}.png`, além de login e shell. Não contêm cookies, tokens ou senhas. Os logs públicos usam a allowlist existente e não serializam os corpos de cadastro.

**Conclusão:** AC-006-01 a AC-006-05 demonstrados pelas evidências HTTP/PostgreSQL, interações e navegador. A dependência visual/E2E da SPEC-005 foi retomada nesta execução. A falha unitária preexistente de proxy permanece fora do escopo e impede afirmar que a suíte global está verde. Não houve commits, push ou PR. A prévia isolada permanece em `http://localhost:18080`.
