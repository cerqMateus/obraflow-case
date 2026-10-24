---
id: SPEC-003
status: verified
depends_on: ["SPEC-001", "SPEC-002"]
user_stories: ["US-12", "US-13"]
operation_ids: []
---

# SPEC-003 — Base HTTP, erros e contrato verificável

## Objetivo

Preparar o Nest para que as próximas funcionalidades compartilhem validação estrita, configuração, respostas seguras, saúde operacional e testes HTTP, sem copiar infraestrutura em cada controller.

## Entradas e dependências

Dependências: [001](SPEC-001-base-workspace-docker.md) e [002](SPEC-002-schema-migrations-testes.md). Ler [contrato](../contrato-api.md), [OpenAPI](../openapi.json) e [AGENTS.md](../../AGENTS.md).

## Escopo e entregáveis

Configuração validada, prefixo `/api/v1`, validação de fronteiras, mapeamento de erros, correlação segura, cabeçalhos e helpers restritos de paginação/serialização. Validador de OpenAPI e healthchecks técnicos; ainda sem endpoints de negócio.

## Fora do escopo

Não gerar controllers que retornam fixtures ou sucesso fictício. Não liberar operações privadas antes da autenticação. Não expor todo o processo/configuração em healthchecks ou logs.

## Tarefas de execução

1. [x] Validar configurações ao iniciar: banco, segredo de sessão, origem pública, ambiente e porta. Recusar placeholder/ausência de segredo e configurações incompatíveis de cookie/origem; nunca imprimir valores sensíveis.
2. [x] Configurar corpos JSON, limite de 1 MiB, DTOs com validação de campos extras e tipos, query estrita e UUIDs na fronteira. Não converter strings monetárias em ponto flutuante nem aceitar conversão permissiva de booleanos/paginação.
3. [x] Implementar envelope de erro único e códigos do contrato; traduzir falhas previsíveis do banco sem vazar SQL ou stack. Validar que erros de parsers, corpo grande e Content-Type também seguem o envelope.
4. [x] Gerar UUID de correlação no servidor, retornar `X-Request-Id` e `error.requestId`, aplicar `Cache-Control: no-store` e logs com redaction. Não confiar cegamente num ID enviado pelo cliente.
5. [x] Centralizar parsing de página/filtros e projeções explícitas de resposta, com contagens autorizadas nas futuras operações. Não criar serializador que retorna modelos Prisma completos.
6. [x] Disponibilizar `/health/live` e `/health/ready` internos; ready verifica banco e migrations aplicadas e retorna somente estado mínimo. Configurar healthcheck backend e dependência do frontend sem adicionar saúde à API de negócio.
7. [x] Criar `contract:check` na raiz para validar OpenAPI, referências, exemplos de requests/respostas e unicidade de operationIds. Servir o contrato planejado em `/api/docs` com aviso de operações ainda não implementadas; retirar esse aviso apenas quando houver evidência completa.
8. [x] Testar HTTP via Supertest e PostgreSQL isolado; fixtures/controllers de teste não são exportados para o runtime. Conferir que health e documentação não expõem dados de negócio.

## Critérios e cenários de aceite

- **AC-003-01:** entrada com tipo errado, campo extra, UUID inválido, query duplicada ou paginação inválida gera erro previsível sem conversão silenciosa.
- **AC-003-02:** erro inesperado retorna `500 INTERNAL_ERROR` seguro, com o mesmo request ID do cabeçalho e registro técnico sem segredos.
- **AC-003-03:** limite de corpo e tipo de mídia retornam 413/415 no formato definido; `204` não recebe envelope artificial.
- **AC-003-04:** ready muda conforme disponibilidade do banco; falha de banco não equivale a lista vazia ou sucesso.
- **AC-003-05:** OpenAPI e todos os seus exemplos são validados, sem confundir isso com prova de endpoints implementados.

## Verificação e conclusão

Executar `contract:check` nas ferramentas apropriadas da raiz, lint/tipos/build do backend e `test:integration`. Usar chamadas HTTP para exercitar os erros comuns e saúde; interromper somente o banco de testes para verificar readiness. Registrar evidências de erro/correlação e de que o ambiente de trabalho não foi afetado.

