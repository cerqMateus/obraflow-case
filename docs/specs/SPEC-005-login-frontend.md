---
id: SPEC-005
status: verified
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

1. [x] Adicionar Tailwind e primitivos shadcn/ui necessários. Incorporar Manrope local com licença e fallback; registrar tokens da paleta confirmada e derivados semânticos de foco, erro, sucesso e pendência com contraste verificado.
2. [x] Usar utilitários diretamente em `className`, uma única entrada CSS de infraestrutura e componentes arrow functions. Não criar biblioteca de componentes especulativos; começar pelos consumidores de login e shell.
3. [x] Fixar rotas iniciais: `/login`, `/pedidos`, `/pedidos/novo`, `/pedidos/:orderId`, `/admin/obras`, `/admin/obras/:projectId` e `/admin/alcadas`. Páginas posteriores só são anunciadas como disponíveis quando implementadas.
4. [x] Criar cliente HTTP que gerencia cookie, bootstrap/token CSRF e erros do contrato. Usar caminhos relativos `/api/v1`; não expor endereço interno Docker ao navegador. Não configurar retries automáticos para mutações.
5. [x] Implementar fluxo login → sessão real → shell; ao recarregar, recuperar contexto com `/auth/me`, diferenciando loading, sessão inexistente e falha de comunicação.
6. [x] Implementar logout, expiração, limpeza/cancelamento de consultas privadas e proteção contra resposta antiga repovoando o cache de outra conta. Não preservar rascunhos privados para outro usuário.
7. [x] Exibir nome, role e navegação pertinente. Admin não recebe Novo pedido nem decisão; Operador não recebe gestão. Proteção de navegação não substitui as permissões do servidor.
8. [x] Criar formulário com labels, gerenciador de senha, visibilidade acessível, foco, mensagens de credencial/indisponibilidade e submit pendente. Não criar “Lembrar-me”.
9. [x] Criar `test` no frontend e E2E com `.env.test`/origem alinhados ao Compose isolado. Dados de teste vêm do seed base; não interceptar login para simular autenticação.
10. [x] Atualizar DESIGN.md com tokens realmente utilizados, sem anunciar conformidade ainda não inspecionada; registrar a decisão das rotas no documento de telas.

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

Implementação em 24/10/2026. Status `in_progress`: código entregue, aceite integrado e visual pendente. A pedido explícito do usuário, a construção das imagens fica para depois; não iniciar E2E nem marcar a spec como `verified` antes dessa retomada.

### Implementado

- Cliente HTTP único em `shared/api-client`, respostas validadas com Zod, erros tipados preservando código/campos/detalhes/correlação, cookie same-origin e CSRF somente em memória. Sem retry automático de mutações, armazenamento de sessão no navegador ou fallback fictício.
- Sessão em TanStack Query, recuperação por `/auth/me`, estados de loading/ausência/indisponibilidade, expiração absoluta, cancelamento e limpeza do cache, barreira de geração contra respostas antigas e reconciliação de um login cujo resultado anterior ficou incerto.
- Login com React Hook Form/Zod, normalização de e-mail sem trim de senha, labels/autocomplete, visibilidade acessível, erros, foco e bloqueio de envio duplicado. Shell com identidade real, expansão móvel no fluxo e transferência de foco ao conteúdo após navegação.
- Rotas fixas do escopo. Pedidos é explicitamente indisponível até a SPEC-009; demais telas futuras também não anunciam funcionalidade pronta. Deep links sem sessão vão ao login; áreas incompatíveis com a role mostram acesso restrito.
- Tailwind 4.3.3, primitivos Button/Input do padrão shadcn/ui (CVA/Radix Slot), ícones Lucide e Manrope local via Fontsource 5.2.8, licença SIL OFL preservada em `frontend/public/fonts/Manrope-OFL.txt`. Tokens efetivos em DESIGN.md.
- Pacote E2E Playwright 1.56.1 e runner Docker para origem/banco isolados. Cenários escritos para desktop e 320 px: deep link, credencial inválida, login real das duas roles, cookie/CSRF, reload, logout, troca de conta, ausência de storage e invalidação de sessão no servidor. Nenhum login é interceptado. Screenshots planejados em `e2e/evidence/` ainda não existem.

### Validações executadas

