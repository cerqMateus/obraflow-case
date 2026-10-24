# Persistência — SPEC-002

Este marco implementa schema e infraestrutura, sem endpoints de negócio. O contrato HTTP não mudou. As fixtures de testes não são uma API nem o seed de demonstração completo da SPEC-014.

## Modelo físico

Fonte executável: `backend/prisma/schema.prisma` e migrations em `backend/prisma/migrations/`.

| Tabela | Dados e integridade |
| --- | --- |
| `User` | UUID, nome, e-mail normalizado único, hash, enum fechado `admin`/`operator` |
| `session` | Layout técnico do connect-pg-simple: `sid`, `sess` JSON e `expire`, com índice de expiração |
| `Project` | Nome e revisão de regras iniciada em zero |
| `Supplier` | Identidade e nome |
| `ProjectResponsibility` | Obra, operador, autor/instante da concessão e revogação; índice parcial único para vínculo ativo; registros revogados permanecem |
| `ApprovalRule` | Obra, limites opcionais `DECIMAL(18,2)`; limite inferior exclusivo e superior inclusivo |
| `RuleStep` | Regra, vínculo e posição 1–20; posição e vínculo únicos por regra |
| `PurchaseOrder` | Referência gerada por sequência, relacionamentos, data civil, notas, total, status, posição atual, versão, criação e snapshots de obra/fornecedor/faixa/revisão |
| `OrderItem` | Posição 1–100 única por pedido, descrição, unidade, quantidade `DECIMAL(9,3)`, preço `DECIMAL(12,2)`, total `DECIMAL(18,2)` |
| `ApprovalStep` | Atribuição histórica ao vínculo/operador, nome copiado, posição e operador únicos por pedido, status, autor/instante e motivo de decisão |

As exclusões são restritas para referências históricas. Excluir regra remove suas etapas de configuração e torna `sourceRuleId` nulo nos pedidos, preservando snapshots e etapas históricas. A sequência `purchase_order_reference_seq` gera `PO-<n>` de forma concorrente; lacunas após rollback são esperadas. Não deriva da contagem de registros.

Checks SQL cobrem positividade/não negatividade, intervalos de posições, revisão/versão, limites ordenados, revogação completa e campos de decisão coerentes com o status. Usuários referenciados, obras, fornecedores e vínculos não desaparecem em cascata.

As regras entre registros continuam a cargo dos casos de uso futuros, dentro de transação com bloqueio da obra: role/elegibilidade, mesma obra e operador do vínculo, sobreposição, cadeia não vazia/contígua, contagem mínima de itens, totais calculados e transições. As constraints não equivalem à implementação dessas operações. PostgreSQL rejeita overflow de `NUMERIC`, mas arredonda escala excedente; a API deverá recusar precisão excedente **antes** de converter/gravar. O teste documenta essa fronteira, sem afirmar que o banco rejeita a entrada original.

## Acesso e transações

Prisma ORM/client **6.19.3** fixados, com geração explícita fora de `src` para não colidir com o volume de desenvolvimento. O cliente gerado não é versionado; a imagem final recebe seu próprio cliente Linux e apenas dependências de produção. OpenSSL está instalado nos estágios de ferramentas e execução.

`DatabaseModule` exporta `DatabaseService`, responsável pela conexão/desconexão. Casos de uso usam `database.$transaction(async (tx) => ...)` e passam `TransactionContext` explicitamente aos colaboradores. Não usar o cliente global para leituras ou escritas integrantes da mesma operação. A suíte prova rollback com esse contexto e disputa com dois clientes independentes. Não há repositories genéricos.

As variáveis `POSTGRES_*` formam a URL com credenciais codificadas. `DATABASE_URL`, quando explicitamente fornecida, prevalece; ferramentas de teste exigem igualdade com `TEST_DATABASE_URL` e destino isolado. Não imprimir URLs/credenciais em logs.

## Hash e sessão

Senhas usam `node:crypto.scrypt` assíncrono: N=131072, r=8, p=1, salt aleatório de 16 bytes por conta, chave de 64 bytes e teto de memória de 256 MiB por derivação. O hash armazena algoritmo/parâmetros/salt; verificação usa comparação de tempo constante e recusa formatos/parâmetros inesperados. O seed nunca altera hashes existentes.

Store escolhido: **connect-pg-simple**, compatível com express-session e `pg`. Sua tabela é criada exclusivamente pela migration. A biblioteca e o middleware serão instalados e integrados na SPEC-004, com `createTableIfMissing: false`, `disableTouch: true`, `rolling: false`, prazo absoluto e timestamp de autenticação mantido em `sess`. Desabilitar touch sozinho não basta: o código de sessão também deverá preservar e validar o prazo absoluto em saves, com 8 horas após login e 15 minutos no bootstrap anônimo. Cookie, CSRF, origem e logout ainda não estão implementados.

## Seed base

Executado somente por `db:seed:base`; migrations e startup não fazem seed. Cria Admin, Amanda, João, Beatriz e dois fornecedores fictícios. IDs estáveis e lock consultivo serializam execuções concorrentes; tudo ocorre em uma transação. Repetição mantém dados e hashes; divergência de ID/e-mail/nome/role ou fornecedor causa erro explícito e rollback, sem sobrescrita. Não cria obras, responsabilidades, regras nem pedidos neste marco.

## Isolamento dos testes

`compose.test.yaml` usa projeto `obraflow-test`, banco/usuário `obraflow_test`, volume `obraflow-test_postgres-test-data`, rede própria, porta 18080 e origem `http://frontend`. A limpeza inclui apenas tabelas de fixtures, sem reset de migrations ou sequência.

Antes de conectar, o harness exige `NODE_ENV=test`, projeto correto, URLs iguais, host `postgres`, porta 5432, banco exato, sem query/fragmento e `POSTGRES_DB` coerente. Antes de **cada** limpeza, confere também banco, usuário, porta e schema efetivos por SQL. Uma URL de trabalho é recusada antes da limpeza; não é necessário conectar ao banco de trabalho para provar a guarda. Execute as suítes sequencialmente e sem E2E concorrente no mesmo banco.

Referências consultadas via Context7: [Prisma 6.19.3](https://github.com/prisma/prisma/tree/6.19.3), [layout e opções do connect-pg-simple](https://github.com/voxpelli/node-connect-pg-simple), [scrypt e comparação no Node 24](https://nodejs.org/docs/latest-v24.x/api/crypto.html).
