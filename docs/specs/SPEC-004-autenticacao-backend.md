---
id: SPEC-004
status: verified
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

1. [x] Integrar o store PostgreSQL escolhido às migrations e ao módulo de sessão. Persistir expiração absoluta e conferir no servidor; desabilitar renovação por atividade, inclusive em mecanismos de touch do store.
2. [x] Implementar bootstrap anônimo de até 15 minutos; reutilizar sessão válida sem prolongar prazo. Token CSRF vinculado à sessão é devolvido ao cliente com resposta não cacheável.
3. [x] Implementar login com normalização de e-mail e verificação de hash; mensagem genérica em erro. Regenerar ID e token, invalidar contexto anterior e persistir antes de retornar sucesso com prazo absoluto de 8 horas.
4. [x] Configurar cookie `obraflow.sid` HttpOnly, SameSite=Lax, Path=/, sem Domain e Secure em HTTPS. Restringir exceção HTTP ao ambiente local/testes.
5. [x] Implementar `/auth/me` sem prolongar sessão e logout com invalidação persistida seguida da limpeza do cookie. Login já autenticado retorna 409; logout sem sessão retorna 401.
6. [x] Exigir CSRF nas mutações, inclusive login/logout, e validar origem. Em rota privada, conferir autenticação antes de CSRF; no login, bootstrap ausente/expirado gera `CSRF_INVALID`.
7. [x] Implementar limite de 10 tentativas por IP em 15 minutos com `Retry-After`. Configurar confiança no proxy de forma restrita para não aceitar IP arbitrário de cabeçalho; testar sem desativar o limite.
8. [x] Criar proteção reutilizável para Admin/Operador e contexto de identidade tipado. Não aceitar role/identidade do corpo ou de cabeçalho livre; aplicar proteção por padrão nas futuras rotas privadas.
9. [x] Conferir respostas contra OpenAPI e redaction dos logs. Tests devem guardar cookie por cliente HTTP e usar token atual, incluindo sua rotação após login.

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

Concluída e verificada localmente em 24/10/2026. M1 encerrado: identidade confiável por HTTP, sem interface de login ou operações de compras/administração.

### Implementação e decisões

- Implementados `GET /auth/csrf`, `POST /auth/login`, `GET /auth/me` e `POST /auth/logout`, sob `/api/v1`, em `backend/src/modules/auth/`.
- Express-session **1.18.2**, connect-pg-simple **10.0.0** e tipagens fixadas no lockfile. Store PostgreSQL usa a tabela criada pela SPEC-002, com `createTableIfMissing:false`; nenhuma migration adicional foi necessária.
- Bootstrap persistido por 15 minutos e sessão autenticada por 8 horas absolutas. `sess.absoluteExpiresAt` mantém precisão de milissegundos e `authenticatedAt` registra o início autenticado. A coluna de limpeza `expire` é arredondada pelo store para o próximo segundo; a autorização usa o prazo exato do JSON.
- `disableTouch:true`, `rolling:false`, `resave:false` e `saveUninitialized:false`. O touch do cookie também fica fixado ao prazo absoluto. Consultas e mutações não prolongam a sessão.
- Cookie `obraflow.sid`: HttpOnly, SameSite=Lax, Path=/, sem Domain e Secure em HTTPS. Configuração limita a exceção HTTP ao ambiente local/testes. `SESSION_SECRET` deve permanecer estável entre reinícios.
- Login normaliza e-mail e preserva senha, reutiliza scrypt da SPEC-002 e executa derivação fictícia para conta inexistente. Regenera ID/token e salva antes do sucesso. Logout confirma exclusão persistida antes de limpar o cookie.
- Guard global protege controllers por padrão; `@Public()` declara exceções, `@Roles()` restringe as duas roles e `@CurrentIdentity()` fornece identidade tipada consultada no banco. Probes de autorização ficam apenas nos testes, fora de AppModule.
- Mutações privadas verificam autenticação antes de origem/CSRF; token sincronizado é comparado em tempo constante. Não há CORS arbitrário, identidade por cabeçalho ou aceitação de role no login. Queries e campos desconhecidos são recusados.
- Limite ativo de 10 chamadas de login por IP em janela de 15 minutos, incluindo chamadas sem CSRF, com `Retry-After` na 11ª. Contadores pertencem ao processo e reiniciam com ele; implantação com múltiplas instâncias exigiria contador compartilhado.
- Proxy não é confiável por padrão. `TRUST_PROXY_IPS` aceita somente IPs literais exatos separados por vírgulas, confiando apenas no primeiro salto. Nginx sobrescreve X-Forwarded-For com o endereço do cliente. Sem IP confiável configurado, clientes atrás do Nginx compartilham o limite pelo IP do proxy; após mudança de IP, a configuração deve ser atualizada. HTTPS atrás de proxy também exige confiança explícita para reconhecer o protocolo seguro.
- Logs HTTP mantêm a lista permitida da SPEC-003; o store registra somente o nome fixo do evento de falha. README, visão geral, contrato textual e metadados OpenAPI distinguem as quatro operações implementadas das demais planejadas, sem mudança de transporte.

