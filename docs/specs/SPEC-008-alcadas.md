---
id: SPEC-008
status: planned
depends_on: ["SPEC-007"]
user_stories: ["US-03", "US-09", "US-10", "US-12"]
operation_ids: ["getRules", "replaceRules"]
---

# SPEC-008 — Configuração atômica de alçadas

## Objetivo

Entregar a configuração completa por obra: faixas sem ambiguidade, etapas ordenadas de operadores elegíveis, cobertura e edição concorrente detectada, com interface conectada.

## Entradas e dependências

Dependência: [007](SPEC-007-responsabilidades.md). Consultar seções de faixas/revisões da [visão geral](../visao-geral.md), seção 7 do [contrato](../contrato-api.md), schemas `ConfigurationInput`/`Configuration` e [design](../design-frontend.md).

## Escopo e entregáveis

GET/PUT da configuração, funções puras de validação/cobertura e página `/admin/alcadas` com edição local de faixas e etapas. Cada faixa contém cadeia completa; não herda etapas.

## Fora do escopo

Sem salvamento por pessoa/faixa isolada, herança, drag-and-drop obrigatório, alçada padrão implícita ou prévia administrativa exposta ao Operador.

## Tarefas de execução

1. [ ] Escolher e fixar biblioteca decimal antes das comparações; escrever casos de fronteira e cobertura em centavos, inclusive zero, teto financeiro e ausência de limites.
2. [ ] Implementar GET restrito ao Admin com conjunto ordenado, revisão e lacunas. Configuração vazia é válida e informa cobertura incompleta.
3. [ ] Implementar PUT completo: bloquear obra, conferir revisão, validar todas as faixas e vínculos e aplicar numa única transação. Conferir IDs existentes/omitidos/novos; nunca salvar parcialmente.
4. [ ] Recusar sobreposição, limites inválidos, operador duplicado, Admin, responsabilidade inativa/de outra obra e coleções acima dos limites; devolver caminhos específicos nos erros.
5. [ ] Incrementar revisão uma vez por PUT aceito e detectar repetição com revisão antiga. Remover regra preserva snapshots e etapas de pedidos por FK/estrutura já definida.
6. [ ] Implementar seletor pesquisável de obra e listagem de faixas com rótulos inequívocos, cobertura e mensagem de efeito somente em novos pedidos.
7. [ ] Implementar painel local de faixa e etapas com seleção de responsabilidades ativas, subir/descer por teclado e posições anunciadas. Aplicar faixa só muda o rascunho; Salvar configuração envia o conjunto.
8. [ ] Avisar antes de trocar obra/sair com edição não salva. Conflito preserva rascunho para comparação; não sobrescrever, descartar ou reenviar automaticamente.
9. [ ] Usar paginação nas obras e nos vínculos de seleção; comparar identificadores estáveis, preservando nomes de seleções já feitas sem tratar página atual como catálogo completo.

## Critérios e cenários de aceite

- **AC-008-01:** faixas até 10000.00 e acima de 10000.00 cobrem zero, limite e centavo seguinte corretamente; limites nulos não viram zero.
- **AC-008-02:** lacuna pode ser salva com aviso; sobreposição bloqueia todo o conjunto e conserva o estado anterior no banco.
- **AC-008-03:** cadeia contém somente operadores com vínculo ativo da mesma obra, sem repetição; ordem visual coincide com a persistida.
- **AC-008-04:** duas abas salvando a mesma revisão não sobrescrevem silenciosamente; uma recebe conflito com revisão atual e mantém rascunho.
- **AC-008-05:** retirar uma faixa não remove histórico/etapas de pedido fixture; reordenar configura novos pedidos sem reescrever anteriores.
- **AC-008-06:** Operador recebe 403 em GET/PUT administrativos, inclusive por URL direta; UI não revela faixas via preview de pedido.

## Verificação e conclusão

Executar unitários de faixas/cobertura, integração de atomicidade/revisão e testes de interação do editor. E2E Admin cria duas faixas, reordena etapas, salva, recarrega e encontra os mesmos dados. Testar falha de validação em uma faixa de um conjunto de várias e confirmar rollback total.

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

Não iniciada. Preencher biblioteca decimal, casos de cobertura, revisões, comandos/resultados e evidências da edição conectada.
