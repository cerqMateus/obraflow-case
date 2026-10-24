---
id: SPEC-007
status: planned
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

1. [ ] Implementar listagem paginada restrita ao Admin com filtros `active` e `operatorId`, incluindo registros revogados quando filtro estiver ausente.
2. [ ] Implementar concessão: conferir obra e usuário, exigir Operador, bloquear obra, impedir vínculo ativo duplicado, registrar autor/instante e incrementar revisão; retornar nova revisão no cabeçalho.
3. [ ] Implementar revogação: confirmar vínculo da obra, bloquear obra e verificar referências em qualquer regra vigente ou etapa `pending`/`waiting` de pedido pendente antes de escrever.
4. [ ] Em uso, retornar 409 com contagens completas, até 10 IDs de faixas/pedidos por grupo e flag de truncamento; não alterar vínculo, revisão ou registros históricos.
5. [ ] Sem impedimento, registrar revogação e incrementar revisão uma vez. Repetir revogação de vínculo já inativo retorna 204 sem novo evento/incremento. Nova concessão gera outro registro.
6. [ ] Na página da obra, listar vínculos e filtros ativo/revogado; Adicionar responsável pesquisa usuários com role Operador e paginação. O servidor revalida elegibilidade mesmo se o cliente enviar outro ID.
7. [ ] Revogar abre confirmação com pessoa/obra; conflito mantém vínculo e informa impedimentos com seus IDs legíveis quando disponíveis. Não presumir nome/número de pedido que a API não devolve nem adicionar endpoint só para decorar a mensagem.
8. [ ] Invalidar responsabilidades e revisão de configuração após sucesso; lidar com 204 sem tentar interpretar JSON. Preservar contexto da obra ao fechar os diálogos.

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

Não iniciada. Preencher cenários de concessão/revogação, revisões, comandos/resultados e evidências.
