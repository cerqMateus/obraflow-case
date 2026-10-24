---
id: SPEC-009
status: planned
depends_on: ["SPEC-008"]
user_stories: ["US-04", "US-05", "US-08", "US-12"]
operation_ids: ["listOrders", "getOrder"]
---

# SPEC-009 — Lista, detalhes e histórico de pedidos

## Objetivo

Permitir consultar pedidos reais do banco com a política de acesso correta e compreender sua cadeia antes de implementar cadastro e decisões pela interface.

## Entradas e dependências

Dependência: [008](SPEC-008-alcadas.md). Ler seção 9 do [contrato](../contrato-api.md), schemas `OrderSummaryPage`/`Order` e superfícies Pedidos/Detalhe do [design](../design-frontend.md).

## Escopo e entregáveis

GET de pedidos e de detalhes, consultas autorizadas e consistentes, `/pedidos` e `/pedidos/:orderId`. Para testes e inspeção inicial, carregar cenários coerentes somente no projeto isolado, sem inventar endpoints de criação ou fallback em memória.

## Fora do escopo

Sem criar/editar pedido, registrar decisão, agregações globais, dashboard, aprovação na linha ou exportação. Fixture não comprova criação/decisão ainda não implementadas.

## Tarefas de execução

1. [ ] Criar fixtures isoladas de pedidos próprios, de terceiros com participação, de terceiros sem participação, pendentes em diferentes etapas e concluídos. Registrar todos os itens, snapshots e decisões coerentes.
2. [ ] Implementar política única de leitura: Admin global; Operador próprio ou participante em qualquer etapa, inclusive após conclusão/revogação. Aplicá-la antes da contagem e também na consulta por ID.
3. [ ] Implementar filtros/paginação/ordem no banco. `mineOnly` e `awaitingMyDecision` true são restritos a Operador; filtros combinam por AND e não ampliam o conjunto autorizado.
4. [ ] Projetar cabeçalho, etapas e itens numa visão consistente. Evitar N+1; resumo inclui cadeia completa dentro do limite, e detalhe inclui itens, snapshot, histórico e observações.
5. [ ] Calcular `availableActions` pelo contexto atual e precedência do contrato, sem conceder poder novo. Projeto/fornecedor/operadores mantêm seus nomes históricos.
6. [ ] Implementar tabela ampla e blocos móveis com todos os campos exigidos. Filtros e página ficam na URL; voltar de detalhes preserva contexto. Manter link de detalhe acessível por teclado.
7. [ ] Implementar detalhe com itens, cadeia vertical de até 20 etapas e histórico; Admin tem apresentação de consulta. Operador vê razões de indisponibilidade, inclusive conclusão e etapa futura.
8. [ ] Não habilitar controles de decisão antes da SPEC-011. Botões de indisponibilidade por estado precisam de texto; eventual aviso transitório de funcionalidade não pronta deve ser removido na spec responsável.
9. [ ] Tratar vazio real, filtro sem resultados, loading, erro/retry, 404 e sessão expirada sem revelar existência ou dados de pedido alheio.

## Critérios e cenários de aceite

- **AC-009-01:** Operador vê próprios/participantes e não vê os demais; listagem, contagem, filtros e GET por ID concordam. Um vínculo na obra, sem participação/autoria, não concede leitura adicional.
- **AC-009-02:** chamadas por ID de pedido alheio e inexistente têm a mesma resposta pública 404, sem cadeia ou detalhes de conflito.
- **AC-009-03:** Admin consulta todos, mas não recebe ações de decisão; futuras/concluídas são distinguíveis sem depender de cor.
- **AC-009-04:** a lista informa data, obra, fornecedor, itens, total, situação e etapa; detalhe não omite valores dos itens nem motivos de rejeição.
- **AC-009-05:** nomes e histórico de snapshots continuam iguais após alteração de nome/regra em fixtures; leitura não mistura versão nova com etapa antiga.
- **AC-009-06:** filtros alcançam outras páginas e funcionam com reload/retorno; vazios e erros de API têm tratamentos distintos.

## Verificação e conclusão

Executar integração HTTP de acesso, filtros, contagens e leitura consistente; frontend para filtros/estados e E2E de consulta contra banco com fixtures. Inspecionar tabela/blocos móveis e histórico longo. Identificar a evidência como consulta real a fixtures persistidas; fluxo de criação será acrescentado na próxima spec.

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

Não iniciada. Preencher políticas de consulta, cenários por identidade, comandos/resultados e inspeção.