## Comandos de verificação

Comandos planejados, disponíveis após as tarefas e dependências desta spec. Conferir os manifests antes de executar. Integração/E2E exigem o projeto isolado já iniciado conforme [SPECS.md](../../SPECS.md); não usar banco de trabalho. As suites contêm somente comportamentos já implementados neste marco.

```powershell
docker compose --profile tools run --rm backend-tools pnpm -w run contract:check
docker compose --profile tools run --rm backend-tools pnpm run lint
docker compose --profile tools run --rm backend-tools pnpm run typecheck
docker compose --profile tools run --rm backend-tools pnpm run build
docker compose -p obraflow-test --env-file .env.test -f compose.yaml -f compose.test.yaml --profile tools run --rm backend-tools pnpm run test:integration
```

## Registro de execução

Executada e verificada localmente em **24/10/2026**. Escopo limitado à base HTTP; nenhuma operação de negócio ou autenticação foi implementada.

### Implementação e decisões

- Configuração de início validada antes de criar o Nest: URL PostgreSQL completa, segredo de sessão, ambiente explícito (`APP_ENV`), origem canônica e porta. HTTP somente local; produção exige HTTPS. Cookie futuro deriva segurança do protocolo; configuração contraditória é recusada. Falha de início imprime apenas mensagem segura.
- Prefixo `/api/v1`, DTOs fechados, conversão implícita desabilitada, query simples sem duplicatas, helpers explícitos para booleanos/paginação/UUID e projeção de listas com callback obrigatório. Contagens autorizadas e DTOs específicos serão responsabilidade das operações futuras.
- Parser JSON limitado a 1 MiB; corpo com mídia incompatível, charset/encoding inválido, JSON malformado e excesso seguem o envelope. Nginx encaminha o fluxo à API sem antecipar um 413 em HTML. Respostas de sucesso não recebem envelope; 204 permanece vazio.
- Correlação UUID gerada no servidor, sem aceitar ID do cliente, `no-store` e cabeçalhos seguros. Filtro global usa mensagens públicas controladas; logs permitem somente evento, requestId, status e código. Erros previsíveis do Prisma são traduzidos apenas quando inequívocos; conflitos de domínio precisam de contexto no caso de uso.
- Readiness consulta PostgreSQL e confirma as migrations empacotadas; liveness não depende do banco. Saúde continua fora do OpenAPI de negócio. A rota técnica temporária existente foi preservada com a mesma checagem de prontidão.
- Swagger serve o arquivo versionado e identifica o contrato como planejado, sem envio de requisições nem validação externa. Documento e migrations são copiados à imagem final; fixtures e controllers de teste permanecem somente em `backend/test`.
- `contract:check` valida estrutura OpenAPI 3.0.3, referências locais, unicidade de operationIds e exemplos com Ajv/formats. Referências externas e exemplos externos são recusados para manter a verificação local e reproduzível. `contract:test` comprova rejeição de documentos corrompidos em memória.
- Dependências novas foram fixadas no único lockfile: class-validator 0.14.2, class-transformer 0.5.1, Express 5.1.0, swagger-ui-express 5.0.1, Supertest 7.1.4, Swagger Parser 12.1.0, Ajv 8.17.1 e ajv-formats 3.0.1, além dos tipos. Documentação NestJS e Swagger Parser consultada via Context7.

### Comandos e resultados

Todos os comandos Compose de integração usaram `-p obraflow-test --env-file .env.test -f compose.yaml -f compose.test.yaml`. Os primeiros testes Linux montaram `backend/src` e `backend/test` finais como somente leitura enquanto as imagens eram construídas; a imagem final também foi exercitada por HTTP real.

