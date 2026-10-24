---
id: SPEC-002
status: planned
depends_on: ["SPEC-001"]
user_stories: ["US-13"]
operation_ids: []
---

# SPEC-002 — Schema, migrations e isolamento de testes

## Objetivo

Estabelecer a persistência completa do domínio e a infraestrutura de testes que permitirá implementar funcionalidades pequenas sem refazer a base ou usar banco de trabalho para limpeza de fixtures.

## Entradas e dependências

Dependência: [SPEC-001](SPEC-001-base-workspace-docker.md). Ler [modelo e invariantes](../visao-geral.md), [limites e revisão](../contrato-api.md) e [roteiro](../../SPECS.md).

## Escopo e entregáveis

Schema Prisma, migrations SQL, módulo de banco, contas/suprimentos iniciais, fixtures isoladas e scripts de testes. Criar tabelas previstas para usuários, sessões, obras, fornecedores, responsabilidades, faixas, etapas de regra, pedidos, itens e etapas de pedido. Criar o schema não significa implementar seus endpoints.

## Fora do escopo

Sem API de negócio, seed de pedidos demonstrativos completos, interface administrativa ou repositories genéricos. Biblioteca decimal e store de sessão devem ser escolhidos/documentados antes do primeiro uso; instalar dependências apenas quando necessárias.

## Tarefas de execução

1. [ ] Mapear cada entidade/relacionamento do modelo às tabelas, incluindo roles fechadas, referências opcionais, snapshots de nome/faixa/revisão e campos de decisão. Conferir todos os campos exigidos nos schemas de transporte.
2. [ ] Aplicar precisões `DECIMAL(9,3)`, `DECIMAL(12,2)` e `DECIMAL(18,2)`; criar constraints de positividade/não negatividade pertinentes e nulabilidade coerente com os estados.
3. [ ] Criar unicidade de e-mail normalizado, referência de pedido, posições e operador por cadeia. Adicionar índice parcial para um único vínculo ativo por obra/operador; usar migration SQL quando o Prisma não expressar a restrição.
4. [ ] Definir exclusões restritas para entidades históricas; remover regra deve tornar `sourceRuleId` nulo sem remover snapshots. Definir sequência segura para referência do pedido, sem contagem de registros.
5. [ ] Implementar módulo de banco e forma explícita de passar contexto transacional entre serviços. Validar conexão e desconexão sem criar abstração de persistência sem consumidor.
6. [ ] Escolher hash adequado para senhas e store PostgreSQL compatível com sessão absoluta. Integrar tabela técnica de sessão com migrations; inicialização da aplicação não pode criar schema por sincronização implícita.
7. [ ] Criar `db:generate` e `db:migrate`; o segundo aplica migrations versionadas, sem reset ou seed. Adicionar serviço `migrate` após banco saudável e fazer backend aguardar sua conclusão bem-sucedida.
8. [ ] Criar `db:seed:base`: uma conta Admin, Amanda/João/Beatriz como Operador e dois fornecedores fictícios. Ainda não criar pedidos ou regras. Não sobrescrever senhas/dados de usuários existentes; repetição coerente não duplica, conflito é explicado.
9. [ ] Criar `compose.test.yaml` e `.env.test.example`, projeto `obraflow-test`, volume/banco exclusivos, URLs efetivas verificadas e origem de testes conforme o roteiro. Implementar harness com fixtures e conexões independentes.
10. [ ] Criar `test:unit` e `test:integration` com testes reais das restrições/migrations e guardas de destino. Se o destino não for explicitamente de testes, falhar antes de qualquer limpeza.

## Critérios e cenários de aceite

- **AC-002-01:** banco novo recebe todas as migrations; reaplicá-las não altera dados nem executa seed; migration com falha impede o backend de ser considerado pronto.
- **AC-002-02:** duas concessões simultâneas não conseguem criar dois vínculos ativos para o mesmo par; usuário pode ter vínculos em obras distintas.
- **AC-002-03:** valores fora da precisão/constraints, posições duplicadas e referências históricas inválidas são recusados pelo banco quando aplicável.
- **AC-002-04:** exclusão de regra preserva pedido e suas etapas; exclusão física de usuário/obra/fornecedor referenciado é impedida.
- **AC-002-05:** seed base executado explicitamente produz contas com hashes e fornecedores; repetição não apaga nem duplica dados.
- **AC-002-06:** suíte confirma isolamento do banco; configurar URL de trabalho faz o harness recusar limpeza, sem apagar esse banco.

## Verificação e conclusão

No projeto de testes, aplicar migrations em banco vazio e reaplicar; executar `test:unit` e `test:integration` em `backend-tools`. Conferir constraints por inserts controlados e conexões independentes. No ambiente local, executar explicitamente o seed base e reiniciar os serviços. Registrar que fixtures provam persistência/restrições, não endpoints ainda ausentes.

## Comandos de verificação

Comandos planejados, disponíveis após as tarefas e dependências desta spec. Conferir os manifests antes de executar. Integração/E2E exigem o projeto isolado já iniciado conforme [SPECS.md](../../SPECS.md); não usar banco de trabalho. As suites contêm somente comportamentos já implementados neste marco.

```powershell
docker compose -p obraflow-test --env-file .env.test -f compose.yaml -f compose.test.yaml config --quiet
docker compose -p obraflow-test --env-file .env.test -f compose.yaml -f compose.test.yaml up --build -d
docker compose --profile tools run --rm backend-tools pnpm run db:seed:base
docker compose --profile tools run --rm backend-tools pnpm run test:unit
docker compose -p obraflow-test --env-file .env.test -f compose.yaml -f compose.test.yaml --profile tools run --rm backend-tools pnpm run test:integration
```

## Registro de execução

Não iniciada. Preencher migrations, decisões de hash/store, índices, comandos/resultados, destino de testes validado e pendências.
