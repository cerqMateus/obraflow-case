---
id: SPEC-004
status: planned
depends_on: ["SPEC-002", "SPEC-003"]
user_stories: ["US-01", "US-12"]
operation_ids: ["getCsrf", "login", "logout", "getCurrentSession"]
---

# SPEC-004 — Sessão, CSRF e autorização no backend

## Objetivo

Concluir uma base de identidade confiável por HTTP antes de desenvolver as funcionalidades do produto. O marco termina com login real, sessão PostgreSQL, CSRF e roles, sem depender do frontend.

## Entradas e dependências

Dependências: [002](SPEC-002-schema-migrations-testes.md) e [003](SPEC-003-base-http-contrato.md). Ler as seções 2 e 3 do [contrato](../contrato-api.md), os schemas `Session`, `Csrf`, `LoginInput` e a matriz da [visão geral](../visao-geral.md).

## Escopo e entregáveis

Implementar `GET /auth/csrf`, `POST /auth/login`, `GET /auth/me` e `POST /auth/logout`; guards de sessão e role, identidade derivada no servidor, verificação de origem/CSRF e limite de login.

## Fora do escopo

Não criar JWT, refresh token, cadastro público, recuperação de senha, terceira role ou seletor de identidade. Não persistir cookie/token em localStorage nem desligar segurança para testes.

## Tarefas de execução

1. [ ] Integrar o store PostgreSQL escolhido às migrations e ao módulo de sessão. Persistir expiração absoluta e conferir no servidor; desabilitar renovação por atividade, inclusive em mecanismos de touch do store.
2. [ ] Implementar bootstrap anônimo de até 15 minutos; reutilizar sessão válida sem prolongar prazo. Token CSRF vinculado à sessão é devolvido ao cliente com resposta não cacheável.
3. [ ] Implementar login com normalização de e-mail e verificação de hash; mensagem genérica em erro. Regenerar ID e token, invalidar contexto anterior e persistir antes de retornar sucesso com prazo absoluto de 8 horas.
4. [ ] Configurar cookie `obraflow.sid` HttpOnly, SameSite=Lax, Path=/, sem Domain e Secure em HTTPS. Restringir exceção HTTP ao ambiente local/testes.
5. [ ] Implementar `/auth/me` sem prolongar sessão e logout com invalidação persistida seguida da limpeza do cookie. Login já autenticado retorna 409; logout sem sessão retorna 401.
6. [ ] Exigir CSRF nas mutações, inclusive login/logout, e validar origem. Em rota privada, conferir autenticação antes de CSRF; no login, bootstrap ausente/expirado gera `CSRF_INVALID`.
7. [ ] Implementar limite de 10 tentativas por IP em 15 minutos com `Retry-After`. Configurar confiança no proxy de forma restrita para não aceitar IP arbitrário de cabeçalho; testar sem desativar o limite.
8. [ ] Criar proteção reutilizável para Admin/Operador e contexto de identidade tipado. Não aceitar role/identidade do corpo ou de cabeçalho livre; aplicar proteção por padrão nas futuras rotas privadas.
9. [ ] Conferir respostas contra OpenAPI e redaction dos logs. Tests devem guardar cookie por cliente HTTP e usar token atual, incluindo sua rotação após login.

## Critérios e cenários de aceite

- **AC-004-01:** sem cookie/token, login não contorna CSRF; com bootstrap válido e credenciais corretas, usuário e role retornam sem senha/hash ou ID da sessão no JSON.
- **AC-004-02:** ID e token anteriores ao login não autenticam nem autorizam nova mutação; token de outra sessão é recusado.
- **AC-004-03:** consultas e mutações não estendem as 8 horas. Alterar expiração em fixture ou usar relógio controlado prova timeout sem esperar horas.
- **AC-004-04:** reiniciar backend preserva uma sessão válida no PostgreSQL com segredo estável; logout torna seu cookie antigo inutilizável.
- **AC-004-05:** conta Admin e conta Operador são distinguíveis por HTTP; cabeçalhos/campos forjados não trocam a role ou autoria.
- **AC-004-06:** origem divergente, CSRF errado, credencial inválida e 11ª tentativa no limite definido produzem os erros e headers corretos.

## Verificação e conclusão

Executar unitários pertinentes e integração HTTP com PostgreSQL e clientes independentes; conferir exemplos do contrato. Provar prazo absoluto no banco, rotação de contexto e invalidação real após logout. Registrar testes positivos/negativos, mecanismo de store/hash e configuração de proxy. Esta spec encerra M1; ainda não afirmar que o login pela interface existe.

## Comandos de verificação

Comandos planejados, disponíveis após as tarefas e dependências desta spec. Conferir os manifests antes de executar. Integração/E2E exigem o projeto isolado já iniciado conforme [SPECS.md](../../SPECS.md); não usar banco de trabalho. As suites contêm somente comportamentos já implementados neste marco.

```powershell
docker compose --profile tools run --rm backend-tools pnpm run lint
docker compose --profile tools run --rm backend-tools pnpm run typecheck
docker compose --profile tools run --rm backend-tools pnpm run build
docker compose --profile tools run --rm backend-tools pnpm run test:unit
docker compose -p obraflow-test --env-file .env.test -f compose.yaml -f compose.test.yaml --profile tools run --rm backend-tools pnpm run test:integration
docker compose --profile tools run --rm backend-tools pnpm -w run contract:check
```

## Registro de execução

Não iniciada. Preencher decisões técnicas, comandos/resultados, evidências HTTP sanitizadas e pendências.
