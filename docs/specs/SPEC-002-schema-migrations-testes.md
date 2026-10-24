---
id: SPEC-002
status: verified
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

1. [x] Mapear cada entidade/relacionamento do modelo às tabelas, incluindo roles fechadas, referências opcionais, snapshots de nome/faixa/revisão e campos de decisão. Conferir todos os campos exigidos nos schemas de transporte.
2. [x] Aplicar precisões `DECIMAL(9,3)`, `DECIMAL(12,2)` e `DECIMAL(18,2)`; criar constraints de positividade/não negatividade pertinentes e nulabilidade coerente com os estados.
3. [x] Criar unicidade de e-mail normalizado, referência de pedido, posições e operador por cadeia. Adicionar índice parcial para um único vínculo ativo por obra/operador; usar migration SQL quando o Prisma não expressar a restrição.
4. [x] Definir exclusões restritas para entidades históricas; remover regra deve tornar `sourceRuleId` nulo sem remover snapshots. Definir sequência segura para referência do pedido, sem contagem de registros.
5. [x] Implementar módulo de banco e forma explícita de passar contexto transacional entre serviços. Validar conexão e desconexão sem criar abstração de persistência sem consumidor.
6. [x] Escolher hash adequado para senhas e store PostgreSQL compatível com sessão absoluta. Integrar tabela técnica de sessão com migrations; inicialização da aplicação não pode criar schema por sincronização implícita.
7. [x] Criar `db:generate` e `db:migrate`; o segundo aplica migrations versionadas, sem reset ou seed. Adicionar serviço `migrate` após banco saudável e fazer backend aguardar sua conclusão bem-sucedida.
8. [x] Criar `db:seed:base`: uma conta Admin, Amanda/João/Beatriz como Operador e dois fornecedores fictícios. Ainda não criar pedidos ou regras. Não sobrescrever senhas/dados de usuários existentes; repetição coerente não duplica, conflito é explicado.
9. [x] Criar `compose.test.yaml` e `.env.test.example`, projeto `obraflow-test`, volume/banco exclusivos, URLs efetivas verificadas e origem de testes conforme o roteiro. Implementar harness com fixtures e conexões independentes.
10. [x] Criar `test:unit` e `test:integration` com testes reais das restrições/migrations e guardas de destino. Se o destino não for explicitamente de testes, falhar antes de qualquer limpeza.

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

Comandos disponíveis neste marco; construir a imagem `backend-tools` conforme o README antes de usá-la. Integração exige o projeto isolado já iniciado conforme [SPECS.md](../../SPECS.md); não usar banco de trabalho. As suítes contêm somente comportamentos já implementados neste marco; E2E continua previsto para specs posteriores.

```powershell
docker compose -p obraflow-test --env-file .env.test -f compose.yaml -f compose.test.yaml config --quiet
docker compose -p obraflow-test --env-file .env.test -f compose.yaml -f compose.test.yaml up --build -d
docker compose --profile tools run --rm backend-tools pnpm run db:seed:base
docker compose --profile tools run --rm backend-tools pnpm run test:unit
docker compose -p obraflow-test --env-file .env.test -f compose.yaml -f compose.test.yaml --profile tools run --rm backend-tools pnpm run test:integration
```

## Registro de execução

Executada em **24/10/2026**, com persistência e testes locais reais. Escopo limitado ao schema e infraestrutura; não implementa endpoints de negócio nem autenticação HTTP.

### Implementação e decisões

- Prisma/client 6.19.3, Jest 29.7.0, ts-jest 29.4.5 e tsx 4.20.6 fixados no lockfile único. Cliente gerado fora de `src` e do Git, separadamente para Windows e Linux; OpenSSL presente nas imagens necessárias. Nenhuma dependência Prisma é exposta ao navegador.
- Migrations `202610240001_initial` e `202610240002_constraints`: dez tabelas de domínio/infraestrutura, enums fechados, decimais, snapshots, FKs restritas, `SET NULL` na origem de regra, sequência de referência, índices e checks SQL. A tabela `session` segue o layout do store escolhido, sem sincronização automática no startup.
- `DatabaseModule`/`DatabaseService` substituem a sondagem avulsa; a saúde continua fazendo `SELECT 1`. `TransactionContext` explicita o cliente que deve atravessar colaboradores na mesma transação.
- scrypt assíncrono nativo, N=131072/r=8/p=1, salt de 16 bytes por conta, comparação em tempo constante. Store escolhido: connect-pg-simple; middleware e expiração absoluta serão implementados na SPEC-004. Não foi instalada uma biblioteca de sessão sem consumidor neste marco.
- `db:generate`, `db:migrate`, `db:seed:base`, `test:unit` e `test:integration` disponíveis. Serviço `migrate` é pré-condição do backend; não faz reset ou seed. Seed base transacional, com lock consultivo, quatro contas fictícias e dois fornecedores; preserva hashes/dados em repetição e recusa conflitos com rollback.
- `compose.test.yaml`, `.env.test.example`, bootstrap `--test`, harness com dois clientes e guardas de URL/destino SQL efetivo. Detalhes e fronteiras: [persistência](../persistencia.md).

### Comandos executados e resultados

Todos os comandos partiram da raiz do repositório. Quando indicado `projeto de testes`, foram usados `-p obraflow-test --env-file .env.test -f compose.yaml -f compose.test.yaml`.

