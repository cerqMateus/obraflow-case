---
id: SPEC-007
status: verified
depends_on: ["SPEC-006"]
user_stories: ["US-12", "US-15"]
operation_ids: ["listResponsibilities", "grantResponsibility", "revokeResponsibility"]
---

# SPEC-007 — Responsabilidades de operadores por obra

## Objetivo

Permitir ao Admin conceder e revogar responsabilidades com rastreabilidade e impedimentos corretos. Atribuição por obra não cria role nem dá acesso irrestrito aos pedidos da obra.

## Entradas e dependências

Dependência: [006](SPEC-006-cadastros-obras.md). Ler responsabilidades na [visão geral](../visao-geral.md), seção 6 do [contrato](../contrato-api.md) e Responsáveis por obra no [design](../design-frontend.md).

## Escopo e entregáveis

Três operações de responsabilidade, seção na página da obra, seletor paginado de operadores e confirmação/feedback de revogação. Implementar desde já os guards de referência em regras e pedidos, mesmo que suas rotas ainda não existam.

## Fora do escopo

Sem terceira role, níveis de responsabilidade, atribuição a Admin, substituição em pedidos enviados ou revogação parcial. Não disponibilizar cadastro de Aprovador.

## Tarefas de execução

1. [x] Implementar listagem paginada restrita ao Admin com filtros `active` e `operatorId`, incluindo registros revogados quando filtro estiver ausente.
2. [x] Implementar concessão: conferir obra e usuário, exigir Operador, bloquear obra, impedir vínculo ativo duplicado, registrar autor/instante e incrementar revisão; retornar nova revisão no cabeçalho.
3. [x] Implementar revogação: confirmar vínculo da obra, bloquear obra e verificar referências em qualquer regra vigente ou etapa `pending`/`waiting` de pedido pendente antes de escrever.
4. [x] Em uso, retornar 409 com contagens completas, até 10 IDs de faixas/pedidos por grupo e flag de truncamento; não alterar vínculo, revisão ou registros históricos.
5. [x] Sem impedimento, registrar revogação e incrementar revisão uma vez. Repetir revogação de vínculo já inativo retorna 204 sem novo evento/incremento. Nova concessão gera outro registro.
6. [x] Na página da obra, listar vínculos e filtros ativo/revogado; Adicionar responsável pesquisa usuários com role Operador e paginação. O servidor revalida elegibilidade mesmo se o cliente enviar outro ID.
7. [x] Revogar abre confirmação com pessoa/obra; conflito mantém vínculo e informa impedimentos com seus IDs legíveis quando disponíveis. Não presumir nome/número de pedido que a API não devolve nem adicionar endpoint só para decorar a mensagem.
8. [x] Invalidar responsabilidades e revisão de configuração após sucesso; lidar com 204 sem tentar interpretar JSON. Preservar contexto da obra ao fechar os diálogos.

## Critérios e cenários de aceite

- **AC-007-01:** Admin concede responsabilidade a dois operadores numa obra e ao mesmo operador em outra; nenhuma terceira role é criada.
- **AC-007-02:** atribuição a Admin, vínculo duplicado e vínculo de outra obra no DELETE são recusados com os códigos do contrato.
- **AC-007-03:** regras vigentes e etapas pendentes/futuras bloqueiam revogação sem alteração parcial; etapas concluídas e pedidos finais não bloqueiam.
- **AC-007-04:** revogação permitida mantém histórico; repetir não incrementa revisão; reativar cria novo ID.
- **AC-007-05:** Operador não lista/gerencia vínculos administrativos via HTTP; seletor alcança operadores depois da primeira página e não oferece Admin.

## Verificação e conclusão

Executar integração com PostgreSQL, incluindo duas concessões concorrentes e fixtures reais de regras/pedidos para provar impedimentos antes de suas telas existirem. Executar E2E Admin concede/revoga e frontend para confirmação/conflito. Registrar explicitamente quais cenários usam fixtures; o fluxo integrado com criação/decisão será repetido na SPEC-012.

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

Executada em 26/10/2026. Implementados `listResponsibilities`, `grantResponsibility` e `revokeResponsibility` no módulo `project-responsibilities`. A seção de responsáveis integra o detalhe da obra no módulo frontend `administration`.

### Implementação e decisões

- Mutações bloqueiam a obra via SQL parametrizado `FOR UPDATE` antes de consultar vínculo, destinatário e referências. Todas as operações do caso de uso usam o mesmo cliente transacional. A concessão registra autor/instante e incrementa a revisão; revogação efetiva registra autor/instante e incrementa uma vez. Repetições retornam 204 com revisão atual e preservam o registro original. Nova concessão usa novo ID.
- Listagem Admin com paginação/filtros validados, projeção explícita de campos públicos e contagem/linhas em snapshot `RepeatableRead`. Conflito de uso conta faixas/pedidos distintos integralmente e limita os IDs a 10 por grupo, com ordenação estável e flag de truncamento.
- Frontend consulta usuários com role Operador; busca e paginação alcançam resultados além da primeira página. Filtros/página dos vínculos permanecem na URL; fechamento mantém a obra. Diálogos têm confirmação contextual, foco contido, Escape e retorno ao acionador (ou Adicionar, quando Revogar deixa de existir). Não há atualização otimista nem repetição automática de mutação; falha de comunicação orienta consultar os vínculos antes de repetir.
- Sucesso e conflitos invalidam vínculos, obra/revisão, lista de obras e cache de configuração de alçadas. O cliente HTTP existente trata 204 sem interpretar JSON. Conflitos exibem somente contagens e IDs retornados; nenhum endpoint adicional foi criado para inferir nomes de pedidos.
- Sem mudança de schema, migrations, dependências ou contrato. O schema completo da SPEC-002 já contém os vínculos, snapshots e referências necessários.

