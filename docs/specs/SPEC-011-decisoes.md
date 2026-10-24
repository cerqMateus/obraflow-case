---
id: SPEC-011
status: planned
depends_on: ["SPEC-010"]
user_stories: ["US-06", "US-07", "US-08", "US-11", "US-12", "US-16"]
operation_ids: ["decideOrder"]
---

# SPEC-011 — Aprovação sequencial e rejeição

## Objetivo

Concluir o fluxo de compras com decisões reais no detalhe, incluindo aprovação própria manual, rejeição motivada, ordem rígida e proteção contra repetição/concorrência.

## Entradas e dependências

Dependência: [010](SPEC-010-cadastro-pedidos.md). Ler seção 10 do [contrato](../contrato-api.md), `DecisionInput`, situações/ações e diálogos do [design](../design-frontend.md).

## Escopo e entregáveis

`POST /purchase-orders/{orderId}/decisions`, casos de uso distintos para aprovar e rejeitar e controles/diálogos conectados no detalhe. Implementar as duas decisões juntas porque compartilham o mesmo endpoint e contrato.

## Fora do escopo

Sem aprovação por Admin, edição/reabertura, delegação, aprovação em massa, decisão paralela, avanço otimista ou substituição de operador. Não usar novos botões da interface para contornar o endpoint.

## Tarefas de execução

1. [ ] Validar o input discriminado: `approve` sem motivo; `reject` com motivo após trim de 1–1000 caracteres. Não aceitar autoria/instante/situação arbitrários.
2. [ ] Aplicar a ordem de autorização/validação do contrato: identidade, acesso de leitura, role, versão, situação/etapa e atribuição ativa. Não revelar detalhes de conflito a quem não pode ler o pedido.
3. [ ] Bloquear obra antes do pedido e fazer todas as verificações protegidas/escritas na mesma transação. Conferir `stepId`, `expectedVersion`, vínculo ativo e operador atual novamente antes de gravar.
4. [ ] Aprovação intermediária conclui somente a etapa atual e libera a próxima; última aprovação conclui pedido. Cada sucesso incrementa versão uma vez e registra autor/instante.
5. [ ] Rejeição persiste motivo e encerra pedido; marcar futuras `skipped` sem decisões inventadas, preservando decisões anteriores.
6. [ ] Aprovação própria obedece exatamente à mesma verificação; não criar proibição por autoria nem autorização só pelo vínculo na obra.
7. [ ] Implementar confirmação de aprovação com referência/valor e diálogo de rejeição com motivo, foco/cancelamento e estado pendente. Não aprovar direto pela linha da lista.
8. [ ] Após sucesso, apresentar resposta persistida e atualizar detalhes/listas. Após conflito, explicar alteração e recarregar sem repetir a decisão. Em falha incerta, orientar conferência do estado atual.
9. [ ] Remover avisos de decisão ainda não implementada da SPEC-009. Admin continua em apresentação de consulta; Operador em pedido final vê decisões desabilitadas com explicação; etapa futura informa responsável atual.

## Critérios e cenários de aceite

- **AC-011-01:** numa cadeia Amanda → João, João não decide antes; Amanda aprova, pedido permanece pendente, somente João passa a poder decidir; João aprova e conclui.
- **AC-011-02:** solicitante Amanda aprova a própria etapa; caso sua etapa seja a segunda, aguarda a primeira. Ter vínculo sem etapa atribuída não permite decidir.
- **AC-011-03:** rejeitar na segunda etapa mantém a primeira aprovação, registra motivo/autor/instante e impede qualquer decisão posterior.
- **AC-011-04:** Admin e conta errada não conseguem decidir via HTTP direto; conta sem acesso recebe 404 sem dados de cadeia/versão.
- **AC-011-05:** duas decisões concorrentes da mesma etapa/versão geram uma única transição e um conflito; aprovação e rejeição não coexistem na mesma etapa.
- **AC-011-06:** motivos vazios/só espaços são recusados nas duas fronteiras; 409 não descarta silenciosamente o contexto nem causa reenvio.
- **AC-011-07:** diálogos operam por teclado, devolvem foco e não mostram sucesso antes do commit confirmado.

## Verificação e conclusão

Executar unitários de transição, HTTP negativo/positivo e disputa com conexões independentes no PostgreSQL. E2E com contas reais cria pedido, troca sessão para cada responsável e completa aprovação/rejeição; incluir aprovação própria e ações finais. Registrar que M3 agora tem fluxo completo, sem adiar a segurança para a próxima spec.

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

Não iniciada. Preencher transições, disputas, cenários por conta, comandos/resultados e inspeção dos diálogos.