- Instalação via `corepack pnpm --filter @obraflow/backend add ...` com versões exatas e builds Docker com `pnpm install --frozen-lockfile`: passaram. Dependências e engines foram baixados durante instalação/geração; runtime não depende dessas ferramentas de desenvolvimento.
- `corepack pnpm --filter @obraflow/backend db:generate`, `corepack pnpm lint`, `corepack pnpm typecheck` e `corepack pnpm build`: passaram nas duas aplicações; tipos incluem scripts e testes do backend.
- `docker compose -f compose.yaml -f compose.dev.yaml config --quiet` e configuração equivalente do projeto de testes: passaram. Overlay de desenvolvimento validado estaticamente; não houve nova inspeção visual ou teste de hot reload nesta spec.
- `node scripts/init-env.mjs --test`: criou `.env.test` com novos segredos locais, sem imprimir valores. Arquivos de ambiente continuam ignorados pelo Git/build.
- `docker compose ... up --build -d` no projeto de testes: passou em banco/volume novos. Ambas as migrations aplicadas, serviço `migrate` concluído antes de iniciar o backend; banco e backend saudáveis. Nenhum seed automático.
- `docker compose ... --profile tools build backend-tools`: passou nos projetos local e de testes.
- `docker compose --profile tools run --rm backend-tools pnpm run lint`, `typecheck`, `test:unit` e `build`: passaram. **13 testes unitários** em duas suítes.
- `docker compose ... --profile tools run --rm backend-tools pnpm run test:integration` no projeto de testes: **22 testes passaram** em duas suítes, com PostgreSQL real. Inclui reexecução de `migrate deploy`, restrições/overflow, rollback, snapshots, referências concorrentes, vínculo ativo concorrente, sessão física, seed e guardas.
- `docker compose ... --profile tools run --rm backend-tools pnpm exec prisma validate` no projeto de testes: passou.
- Falha controlada do serviço `migrate` no projeto de testes, por overlay temporário com `command: [node, '-e', 'process.exit(17)']`: `up -d backend` retornou falha, migrate saiu com 17 e backend permaneceu parado. Overlay removido e serviços restaurados com sucesso. Essa evidência testa a dependência Compose, não uma migration SQL propositalmente corrompida.
- Inspeção SQL do banco local antes da aplicação confirmou **zero tabelas em public**. Após essa evidência, atualização local autorizada pela revisão automática: migrations aplicadas sem reset; leitura anterior ao seed mostrou zero usuários/fornecedores.
- `docker compose --profile tools run --rm backend-tools pnpm run db:seed:base`, duas execuções: passaram. `docker compose restart postgres backend` e `docker compose up -d --wait`: passaram; consulta real após reinício confirmou **4 usuários e 2 fornecedores** preservados.
- `git diff --check`: passou. Revisão de schema, SQL, código, configuração e documentação realizada; nenhum commit, push ou PR criado.
- Nginx: `nginx -t` passou; após `docker compose up --no-build -d --force-recreate backend`, mantendo o frontend em execução, a saúde via proxy voltou a HTTP 200 com `{"status":"ok"}`. Builds e `up --wait` finais dos ambientes local e de testes passaram.

### Aceite e limites

| Critério | Evidência |
| --- | --- |
| AC-002-01 | Banco de testes novo recebeu as duas migrations; reaplicação em teste preservou pedidos/itens/etapas e não criou contas; falha simulada de migrate bloqueou backend |
| AC-002-02 | Duas conexões disputaram o mesmo vínculo: um sucesso e um `P2002`; o mesmo operador manteve vínculo ativo em duas obras; nova concessão após revogação preservou o registro antigo |
| AC-002-03 | Banco recusou zero/negativo, overflow decimal, posições fora do limite/duplicadas, operador repetido por pedido, roles inválidas e FKs inválidas; limites decimais exatos preservados |
| AC-002-04 | Exclusão de regra preservou snapshots e etapas, com origem nula; exclusões físicas de usuário, obra, fornecedor e pedido histórico referenciados foram recusadas |
| AC-002-05 | Seed local explícito e repetido; integração verifica hashes, senha alterada preservada e rollback integral de conflito tardio |
| AC-002-06 | URL de trabalho recusada antes da limpeza; divergência entre URL esperada e usuário SQL efetivo também recusada; registros de teste preservados nas duas recusas |

Correção encontrada pela integração: o retorno `void` de `pg_advisory_xact_lock` precisou de cast para texto na consulta Prisma. A suíte foi repetida e passou após a correção. Na atualização do ambiente existente, a checagem pelo proxy encontrou 502 porque Nginx mantinha o IP antigo do backend. O upstream passou a usar zona compartilhada e `resolve` com DNS interno do Docker (127.0.0.11), suportado pelo Nginx 1.28 instalado. Isso preserva caminhos, Host e Origin e permite renovar o IP sem reiniciar o proxy. Avisos de subdependências descontinuadas do Jest e deploy legado do pnpm foram emitidos, sem falha de validação.

Não há endpoints de negócio, sessão autenticada, autorização, cálculos financeiros nem seed completo de pedidos neste marco. Restrições entre registros, elegibilidade, sobreposição, totais e transições pertencem aos casos de uso futuros sob bloqueio transacional. PostgreSQL arredonda escala excedente de `NUMERIC`; a futura entrada HTTP deve recusá-la antes da conversão. Fixtures e checks SQL não são prova desses fluxos futuros nem de produção.