A imagem `frontend-tools` foi construída antes do adiamento. As verificações finais usaram essa imagem existente com fontes/configurações atuais montadas somente para leitura; não são prova da imagem final da aplicação. Os comandos internos abaixo foram executados por `docker compose --profile tools run --rm ... frontend-tools`, sem construir novas imagens após o pedido de adiamento.

| Verificação | Resultado |
| --- | --- |
| `pnpm run lint` no frontend | Passou |
| `pnpm run typecheck` no frontend | Passou, incluindo testes e configurações |
| `pnpm run test` no frontend | 11 testes em 4 arquivos passaram: HTTP/CSRF/resposta antiga, formulário/pending/erro, ciclo de sessão/cache/expiração e foco da navegação |
| `pnpm run build` no frontend | Passou; TypeScript + Vite 8.0.10, Tailwind e fontes locais |
| `pnpm --filter @obraflow/e2e run typecheck` e `lint` | Passaram; análise estática, sem executar navegador |
| Compose isolado `config --quiet` | Passou |
| Detector estático Impeccable | Sem achados mecânicos; não prova aparência ou acessibilidade no navegador |
| Revisão independente de código | Um problema de foco móvel corrigido e coberto por teste; correção confirmada estaticamente |

Contraste calculado por luminância sRGB: grafite/Paper 16,33:1; secundário/Paper 5,60:1; secundário/Surface 5,30:1; branco/primary 6,00:1; branco/hover 7,48:1; foco/Paper 6,62:1; erro/Surface 6,56:1; borda de campo/Paper 3,93:1; marca/grafite 4,81:1. São pares dos tokens, não medição dos estados renderizados. Metas de layout, teclado, zoom e contraste real ainda exigem inspeção.

### Incidentes e pendências

A instalação no host encontrou módulos Linux já presentes e recusou operar neles. Manifests foram fixados e o lockfile atualizado pelo runtime Linux; a instalação congelada de `frontend-tools` passou. Tailwind 4.1 foi substituído antes da instalação final por 4.3.3, cuja compatibilidade declarada inclui Vite 8. O primeiro teste concorrente encontrou timeout durante builds; configuração final usa um processo (`forks`, `maxWorkers: 1`) e a suite passou.

A imagem inicial do Playwright usa Node 22, incompatível com o workspace. O Dockerfile agora copia Node 24.18.1 antes da instalação; esse ajuste ainda não foi construído/validado. A construção das imagens da aplicação/runner foi interrompida quando o usuário pediu adiamento, após medição de pouco espaço no disco C:. Não houve limpeza de volumes, dados ou imagens de outros projetos. A árvore de trabalho mantém a alteração prévia de configuração do backend; apenas uma barra que impedia parsing foi removida com autorização explícita do usuário.

Pendente: instalação/build do runner corrigido e das imagens finais, seed base no banco isolado, execução Playwright real, inspeção login/shell em desktop e 320 px, teclado/foco/zoom/contraste renderizado e prints sanitizados. Não houve nova validação HTTP/PostgreSQL nesta spec, nem screenshots. Os critérios AC-005-01 a AC-005-05 não estão integralmente demonstrados por testes unitários ou análise estática.

Comandos de retomada no README, seção Login e retomada da validação da SPEC-005. Commits, push e PR não foram criados.

### Retomada durante a SPEC-006 — 25/10/2026

As pendências E2E/visuais acima foram retomadas: build do runner Node 24/Playwright 1.56.1 e imagens finais concluído; `corepack enable pnpm` evita o link de Yarn quebrado na imagem do navegador. Lint/tipos do E2E passaram. Autenticação passou em desktop e 320 px com deep link privado, credencial inválida, Admin/Operador reais, reload, cookie/CSRF, storage vazio, logout, troca de conta e invalidação no servidor. O cenário de invalidação reutiliza a sessão do Operador no teste de troca de conta, preservando a cobertura e o limite real de login.

Capturas de login e shell desktop/móvel foram produzidas e inspecionadas; não houve overflow ou perda de controles. Contraste dos tokens em uso foi confirmado no navegador durante a SPEC-006 (ação primária 6,00:1, secundário/página 5,30:1). A suíte completa contém agora 4 E2E de autenticação/obras e passou com API e PostgreSQL reais. Frontend: lint/tipos/build e 16 testes passaram. AC-005-01 a AC-005-05 possuem agora evidências locais; auditoria ampla de zoom e de todos os estados continua pertencendo à SPEC-013. A falha preexistente dos testes unitários de proxy do backend está registrada na SPEC-006 e não foi corrigida neste incremento.
