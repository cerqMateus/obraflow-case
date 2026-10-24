---
id: SPEC-012
status: planned
depends_on: ["SPEC-011"]
user_stories: ["US-05", "US-11", "US-12", "US-15", "US-16"]
operation_ids: []
---

# SPEC-012 — Disputas entre funcionalidades e preservação histórica

## Objetivo

Provar, com o fluxo real completo, que as proteções implementadas em cada incremento funcionam em conjunto. Corrigir regressões de integridade sem introduzir funcionalidades novas.

## Entradas e dependências

Dependência: [011](SPEC-011-decisoes.md). Revisar [transações e precedência HTTP](../contrato-api.md), [invariantes](../../AGENTS.md) e evidências das specs 007–011.

## Escopo e entregáveis

Testes concorrentes reproduzíveis, percursos de alteração de regra/cadastro após envio, revogação após conclusão e respostas a conflitos/leituras simultâneas. Ajustes de código estritamente necessários para cumprir os contratos existentes.

## Fora do escopo

Sem otimizações especulativas, fila, cache distribuído, substituição de operador, chave de idempotência nova ou alteração de regra para facilitar o teste. Locks já devem existir nas funcionalidades anteriores.

## Tarefas de execução

1. [ ] Montar cenários por HTTP com contas reais e conexões independentes. Coordenar o início das disputas e confirmar sobreposição; não usar apenas mock, chamada sequencial ou sleeps arbitrários como prova de concorrência.
2. [ ] Repetir aprovação/aprovação e aprovação/rejeição da mesma versão; conferir uma única decisão, um incremento e nenhuma etapa pulada.
3. [ ] Disputar edição de regra contra criação de pedido: o pedido captura uma revisão inteira, antiga ou nova, nunca mistura de nomes/etapas/limites.
4. [ ] Disputar duas edições de regra, concessões duplicadas e revogação contra configuração/criação/decisão; comprovar revisão, unicidade e bloqueio de vínculo em uso sem mudanças parciais.
5. [ ] Criar pedido, editar nome da obra, reordenar/remover regra e decidir o pedido antigo; conferir snapshots, ordem original e histórico. Criar outro pedido e confirmar que recebe a configuração nova.
6. [ ] Após retirar referências de regras e concluir pedidos, revogar vínculo; conferir histórico e acesso do participante antigo. Reatribuição cria vínculo novo sem alterar etapas antigas.
7. [ ] Ler lista/detalhe enquanto uma decisão conclui: cada resposta deve ser internamente coerente em situação, versão e etapa atual. Conferir que contagens respeitam acesso.
8. [ ] Simular duas abas e troca de conta no navegador; conferir conflitos, ausência de retry de mutação e impossibilidade de respostas antigas repovoarem cache privado.

## Critérios e cenários de aceite

- **AC-012-01:** toda disputa deixa uma configuração/pedido válido e resultado HTTP coerente; não existem dupla decisão, referência duplicada, vínculo ativo duplicado ou cadeia parcialmente atualizada.
- **AC-012-02:** edição/remoção administrativa afeta novos pedidos, preservando integralmente valores, nomes e cadeia do pedido anterior.
- **AC-012-03:** nenhum vínculo pode ficar revogado com etapas pendentes/futuras ativas; guardas funcionam também sob disputa real.
- **AC-012-04:** participante mantém leitura histórica após revogação, sem ganhar leitura sobre todos os pedidos da obra.
- **AC-012-05:** todos os resultados de conflito e snapshots batem com o contrato; UI exige revisão humana sem repetir a operação automaticamente.

## Verificação e conclusão

Executar a suite de integração concorrente no PostgreSQL isolado e cenários E2E de duas sessões/abas. Repetir somente disputas que ainda apresentem incerteza ou tenham sido corrigidas; não substituir evidência por uma grande quantidade de execuções sem controle. Registrar coordenação das conexões, resultados finais e limitações. Se encontrar desvio, corrigir na funcionalidade responsável e acrescentar regressão.

## Comandos de verificação

Comandos planejados, disponíveis após as tarefas e dependências desta spec. Conferir os manifests antes de executar. Integração/E2E exigem o projeto isolado já iniciado conforme [SPECS.md](../../SPECS.md); não usar banco de trabalho. As suites contêm somente comportamentos já implementados neste marco.

```powershell
docker compose --profile tools run --rm backend-tools pnpm run test:unit
docker compose -p obraflow-test --env-file .env.test -f compose.yaml -f compose.test.yaml --profile tools run --rm backend-tools pnpm run test:integration
docker compose -p obraflow-test --env-file .env.test -f compose.yaml -f compose.test.yaml --profile tools run --rm e2e pnpm run test
```

## Registro de execução

Não iniciada. Preencher matriz de disputas executadas, comandos/resultados, estado final verificado e correções necessárias.
