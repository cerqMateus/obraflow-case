---
id: SPEC-015
status: planned
depends_on: ["SPEC-014"]
user_stories: ["US-13"]
operation_ids: []
---

# SPEC-015 — Revisão, documentação e pacote de entrega

## Objetivo

Fechar a implementação como uma entrega revisável e explicável, com evidências, documentação e preparação da submissão ao processo seletivo, distinguindo prontidão técnica de publicação externa.

## Entradas e dependências

Dependência: [014](SPEC-014-seed-instalacao.md). Todas as specs anteriores devem estar verificadas. Ler requisitos de entrega/avaliação no [README](../../README.md), [AGENTS.md](../../AGENTS.md) e fontes em [SPECS.md](../../SPECS.md).

## Escopo e entregáveis

README final, screenshots reais, decisões técnicas, resumo de validações/limitações, rastreabilidade final e título/descrição de PR preparados. Publicação externa é uma etapa separada, executada somente quando solicitada/autorizada pelo candidato.

## Fora do escopo

Não adicionar funcionalidades para enriquecer apresentação, afirmar teste não executado, apagar falha preexistente dos registros, inventar contato ou fazer commit/push/PR/merge por iniciativa própria.

## Tarefas de execução

1. [ ] Revisar rastreabilidade das 16 user stories e das 21 operações: comportamento implementado, tela quando aplicável, casos positivos/negativos e evidência registrada. Nenhum requisito obrigatório pode existir apenas como proposta.
2. [ ] Ler diff completo e mudanças locais, procurar segredos/temporários/builds indevidos e conferir módulos, contratos, nomes de role e invariantes. Corrigir somente desvios relacionados à entrega e registrar regressões.
3. [ ] Finalizar README com pré-requisitos, configuração, dev/build compilado, migrations, seed, contas fictícias, API/payloads, testes, screenshots e seção `Decisões técnicas`. Preservar o enunciado em seção identificada ou referência local preservada se reorganizar o arquivo.
4. [ ] Capturar telas reais com dados fictícios: cadastro com N itens/total, lista e detalhes/cadeia, rejeição/histórico, regras, gestão de obras/responsabilidades e login. Capturas não devem expor tokens, senhas ou dados pessoais.
5. [ ] Explicar modelagem de alçada, snapshot, arredondamento, transações, concorrência, roles/responsabilidades, sessão/CSRF, comunicação frontend/backend e diferenças necessárias em produção.
6. [ ] Consolidar comandos e resultados da SPEC-014. Reexecutar checks somente após mudanças pertinentes ou incerteza residual; não substituir falha real por checkbox. Documentar limitações ainda existentes e não marcar prontidão técnica se forem impeditivas.
7. [ ] Atualizar status de planejamento dos documentos afetados para refletir o que foi efetivamente implementado, preservando esta história de execução sem alegar produção. Conferir todos os links e screenshots.
8. [ ] Preparar roteiro curto da entrevista: demonstrar criação sem vínculo, decisão sequencial/própria, rejeição, mudança de regra preservando pedido antigo e tratamento de conflito; explicar escolhas com referência ao código real.
9. [ ] Preparar título/descrição de PR conforme template e instruções de Git. Identificar fork, branch/base corretos, commits relacionados, testes e riscos, sem publicar ou fazer push sem solicitação específica.
10. [ ] Registrar estado da submissão externa: prazo do enunciado 01/11/2026 às 23h59, sem fuso explicitado; contato do candidato deve ser fornecido por ele. Quando houver autorização específica, seguir preparação de commits, push e criação/atualização de PR; respeitar draft para pendências e nunca fazer merge.

## Critérios de aceite técnico

- **AC-015-01:** todos os requisitos obrigatórios possuem implementação e evidência; não existem operações da API esquecidas ou roles extras.
- **AC-015-02:** README corresponde aos comandos executados numa instalação limpa; screenshots correspondem ao build correto e às regras reais.
- **AC-015-03:** nenhum segredo, arquivo temporário ou dado pessoal indevido está incluído; limitações e diferenças de produção estão claras.
- **AC-015-04:** modelo, precisão, ordem, histórico, autorização e transações podem ser explicados na entrevista com código/evidências.
- **AC-015-05:** pacote de submissão identifica base, título, descrição, testes e riscos e deixa claro se a publicação ainda está pendente.

## Aceite da submissão externa

Checklist separado da conclusão técnica: fork correto, alterações enviadas mediante autorização, PR criada/atualizada para o repositório solicitado, e-mail e WhatsApp do candidato fornecidos/autorizados, link final e indicação de draft ou pronta para revisão. Enquanto não ocorrer, registrar **tecnicamente pronta; submissão externa pendente**, não “entregue”. Não bloquear documentação ou revisão técnica apenas pela ausência de contato pessoal.

## Verificação e conclusão

Revisar documentos/links/capturas, quadro de user stories, OpenAPI e evidências das specs anteriores. `status: verified` significa pacote técnico concluído; registrar separadamente o estado da PR. Relatório final deve informar o que mudou, validações executadas e qualquer trabalho restante, sem declarar publicação inexistente.

## Comandos de verificação

Revisão documental/Git. Não executar novos testes de aplicação sem mudança ou incerteza que os justifique.

```powershell
git diff --check
git status --short
```

## Registro de execução

Não iniciada. Preencher resumo técnico, evidências/documentos, limitações, prontidão técnica e estado separado de autorização/publicação da submissão.
