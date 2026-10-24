---
id: SPEC-005
status: planned
depends_on: ["SPEC-004"]
user_stories: ["US-01", "US-12"]
operation_ids: []
---

# SPEC-005 — Login integrado e estrutura da aplicação

## Objetivo

Permitir entrar e sair pelo navegador usando a autenticação real, estabelecer a identidade visual e preparar a estrutura de navegação que receberá as funcionalidades seguintes.

## Entradas e dependências

Dependência: [004](SPEC-004-autenticacao-backend.md). Ler [design](../../DESIGN.md), [telas e interação](../design-frontend.md), [produto](../../PRODUCT.md), [contrato](../contrato-api.md) e regras frontend de [AGENTS.md](../../AGENTS.md).

## Escopo e entregáveis

Login, cliente HTTP único, contexto de sessão, TanStack Query, rotas protegidas e shell responsivo. Completar `frontend-tools` com testes, criar pacote `@obraflow/e2e` e runner Docker com navegadores; a suite integrada inicial cobre somente autenticação.

## Fora do escopo

Sem telas administrativas fictícias, métricas, tema alternativo, recuperação de senha ou cadastro público. A área Pedidos pode exibir indisponibilidade temporária de implementação, explicitamente identificada, até a SPEC-009; não mostrar lista vazia fictícia como resposta da API.

## Tarefas de execução

1. [ ] Adicionar Tailwind e primitivos shadcn/ui necessários. Incorporar Manrope local com licença e fallback; registrar tokens da paleta confirmada e derivados semânticos de foco, erro, sucesso e pendência com contraste verificado.
2. [ ] Usar utilitários diretamente em `className`, uma única entrada CSS de infraestrutura e componentes arrow functions. Não criar biblioteca de componentes especulativos; começar pelos consumidores de login e shell.
3. [ ] Fixar rotas iniciais: `/login`, `/pedidos`, `/pedidos/novo`, `/pedidos/:orderId`, `/admin/obras`, `/admin/obras/:projectId` e `/admin/alcadas`. Páginas posteriores só são anunciadas como disponíveis quando implementadas.
4. [ ] Criar cliente HTTP que gerencia cookie, bootstrap/token CSRF e erros do contrato. Usar caminhos relativos `/api/v1`; não expor endereço interno Docker ao navegador. Não configurar retries automáticos para mutações.
5. [ ] Implementar fluxo login → sessão real → shell; ao recarregar, recuperar contexto com `/auth/me`, diferenciando loading, sessão inexistente e falha de comunicação.
6. [ ] Implementar logout, expiração, limpeza/cancelamento de consultas privadas e proteção contra resposta antiga repovoando o cache de outra conta. Não preservar rascunhos privados para outro usuário.
7. [ ] Exibir nome, role e navegação pertinente. Admin não recebe Novo pedido nem decisão; Operador não recebe gestão. Proteção de navegação não substitui as permissões do servidor.
8. [ ] Criar formulário com labels, gerenciador de senha, visibilidade acessível, foco, mensagens de credencial/indisponibilidade e submit pendente. Não criar “Lembrar-me”.
9. [ ] Criar `test` no frontend e E2E com `.env.test`/origem alinhados ao Compose isolado. Dados de teste vêm do seed base; não interceptar login para simular autenticação.
10. [ ] Atualizar DESIGN.md com tokens realmente utilizados, sem anunciar conformidade ainda não inspecionada; registrar a decisão das rotas no documento de telas.

## Critérios e cenários de aceite

- **AC-005-01:** entrar como Admin e como Operador mostra identidade/role reais; deep link privado sem sessão conduz ao login sem conteúdo privado prévio.
- **AC-005-02:** login inválido, backend indisponível e envio pendente têm estados distintos e recuperáveis; não ocorre submissão dupla.
- **AC-005-03:** reload mantém uma sessão válida; expiração/logout removem conteúdo privado e não reutilizam cache da conta anterior.
- **AC-005-04:** navegador envia cookie e token corretos pela origem única; nenhum identificador de sessão aparece em storage acessível ao JavaScript.
- **AC-005-05:** login e shell funcionam por teclado em desktop e a 320 px, sem overflow da página, foco perdido ou contraste presumido.

## Verificação e conclusão

Executar lint/tipos/build/test do frontend em `frontend-tools`; no projeto `obraflow-test`, executar E2E de login, reload, logout e troca de conta contra API e banco reais. Inspecionar login e navegação em desktop/móvel. Registrar prints sanitizados e limitações; não marcar Pedidos/Obras como entregues por existir uma rota.

## Comandos de verificação

Comandos planejados, disponíveis após as tarefas e dependências desta spec. Conferir os manifests antes de executar. Integração/E2E exigem o projeto isolado já iniciado conforme [SPECS.md](../../SPECS.md); não usar banco de trabalho. As suites contêm somente comportamentos já implementados neste marco.

```powershell
docker compose --profile tools run --rm frontend-tools pnpm run lint
docker compose --profile tools run --rm frontend-tools pnpm run typecheck
docker compose --profile tools run --rm frontend-tools pnpm run build
docker compose --profile tools run --rm frontend-tools pnpm run test
docker compose -p obraflow-test --env-file .env.test -f compose.yaml -f compose.test.yaml --profile tools run --rm e2e pnpm run test
```

## Registro de execução

Não iniciada. Preencher rotas, fonte/licença, tokens, comandos/resultados e evidências integradas/visuais.
