---
id: SPEC-013
status: planned
depends_on: ["SPEC-012"]
user_stories: ["US-01", "US-02", "US-04", "US-05", "US-08", "US-09", "US-10", "US-12", "US-14", "US-15"]
operation_ids: []
---

# SPEC-013 — Revisão integrada de experiência e acessibilidade

## Objetivo

Verificar todas as superfícies reais como um produto único, corrigindo inconsistências de interação, estados, responsividade e identidade sem alterar regras de negócio.

## Entradas e dependências

Dependência: [012](SPEC-012-concorrencia-historico.md). Consultar [DESIGN.md](../../DESIGN.md), [telas](../design-frontend.md), [PRODUCT.md](../../PRODUCT.md) e regras de Tailwind/estado/tamanho em [AGENTS.md](../../AGENTS.md).

## Escopo e entregáveis

Matriz de inspeção por tela/estado/largura, correções concretas, tokens documentados e evidências visuais. Inclui login, shell, obras, responsabilidades, alçadas, pedidos, formulário, detalhes e todos os diálogos/painéis relacionados.

## Fora do escopo

Não redesenhar a identidade confirmada nem adicionar dashboard, gráficos, notificações, modo escuro, telas de usuários/fornecedores ou abstrações sem consumidor. Estados de erro/permissão já são requisitos das specs anteriores, não funcionalidades novas.

## Tarefas de execução

1. [ ] Inventariar superfícies e verificar contraste real de texto, foco, limites e estados. Registrar cores derivadas de erro/rejeição sem confundir com vermelhão da marca; manter fonte local e licença.
2. [ ] Inspecionar desktop amplo, largura intermediária e 320 px; zoom de 200% e ampliação de texto. Remover scroll horizontal da página, sobreposição de ações e conteúdo essencial oculto.
3. [ ] Percorrer tudo por teclado: filtros, seletores paginados, itens dinâmicos, reordenação, diálogos e confirmação/rejeição. Verificar foco inicial, contenção, Escape, cancelamento, retorno e anúncios apropriados.
4. [ ] Validar todas as listas/seletores nos estados loading, vazio real, filtro sem resultado e erro/retry; submissões em progresso, falha de campo, conflito, indisponibilidade e resultado incerto. Mocks podem isolar UI; manter ao menos o percurso integrado real correspondente.
5. [ ] Exercitar 100 itens, 50 faixas e cadeias de 20 etapas, valores máximos, nomes/descrições/motivos longos e listas além da primeira página. Corrigir quebras/expansão sem carregar catálogo inteiro.
6. [ ] Conferir datas de calendário e histórico em dois fusos de navegador, com identificação do fuso; verificar que a data do pedido não muda de dia. Não fixar São Paulo por conveniência visual.
7. [ ] Revisar responsabilidade única dos componentes, hooks e casos de uso pelos limites de AGENTS.md. Extrair somente onde houver motivo concreto; sem CSS de componentes ou arquivos de classes ocultas.
8. [ ] Atualizar DESIGN.md e documento de telas com tokens/componentes efetivos, decisões de contraste e URLs. Gerar catálogo de design apenas a partir do código existente e conforme workflow disponível; não inventar inventário implementado.

## Critérios e cenários de aceite

- **AC-013-01:** todas as superfícies e seus diálogos foram inspecionados nas larguras definidas; nenhuma depende de hover, cor ou arraste como único recurso.
- **AC-013-02:** foco, labels, mensagens de campo e ações indisponíveis são compreensíveis por teclado; não existe sucesso silencioso ou erro apenas em toast.
- **AC-013-03:** dados essenciais permanecem disponíveis no celular; limites máximos não quebram a página nem escondem cadeia/valores.
- **AC-013-04:** tela, erro de API e estado vazio não são confundidos; mudanças de conta não exibem dados anteriores.
- **AC-013-05:** identidade permanece coerente e contraste medido é registrado; não declarar conformidade apenas por escolha de biblioteca acessível.

## Verificação e conclusão

Executar testes de frontend e E2E pertinentes às correções, tipos/build e inspeção visual real. Quando usar ferramenta automatizada de acessibilidade, registrar o resultado e o que só foi conferido manualmente. Preencher matriz por superfície e manter somente capturas sanitizadas úteis. Não alegar que análise estática substitui inspeção no navegador.

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

Não iniciada. Preencher matriz de larguras/estados/roles, contraste, teclado, correções, comandos/resultados e limitações.
