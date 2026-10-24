---
id: SPEC-014
status: planned
depends_on: ["SPEC-013"]
user_stories: ["US-13"]
operation_ids: []
---

# SPEC-014 — Dados de demonstração e instalação limpa

## Objetivo

Entregar uma solução que outra pessoa consiga iniciar com Docker, dados suficientes e instruções reproduzíveis, preservando o banco após reinícios e sem serviços pagos ou credenciais externas.

## Entradas e dependências

Dependência: [013](SPEC-013-experiencia-acessibilidade.md). Ler entrega no [README](../../README.md), dados demonstrativos na [visão geral](../visao-geral.md), [roteiro de infraestrutura](../../SPECS.md) e scripts efetivamente existentes.

## Escopo e entregáveis

`db:seed:demo`, cenários completos, instruções de primeira execução/reinício e validação do build compilado numa instalação independente. A carga base permanece útil para testes de autenticação; a carga demo é a opção explícita do avaliador.

## Fora do escopo

Sem reset automático no startup, reescrita de dados de trabalho, credenciais reais, dados pessoais, dependência de rede externa no runtime ou falsa comprovação de produção.

## Tarefas de execução

1. [ ] Criar seed completo com uma conta Admin, três Operadores, ao menos duas obras e dois fornecedores, responsabilidades de um operador em várias obras e cadeias/faixas distintas por obra.
2. [ ] Criar pedidos coerentes: pendente na primeira etapa, pendente na segunda, aprovado, rejeitado na segunda, solicitação por operador sem vínculo e cenário de aprovação própria manual. Totais, snapshots e histórico devem ser coerentes, não apenas flags de situação.
3. [ ] Reutilizar regras financeiras/de domínio aplicáveis para compor os dados; aplicar a carga com controle de integridade. Seed não substitui testes dos endpoints e não pode esconder divergência do fluxo real.
4. [ ] Definir reexecução: não duplicar cenários ou sobrescrever usuários/alterações humanas silenciosamente; cenário existente incompatível deve gerar diagnóstico e orientação explícita, sem apagar o banco. Documentar as contas fictícias somente como demonstração local.
5. [ ] Atualizar Compose final: banco saudável → migrations bem-sucedidas → backend pronto → frontend acessível. Testar Dockerfiles de runtime, não só dev server, com assets e fonte locais, fallback SPA, `/api`, cookie e CSRF.
6. [ ] Executar primeira instalação em outro projeto Compose chamado `obraflow-clean` e volume novo. Criar `.env.clean` local a partir do exemplo, configurar porta livre (por exemplo 18081), `APP_ORIGIN` correspondente e segredo novo; não versionar esse arquivo. Não excluir o volume de desenvolvimento para simular instalação limpa. Conferir configuração sem Node no host.
7. [ ] Rodar seed explicitamente, reiniciar/recriar containers sem excluir volume e conferir dados/sessão válida; reaplicar migrations sem modificar dados nem recriar fixtures.
8. [ ] Executar regressão completa no projeto `obraflow-test`: contrato, lint, tipos, build, unitários, integração PostgreSQL e Playwright. Preparar fixtures entre grupos; reutilizar sessões quando adequado sem neutralizar o limite de login.
9. [ ] Documentar início, parada, logs seguros, diagnóstico de porta/banco/migration, diferenças entre dev e build compilado e procedimento explícito de recriação somente em ambiente descartável.

## Critérios e cenários de aceite

- **AC-014-01:** pessoa com Docker/Compose e acesso à rede no primeiro build inicia tudo sem instalar Node, pnpm ou PostgreSQL no host e sem conta em serviço externo.
- **AC-014-02:** dados demonstram todas as situações e ambas as roles; cada conta segue permissões reais, sem seletor livre ou bypass de CSRF.
- **AC-014-03:** seed é explícito e sua repetição não duplica nem apaga dados; reinício normal e migrations não executam seed.
- **AC-014-04:** build compilado abre detalhes por URL direta, encaminha API corretamente, permite login e conclui um pedido com várias etapas.
- **AC-014-05:** banco e sessões válidas persistem após reinício; expiração absoluta continua sendo respeitada.
- **AC-014-06:** suites passam no banco isolado e instalação limpa fica registrada com comandos reais; nenhuma limpeza atingiu dados de trabalho.

## Verificação e conclusão

Executar as receitas existentes, incluindo `db:seed:demo`, em ambiente novo e depois a regressão isolada completa. Registrar projeto/porta usados, passos, resultados e eventuais limitações de rede/build. Não versionar `.env`, estado autenticado Playwright, logs sensíveis, bundles ou relatórios temporários. Distinguir prova do build compilado de prova apenas no servidor de desenvolvimento.

## Comandos de verificação

Comandos planejados, disponíveis após as tarefas e dependências desta spec. Conferir os manifests antes de executar. Integração/E2E exigem o projeto isolado já iniciado conforme [SPECS.md](../../SPECS.md); não usar banco de trabalho. Para a carga demo abaixo, configurar `.env.clean` e iniciar explicitamente `docker compose -p obraflow-clean --env-file .env.clean up --build -d`; manter esse projeto separado dos dados de trabalho.

```powershell
docker compose config --quiet
docker compose --profile tools run --rm backend-tools pnpm -w run contract:check
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
docker compose -p obraflow-clean --env-file .env.clean --profile tools run --rm backend-tools pnpm run db:seed:demo
```

## Registro de execução

Não iniciada. Preencher cenários de seed, reexecução, instalação limpa, reinício e comandos/resultados da regressão.
