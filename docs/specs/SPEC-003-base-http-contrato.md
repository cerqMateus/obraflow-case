---
id: SPEC-003
status: planned
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

1. [ ] Validar configurações ao iniciar: banco, segredo de sessão, origem pública, ambiente e porta. Recusar placeholder/ausência de segredo e configurações incompatíveis de cookie/origem; nunca imprimir valores sensíveis.
2. [ ] Configurar corpos JSON, limite de 1 MiB, DTOs com validação de campos extras e tipos, query estrita e UUIDs na fronteira. Não converter strings monetárias em ponto flutuante nem aceitar conversão permissiva de booleanos/paginação.
3. [ ] Implementar envelope de erro único e códigos do contrato; traduzir falhas previsíveis do banco sem vazar SQL ou stack. Validar que erros de parsers, corpo grande e Content-Type também seguem o envelope.
4. [ ] Gerar UUID de correlação no servidor, retornar `X-Request-Id` e `error.requestId`, aplicar `Cache-Control: no-store` e logs com redaction. Não confiar cegamente num ID enviado pelo cliente.
5. [ ] Centralizar parsing de página/filtros e projeções explícitas de resposta, com contagens autorizadas nas futuras operações. Não criar serializador que retorna modelos Prisma completos.
6. [ ] Disponibilizar `/health/live` e `/health/ready` internos; ready verifica banco e migrations aplicadas e retorna somente estado mínimo. Configurar healthcheck backend e dependência do frontend sem adicionar saúde à API de negócio.
7. [ ] Criar `contract:check` na raiz para validar OpenAPI, referências, exemplos de requests/respostas e unicidade de operationIds. Servir o contrato planejado em `/api/docs` com aviso de operações ainda não implementadas; retirar esse aviso apenas quando houver evidência completa.
8. [ ] Testar HTTP via Supertest e PostgreSQL isolado; fixtures/controllers de teste não são exportados para o runtime. Conferir que health e documentação não expõem dados de negócio.

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

Não iniciada. Preencher configuração/infraestrutura criada, comandos/resultados, amostras sanitizadas e pendências.