### Validação HTTP e PostgreSQL

Banco exclusivo: projeto Compose `obraflow-test`, banco `obraflow_test`; o harness valida configuração e destino efetivo antes de limpar fixtures. As suítes são sequenciais e não executam junto do E2E. O pnpm do host tentou baixar sua distribuição e falhou por indisponibilidade de rede; a execução utilizou imagens Docker com fontes/testes e a configuração ESLint atual montados somente para leitura.

Foram demonstrados: concessão para dois Operadores e mesmo Operador em outra obra; negação de Admin como destinatário, duplicidade, referência inexistente e vínculo de outra obra; negações de autenticação/role/CSRF/origem; filtros/precisão da paginação; concessões simultâneas e revogações simultâneas em transações independentes; revisão única; histórico original após repetição e ID novo após nova concessão.

**Fixtures persistidas:** referências em regras, etapas atuais/futuras e pedidos concluídos foram criadas diretamente no PostgreSQL isolado, pois suas rotas ainda não existem. Regras como único impedimento e etapas `pending`/`waiting` impedem revogar sem alteração parcial. Doze regras e doze pedidos comprovam contagens completas e listas truncadas. Etapa aprovada em pedido ainda pendente, pedidos aprovados/rejeitados e etapa futura ignorada após rejeição não impedem revogação; itens, snapshots e decisões permanecem preservados. A SPEC-012 repetirá essas disputas pelo fluxo completo de criação/configuração/decisão.

| Validação executada no serviço correspondente | Resultado |
| --- | --- |
| Backend `pnpm run lint`, `pnpm run typecheck`, `pnpm run build` | Passaram; configuração ESLint atual preserva imports de DTOs necessários aos decorators |
| Backend `pnpm run test:integration` | 80 testes em 6 suítes passaram, incluindo 12 cenários de responsabilidades com PostgreSQL real |
| Backend `pnpm run test:unit` | 43 passaram; 5 falharam nos casos preexistentes de `TRUST_PROXY_IPS` de `auth.unit.spec.ts`, já documentados na SPEC-006 |
| Frontend `pnpm run lint`, `pnpm run typecheck`, `pnpm run build` | Passaram |
| Frontend `pnpm run test` | 22 testes em 6 arquivos passaram, incluindo 6 cenários de responsabilidades (confirmação, conflito, invalidação, pendência, paginação e recuperação) |
| Raiz `pnpm -w run contract:check`, `pnpm -w run contract:test` | 21 operações / 159 exemplos válidos; 4 testes passaram |
| E2E `pnpm run lint`, `pnpm run typecheck` | Passaram |
| E2E `pnpm run test` | 4 cenários passaram em 44,9 s, com responsabilidades incorporadas ao fluxo de obras em desktop/móvel, API e banco reais |
| Build Docker de backend/frontend/runner | Passou; aplicação isolada iniciou com migrations e prontidão saudáveis |

O Jest mantém o aviso preexistente TS151002. Não houve alteração nos testes de proxy nem no código de configuração para ocultar falhas.

### Navegador e inspeção visual

O cenário de obras reutiliza suas sessões Admin/Operador para incluir responsabilidades, mantendo a suíte dentro do limite real de login. Cria 21 Operadores fictícios por API, pesquisa e seleciona na página 2, concede, confirma revisão, cancela/confirma revogação, verifica foco, recarrega o histórico e repete DELETE sem incrementar. Também verifica que Operador não lista/concede/revoga por HTTP e não acessa a tela administrativa.

A primeira rodada passou nos fluxos de responsabilidades desktop e móvel, mas encontrou uma corrida preexistente no teste de autenticação móvel: a navegação era consultada antes de o shell terminar de recuperar a sessão. O helper agora aguarda o controle estar anexado ao documento antes de verificar sua visibilidade; nenhuma alteração no comportamento de produção foi necessária.

As seis capturas de lista/histórico, seleção e confirmação foram inspecionadas conjuntamente em desktop 1440×900 e móvel 320×740. Texto e ações permanecem legíveis, nomes/e-mails longos quebram dentro dos limites, foco é visível e a página não tem rolagem horizontal. Capturas locais ignoradas pelo Git: `e2e/evidence/responsibilities-{desktop,mobile}.png`, `responsibility-grant-{desktop,mobile}.png` e `responsibility-revoke-{desktop,mobile}.png`.

Rodada final: lint/tipos do E2E e os quatro cenários passaram. A espera do controle de navegação inclui elementos ocultos para funcionar também no desktop, onde o botão móvel existe mas não é visível. Nenhuma proteção de autenticação foi desativada; o backend isolado foi reiniciado entre rodadas para reiniciar sua janela de tentativas.

Contrastes medidos com cores computadas no navegador real: ação primária 6,00:1, descrição/superfície do diálogo 5,60:1 e texto/campo 16,33:1. O foco por teclado foi confirmado e o seletor mantém rolagem contida quando há 20 resultados. São verificações desses pares e estados, sem alegação de auditoria completa de acessibilidade.

**Conclusão:** AC-007-01 a AC-007-05 demonstrados. Evidências são locais; não comprovam produção nem a futura integração de configuração/criação/decisão. As cinco falhas unitárias preexistentes de proxy impedem afirmar que a suíte global está verde. Sem commits, push ou PR. Prévia isolada disponível em `http://localhost:18080`.