- `corepack pnpm run contract:check` e `contract:test`: passaram no host; repetidos pelo serviço backend-tools com `pnpm -w run contract:check` e `contract:test`: passaram. **21 operações planejadas, 159 ocorrências de exemplos após dereferenciar, 4 testes de regressão**.
- Backend `typecheck`, `lint`, `test:unit` e `build`: passaram no host. Depois das últimas adições, `lint`, `typecheck` e `test:unit` passaram no serviço backend-tools: **41 testes unitários em 3 suítes**.
- `docker compose ... --profile tools run --rm ... backend-tools pnpm run test:integration`: **52 testes em 3 suítes passaram**, incluindo os 22 testes de persistência anteriores e 30 cenários HTTP. PostgreSQL real e destino isolado verificado antes de fixtures e da alteração temporária da marca de migration.
- `docker compose ... --profile tools build backend-tools backend frontend`: passou, incluindo geração Prisma, instalação com lockfile congelado e builds backend/frontend. `docker compose ... up --no-build -d --wait`: passou. Configurações Compose local/teste e `nginx -t`: passaram.
- Chamadas reais dentro da imagem final e através do Nginx: saúde 200; rotas privadas não implementadas e `/api/v1/probe` 404; Swagger/JSON do contrato 200; erro JSON 400, tipo de mídia 415 e corpo excessivo 413, todos com correlação e `no-store`.
- `docker stop obraflow-test-postgres-1`: somente o banco de testes foi interrompido. Readiness respondeu **503 INTERNAL_ERROR**, liveness **200**. `docker start obraflow-test-postgres-1` foi garantido por `finally`; readiness recuperou **200** e o ambiente terminou saudável.
- Ambiente de trabalho preservado: `obraflow-backend-1` manteve início `2026-10-24T22:53:03.445003394Z` e `obraflow-postgres-1` manteve início `2026-10-24T22:46:31.223280036Z`, ambos sem reinícios. Após o ensaio, HTTP em `localhost:8080/api/technical-status` e `localhost:18080/api/technical-status` retornou 200. Nenhum reset/seed executado no banco de trabalho.
- `git diff --check`: passou. Fontes, configuração, testes, documentação e alterações do lockfile revisados; nenhum commit, push ou PR criado.

### Aceite e amostras sanitizadas

| Critério | Evidência |
| --- | --- |
| AC-003-01 | Supertest recusa tipo monetário numérico, campo extra, UUID inválido, query duplicada, booleano não literal e paginação inválida; mantém string decimal e defaults explícitos |
| AC-003-02 | Erro inesperado retorna 500 seguro; header e envelope compartilham UUID gerado; teste de log confirma ausência das mensagens sensíveis simuladas |
| AC-003-03 | Parser e proxy retornam 400/413/415 padronizados; exatamente 1 MiB é aceito na fixture; 204 permanece sem corpo |
| AC-003-04 | Migration temporariamente indisponível e PostgreSQL parado geram readiness 503; liveness continua 200; restauração recupera prontidão |
| AC-003-05 | Validação OpenAPI e exemplos passou; regressões recusam referências/IDs/exemplos inválidos; Swagger avisa que operações ainda são planejadas |

Exemplo real de excesso de corpo pelo proxy (correlação pública, sem dados privados):

```json
{"error":{"code":"PAYLOAD_TOO_LARGE","message":"O corpo excede o limite de 1 MiB.","fields":[],"details":{},"requestId":"50489705-9bb1-45ab-94cb-53e9fcd28d3f"}}
```

Na interrupção do banco de testes: readiness 503 com `error.requestId` igual a `X-Request-Id` (`f0949dfa-da5f-44b1-8f6b-9712d6f1751a`); após reinício, 200 com `{"status":"ok"}`.

### Limites

Não há autenticação, sessão HTTP, autorização de domínio ou endpoints privados neste marco. Testes de fronteira usam controllers exclusivos da suíte; não provam operações futuras nem produção. Tradução Prisma tem cobertura unitária e a persistência continua coberta por integração real; conflitos de domínio e contagens autorizadas só poderão ser comprovados quando existirem consumidores. Swagger foi verificado por HTTP, sem inspeção visual em navegador. O ambiente de trabalho não foi atualizado para as novas imagens; a execução final foi feita somente em `obraflow-test`.

O sandbox inicialmente bloqueou DNS do Corepack, acesso Docker e HTTP local; as mesmas verificações passaram com execução autorizada fora dele. O primeiro build revelou que `.dockerignore` excluía o OpenAPI: foi corrigido para incluir exclusivamente esse arquivo de `docs`. Avisos de subdependências descontinuadas, scripts de instalação ignorados e deploy legado do pnpm não causaram falhas; Prisma é gerado explicitamente no build.
