---
id: SPEC-010
status: planned
depends_on: ["SPEC-009"]
user_stories: ["US-02", "US-03", "US-12"]
operation_ids: ["createOrder"]
---

# SPEC-010 — Cadastro de pedido com N itens e cadeia persistida

## Objetivo

Entregar o percurso Operador → formulário → criação atômica → detalhes reais, incluindo escolha de obra sem responsabilidade própria, precisão financeira e snapshot da regra aplicável.

## Entradas e dependências

Dependência: [009](SPEC-009-consulta-pedidos.md). Consultar seção 8 e limites do [contrato](../contrato-api.md), `OrderInput`/`Order`, regras de domínio e Novo pedido no [design](../design-frontend.md).

## Escopo e entregáveis

`POST /purchase-orders`, caso de uso de criação, funções financeiras e `/pedidos/novo`. A resposta completa persistida leva aos detalhes existentes. Decisão ainda será entregue na SPEC-011.

## Fora do escopo

Sem edição posterior, rascunho persistido, prévia da configuração administrativa para Operador, desconto/frete/imposto, envio por item, autoaprovação ou promessa de cadastro exatamente uma vez.

## Tarefas de execução

1. [ ] Escrever casos financeiros canônicos: strings válidas, precisão extra recusada, `0.125 × 0.20 = 0.03`, soma de linhas arredondadas, quantidade positiva, preço zero e overflow. Usar aritmética decimal; frontend reproduz a política sem importar Prisma.
2. [ ] Implementar DTO e validações: campos obrigatórios, 1–100 itens, referências, data civil, unidade e limites. Derivar autoria da sessão Operador; Admin é recusado.
3. [ ] Bloquear obra numa transação, resolver faixa usando total calculado e validar vínculos ativos da mesma obra. Não exigir vínculo do solicitante; não herdar etapas de outra faixa.
4. [ ] Gravar cabeçalho, itens ordenados, totais, revisão/limites/nomes históricos e etapas; primeira `pending`, demais `waiting`, versão 1. Gerar referência por sequência segura e aceitar lacunas numéricas.
5. [ ] Em ausência de cobertura ou falha após escrita intermediária, desfazer toda a operação; não deixar cabeçalho sem itens/etapas. Serializar resposta completa pelo mesmo contrato dos detalhes.
6. [ ] Implementar formulário com um item inicial, `useFieldArray` e identidade estável; adicionar/editar/remover até o limite sem perder valores ou foco. Quantidade e dinheiro mantêm entrada textual, sem conversão binária para cálculo.
7. [ ] Seletores de obra/fornecedor pesquisam e paginam no servidor; obras incluem as sem vínculo do solicitante. Tratar catálogos vazios sem oferecer administração ao Operador.
8. [ ] Exibir total de item e resumo estimado não editáveis, erros associados a cada campo e impedimentos do submit. Validar durante interação conforme design, sem acusar tudo antes da primeira edição.
9. [ ] Sucesso usa dados retornados, invalida listas pertinentes e abre detalhes. Erro mantém formulário; ausência de regra orienta procurar Admin. Falha de rede informa resultado incerto e não repete automaticamente.

## Critérios e cenários de aceite

- **AC-010-01:** Beatriz cria pedido numa obra sem vínculo próprio; backend registra Beatriz e escolhe cadeia pelos responsáveis da regra, não pelo solicitante.
- **AC-010-02:** dois itens de 6000.00 totalizam 12000.00 e selecionam a faixa do pedido, mesmo que cada item isolado esteja abaixo do limite.
- **AC-010-03:** 10000.00 e 10000.01 selecionam as faixas corretas; zero é aceito apenas com cobertura; lacuna impede toda a gravação.
- **AC-010-04:** quantidade inválida, preço negativo/não numérico, descrição vazia, ausência de itens e precisão extra são recusados em UI e HTTP com erros localizados.
- **AC-010-05:** total local e persistido coincidem nos casos de arredondamento; overflow é erro de negócio, não truncamento ou 500.
- **AC-010-06:** falha forçada no meio da transação não deixa pedido parcial; duas criações simultâneas recebem referências únicas.
- **AC-010-07:** quando solicitante ocupa a primeira etapa, o pedido continua pendente; não há decisão registrada automaticamente.

## Verificação e conclusão

Executar unitários de dinheiro, integração HTTP com PostgreSQL e testes de formulário. E2E cria pedido com vários itens, abre detalhe e encontra valores/cadeia após reload. Conferir toda a jornada com Operador sem vínculo e testar Admin por HTTP direto. Inspecionar 100 itens e foco em adição/remoção sem overflow da página.

## Comandos de verificação

Comandos planejados, disponíveis após as tarefas e dependências desta spec. Conferir os manifests antes de executar. Integração/E2E exigem o projeto isolado já iniciado conforme [SPECS.md](../../SPECS.md); não usar banco de trabalho. As suites contêm somente comportamentos já implementados neste marco.

```powershell
docker compose --profile tools run --rm backend-tools pnpm run lint
docker compose --profile tools run --rm backend-tools pnpm run typecheck
docker compose --profile tools run --rm backend-tools pnpm run build
docker compose --profile tools run --rm frontend-tools pnpm run lint
docker compose --profile tools run --rm frontend-tools pnpm run typecheck
docker compose --profile tools run --rm frontend-tools pnpm run build
docker compose --profile tools run --rm backend-tools pnpm run test:unit
docker compose -p obraflow-test --env-file .env.test -f compose.yaml -f compose.test.yaml --profile tools run --rm backend-tools pnpm run test:integration
docker compose --profile tools run --rm frontend-tools pnpm run test
docker compose -p obraflow-test --env-file .env.test -f compose.yaml -f compose.test.yaml --profile tools run --rm e2e pnpm run test
```

## Registro de execução

Não iniciada. Preencher casos financeiros, transação/snapshots, comandos/resultados e evidências da criação real.