Documentação consultada via Context7: [express-session](https://github.com/expressjs/session/tree/v1.18.2), [connect-pg-simple](https://github.com/voxpelli/node-connect-pg-simple) e [guards do NestJS](https://docs.nestjs.com/guards).

### Comandos e resultados

Nesta verificação final, os comandos Compose usaram `-p obraflow-test --env-file .env.test -f compose.yaml -f compose.test.yaml`. O destino efetivo do banco foi validado antes das fixtures. As imagens finais contêm as fontes e o contrato finais; não foi necessário montar fontes para a última execução.

| Comando/validação | Resultado |
| --- | --- |
| `docker compose ... config --quiet` | Passou |
| `docker compose ... --profile tools build backend-tools backend` | Passou; instalação congelada, geração Prisma, compilação e imagem final de produção |
| `docker compose ... build frontend` | Passou; build TypeScript/Vite e imagem Nginx |
| `docker compose ... --profile tools run --rm --no-deps migrate pnpm run db:migrate` | Passou; 2 migrations, nenhuma pendente |
| Backend `pnpm run lint` e `pnpm run typecheck` em backend-tools | Passaram na árvore final |
| Backend `pnpm run test:unit` em backend-tools | **48 testes, 4 suítes passaram** |
| Backend `pnpm run test:integration` em backend-tools | **62 testes, 4 suítes passaram**, incluindo 10 cenários HTTP novos com PostgreSQL real |
| `pnpm -w run contract:check` em backend-tools | Passou: **21 operações, 159 exemplos** |
| `pnpm -w run contract:test` em backend-tools | **4 regressões passaram** |
| `docker compose ... up --no-build -d --wait backend frontend` | Passou; banco/backend saudáveis |
| `pnpm run db:seed:base` em backend-tools | Passou exclusivamente no banco de testes, após terminar a suíte de integração |
| `docker compose ... exec -T frontend nginx -t` | Passou |
| Inspeção dos logs do backend após o ensaio | Sem campos de credencial, cookie, hash ou token |
| Revisão do diff e `git diff --check` | Passaram; nenhum commit, push ou PR criado |

### Aceite demonstrado

| Critério | Evidência HTTP e banco real |
| --- | --- |
| AC-004-01 | Login sem bootstrap retorna 403 CSRF_INVALID; com cookie/token e credenciais corretas retorna 200 Session. Projeção contém somente os campos permitidos; Ajv verifica Session e Csrf contra OpenAPI |
| AC-004-02 | ID/token giram no login; cookie anterior não autentica; token anterior e token de outro cliente retornam 403 |
| AC-004-03 | Bootstrap reutilizado, consultas e mutações preservam o prazo. Fixture SQL expira o JSON mantendo cookie/coluna de limpeza válidos: mutação privada retorna 401 e login retorna 403 de bootstrap |
| AC-004-04 | Aplicação/pools recriados preservam sessão na integração. Na imagem final, reinício real do container do backend preserva identidade, token e expiresAt; logout 204 exclui sessão e replay do cookie retorna 401 |
| AC-004-05 | Admin e Operador identificados por HTTP; probes negam role incorreta; cabeçalhos livres não mudam identidade e role adicional no login retorna 400 |
| AC-004-06 | Origem divergente retorna 403 FORBIDDEN; token incorreto retorna 403 CSRF_INVALID; credencial incorreta/inexistente retorna 401 genérico; 11ª chamada retorna 429 com Retry-After entre 1 e 900 segundos, inclusive com X-Forwarded-For forjado |

O ensaio final usou clientes independentes pelo Nginx em `http://localhost:18080`: bootstrap obrigatório, login das duas roles, rotação, `/auth/me`, reinício de **somente** `obraflow-test` backend, comparação integral da sessão após reinício, logout e replay recusado. Cookie e token ficaram apenas em memória do cliente. Consulta SQL posterior em `obraflow_test` confirmou **zero sessões restantes**. Nenhuma credencial real, cookie ou token é incluído neste registro.

### Incidentes resolvidos e limites

O primeiro build conjunto foi interrompido por falta de espaço em C:, com EIO/EOF e Docker indisponível. Após o usuário liberar espaço, todas as verificações finais acima foram repetidas com sucesso. Não foi necessário apagar dados de outros projetos nem reiniciar serviços globais. A primeira tentativa de integração usou imagem antiga sem as dependências de sessão; a imagem foi atualizada. Duas expectativas iniciais foram ajustadas ao arredondamento técnico de `expire`, mantendo a exigência de prazo absoluto exato e sem renovação. A tentativa de contrato no host não executou por dependência ausente; a validação e suas regressões passaram no Docker.

Sem pendência de aceite desta spec. O ambiente de testes terminou com backend/banco saudáveis, Nginx publicado na porta 18080 e contas fictícias do seed base. Nesta retomada, somente o projeto isolado foi iniciado/reiniciado. Não se comprovam interface de login (SPEC-005), permissões de recursos futuros, TLS real ou produção. Secure/proxy foram exercitados com cabeçalhos simulados em Supertest; o ensaio das imagens usa HTTP local.
