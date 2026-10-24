![Banner do desafio ObraFlow](assets/banner.png)

# Desafio Full-stack — ObraFlow

## Execução local — SPEC-001

Este incremento implementa somente a infraestrutura: React mínimo, NestJS e PostgreSQL real. Login, entidades, migrations, seed e telas de produto ainda não estão implementados. O enunciado original permanece abaixo.

Requisitos: Docker Engine/Desktop com containers Linux e Docker Compose **2.24.4 ou superior** (overlay usa `!override`). Não é necessário instalar Node, pnpm ou PostgreSQL no host. A primeira execução baixa imagens e pacotes pela internet.

Na raiz do repositório, PowerShell:

```powershell
docker run --rm --mount "type=bind,source=$((Get-Location).Path),target=/workspace" -w /workspace node:24.18.1-bookworm-slim node scripts/init-env.mjs
docker compose config --quiet
docker compose up --build -d
```

Em Bash, a primeira linha usa `--mount "type=bind,source=$(pwd),target=/workspace"`; os demais argumentos e comandos são os mesmos. O script copia `.env.example` para `.env`, substitui os dois placeholders por valores criptograficamente aleatórios e recusa sobrescrever arquivo existente. Não publique `.env` nem o remova a cada reinício. `SESSION_SECRET` fica reservado para a sessão da SPEC-004; não há autenticação neste marco.

Abra [ObraFlow local](http://localhost:8080). O link técnico consulta [backend e banco](http://localhost:8080/api/technical-status), que retorna `{"status":"ok"}` somente após um `SELECT 1` real. Esta rota temporária de infraestrutura preserva `/api` no proxy; não é operação de negócio e não altera o OpenAPI. `/health/live` e `/health/ready` ficam internos. Caminhos `/api` desconhecidos chegam ao Nest e retornam erro, sem receber o HTML da SPA. Rotas de negócio futuras continuam sob `/api/v1`.

Somente `127.0.0.1:8080` é publicado. Backend (3000) e PostgreSQL (5432) ficam na rede Compose. Altere `HTTP_PORT` e `APP_ORIGIN` juntos no `.env` para usar outra porta. O backend aguarda o banco saudável e o frontend aguarda a prontidão real do backend.

```powershell
docker compose ps
docker compose restart
docker compose down
docker compose up -d
```

`down` sem `--volumes` preserva o volume `obraflow_postgres-data` e `/var/lib/postgresql/data`. Não use `down --volumes` se precisa conservar o banco. A comprovação com registros de negócio pertence à SPEC-002; nenhuma tabela provisória é criada aqui.

### Desenvolvimento

```powershell
docker compose -f compose.yaml -f compose.dev.yaml config --quiet
docker compose -f compose.yaml -f compose.dev.yaml up --build -d
```

Também usa `http://localhost:8080` e `/api` na mesma origem. Vite encaminha a API sem reescrever prefixo, Host ou Origin. `frontend/src`, `frontend/index.html` e `backend/src` são montados para atualização automática; dependências Linux ficam na imagem, sem montar `node_modules` do Windows. Alterações em manifests, lockfile e configurações exigem novo build. Para retornar ao modo compilado, execute `docker compose up --build -d`.

### Qualidade

Os serviços do perfil `tools` contêm fontes e ferramentas, ausentes das imagens finais:

```powershell
docker compose --profile tools build backend-tools frontend-tools
docker compose --profile tools run --rm backend-tools pnpm run lint
docker compose --profile tools run --rm backend-tools pnpm run typecheck
docker compose --profile tools run --rm backend-tools pnpm run build
docker compose --profile tools run --rm frontend-tools pnpm run lint
docker compose --profile tools run --rm frontend-tools pnpm run typecheck
docker compose --profile tools run --rm frontend-tools pnpm run build
```

Desenvolvimento opcional no host: Node **24.18.1**, Corepack e pnpm **10.20.0** (`corepack pnpm install --frozen-lockfile`, depois `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm build`). O backend precisa das variáveis do banco e de acesso à rede dele; o fluxo recomendado usa Docker. Não existem testes vazios: suites surgem nas specs que implementam comportamentos de domínio e interface. `e2e/` está reservado, sem pacote executável ainda.

## Decisões técnicas

- Workspace pnpm com um lockfile, versões exatas e TypeScript 5.9.3 estrito. Node 24.18.1 é a base comum do host opcional e das imagens; pnpm 10.20.0 é ativado pelo Corepack. React 19.2.0, Vite 8.0.10 e Nest 11.1.16 são versões fixadas compatíveis com esse runtime, sem depender da tag `latest`.
- ESLint 10.13.0 e typescript-eslint 8.72.0 validam as duas aplicações. Nest é aplicação independente, sem modo especial de monorepo do CLI. O build do backend usa `tsc` com metadados de decorators.
- PostgreSQL 17.6 em Debian, Nginx 1.28.0 Alpine e imagens multi-stage. O backend final executa como usuário `node`, com apenas dependências de produção e código compilado; o frontend final contém Nginx e assets públicos. `.env` fica fora do contexto de build; segredos entram apenas em runtime no backend/banco, nunca no frontend.
- `decimal.js` 10.6.0 foi escolhida e fixada em ambas as aplicações para a futura política comum: strings decimais, `ROUND_HALF_UP` por item em duas casas, soma de itens arredondados e limites explícitos. Cálculos financeiros ainda não estão implementados. Prisma e o modelo de persistência entram na SPEC-002; `pg` 8.16.3 executa exclusivamente a sondagem de infraestrutura neste marco.
- O backend mínimo ainda não oferece a camada HTTP de domínio da SPEC-003 nem autenticação da SPEC-004. A página técnica não é a identidade visual final; Tailwind, Manrope e componentes de produto serão integrados na etapa de frontend. Não há estilos de componente ou página nesta base.
- Nginx preserva caminhos `/api`, Host e Origin e mantém fallback SPA separado. O limite inicial de corpo é 100 KiB, alinhado ao parser padrão do backend; limites e erros HTTP de domínio serão consolidados na SPEC-003.
- Para produção faltam HTTPS, gestão externa de segredos, atualização contínua das imagens/dependências, backups, observabilidade e endurecimento operacional. Este Compose é uma base local, sem promessa de disponibilidade de produção.

Evidências e pendências deste incremento: [registro da SPEC-001](docs/specs/SPEC-001-base-workspace-docker.md#registro-de-execução). As demais specs continuam planejadas.

---

Bem-vindo(a) ao nosso processo seletivo! Estamos buscando alguém com curiosidade técnica, autonomia e, acima de tudo, **visão de produto e criatividade** para transformar problemas reais em soluções.
## Contexto

O **ObraFlow** é uma plataforma para empresas do setor de construção civil, concebida como parte de um [ERP (*Enterprise Resource Planning*)](https://pt.wikipedia.org/wiki/Sistema_integrado_de_gest%C3%A3o_empresarial).

O **Dokimos** é o serviço de aprovações do ObraFlow. Ele gerencia **alçadas de aprovação**: regras que definem quem pode autorizar uma decisão e em qual ordem, de acordo com o contexto do pedido — neste caso, a obra e o valor da compra.

A gestão de alçadas é necessária para que a empresa mantenha controle financeiro e operacional. Compras de menor impacto podem ser decididas rapidamente por responsáveis próximos à obra; compras de maior valor exigem revisão adicional de pessoas com maior responsabilidade. Isso reduz o risco de gastos indevidos, evita que uma única pessoa aprove decisões além de sua responsabilidade e cria uma trilha auditável de quem aprovou ou rejeitou cada pedido.

Também é importante que essas regras sejam configuráveis por obra: projetos diferentes podem ter orçamentos, portes e responsáveis distintos. Assim, o sistema deve identificar a regra aplicável no momento da criação do pedido, formar a cadeia de aprovadores e só avançar para a próxima pessoa depois da aprovação anterior. Em caso de rejeição, o fluxo é interrompido e o motivo fica registrado no histórico.

Em produção, uma regra simples seria:

```text
Obra 1 — valor até R$ 10.000,00
-> Aprovadores: João
Obra 1 — valor acima de R$ 10.000 
-> Aprovadores: Amanda
```

*   Se um pedido na Obra 1 custar **R$ 8.000,00**, basta o clique da João para ser aprovado.
*   Se custar **R$ 12.500,00**, João precisa aprovar primeiro. Só depois da aprovação dela é que o pedido fica liberado para o Amanda decidir. Se a João (ou o Amanda) rejeitar, o pedido é cancelado na hora e precisa ter um motivo registrado.

Neste desafio você vai construir a **versão simplificada** desse fluxo: as telas de um sistema de pedidos de compra com aprovação por alçada.

---

# Backend e persistência

Você deve projetar e implementar a [API](https://pt.wikipedia.org/wiki/Interface_de_programa%C3%A7%C3%A3o_de_aplica%C3%A7%C3%B5es) (ou outro mecanismo de comunicação entre front-end e servidor) e a persistência necessários para suportar o desafio. O contrato, as rotas e o formato dos dados são livres, desde que atendam aos comportamentos abaixo:

* cadastrar e listar obras, usuários, fornecedores, pedidos e regras de alçada;
* criar pedidos com cabeçalho e **N itens**; calcular e persistir seus totais;
* determinar a cadeia de aprovadores conforme a obra e o valor total do pedido;
* registrar aprovações e rejeições, incluindo o motivo obrigatório de rejeição;
* impedir decisões fora da ordem da alçada e preservar o histórico;
* criar, editar, remover e consultar níveis e aprovadores das regras por obra;
* garantir a consistência das leituras e escritas dos dados.

Inclua dados de demonstração suficientes para avaliar o fluxo: ao menos 2 obras, usuários, regras e pedidos em diferentes estados.

Documente no `README.md` como iniciar a aplicação, popular os dados (quando aplicável) e consumir a API. Se optar por expor uma API HTTP, documente também os principais endpoints e payloads.

---

# Tecnologias

A stack é **livre**. Escolha as tecnologias de front-end, back-end, banco de dados, ORM, biblioteca de estilos, testes e infraestrutura que considerar mais adequadas.

A única exigência é que a aplicação possa ser executada localmente conforme as instruções do seu `README.md`, sem depender de serviços pagos ou de credenciais externas.

Testes são desejáveis, mas não obrigatórios.

---

# O que você vai construir

Três telas. O layout é livre — **não entregamos Figma, API ou implementação de referência**. O desenho das telas e as decisões de produto são parte da avaliação.

## 1. Cadastro de pedido de compra

Um pedido de compra representa uma solicitação ao fornecedor e deve conter **um ou mais itens**. A alçada é determinada pelo **valor total do pedido**, e não pelo valor isolado de um item.


### Dados gerais

| Campo | Obrigatório | Comportamento esperado |
|---|---:|---|
| Obra | Sim | Lista as obras disponíveis para o pedido. |
| Fornecedor | Sim | Identifica o fornecedor do pedido. |
| Data do pedido | Sim | Data de emissão do pedido. |
| Observações internas | Não | Campo livre para justificar ou complementar a solicitação. |

Não é **obrigatório** criar uma tela de cadastro de fornecedor, obra ou usuário — se quiser, considere que esses dados já existem no sistema. A tela deve apenas permitir selecionar a obra e o fornecedor do pedido.

### Itens do pedido

A tela começa com um item em branco e deve permitir **adicionar, editar e remover N itens** antes do envio. Cada item deve ter, no mínimo:

| Campo | Obrigatório | Comportamento esperado |
|---|---:|---|
| Descrição | Sim | Descreve claramente o material ou serviço. |
| Quantidade | Sim | Número positivo; pode aceitar decimais. |
| Unidade | Sim | Por exemplo: `un`, `kg`, `m`, `m²` ou `h`. |
| Preço unitário | Sim | Valor monetário não negativo. |
| Total do item | Calculado | `quantidade × preço unitário`; não deve ser editável diretamente. |

O candidato pode definir a experiência de uso mais adequada — por exemplo, uma tabela expansível, um formulário por item ou um drawer — desde que a inclusão de vários itens permaneça clara.

### Totalização e envio

A interface deve exibir o **total do pedido**, calculado pela soma dos totais dos itens. Esse é o valor usado para selecionar a regra de alçada.

O botão **Cadastrar pedido** só deve ficar disponível quando os dados gerais e todos os itens forem válidos. Ao criar o pedido, o back-end deve persistir cabeçalho, itens, total calculado e cadeia inicial de aprovação.
## 2. Aprovação

A tela deve listar pedidos e permitir abrir os detalhes de cada um. A lista pode ser em tabela, cartões ou outra composição clara, mas deve apresentar pelo menos:

| Informação por pedido | Descrição |
|---|---|
| Identificador, obra e fornecedor | Contexto rápido do pedido. |
| Data, quantidade de itens e valor total | Resumo financeiro e operacional. |
| Situação | Pendente, aprovado ou rejeitado. |
| Alçada atual | Aprovadores concluídos, aprovador atual e próximas etapas. |
| Ações | Aprovar ou rejeitar quando houver uma decisão disponível. |

Nos detalhes, apresente os itens — descrição, quantidade, unidade, preço unitário e total — além do histórico de decisões. A lista de pedidos **pendentes** deve refletir o nível atual da alçada, calculado e persistido pelo back-end. A rejeição exige motivo, interrompe o fluxo e fica registrada no histórico. Quando toda a cadeia for concluída, as ações de decisão devem estar desabilitadas com uma explicação.

## 3. Regras da alçada

A tela deve permitir selecionar uma obra e configurar as faixas de valor que definem a cadeia de aprovação. Uma representação mínima pode ser uma tabela como esta:

| Faixa de valor | Aprovadores, na ordem do fluxo | Ações |
|---|---|---|
| Até R$ 10.000,00 | Amanda | Editar / remover |
| Acima de R$ 10.000,00 | Amanda → João | Editar / remover |

A interface deve listar usuários disponíveis e permitir:

* criar, editar e remover níveis/faixas de alçada;
* definir o limite de valor de cada faixa;
* adicionar, remover e reordenar aprovadores em cada faixa;
* listar as regras já salvas para a obra selecionada.

O comportamento para valores sem regra aplicável deve ser definido e documentado pelo candidato — por exemplo, impedir o envio do pedido com uma mensagem clara.

---

# Validações e erros (exigidos)

| Situação | Comportamento esperado |
|---|---|
| Quantidade ou preço unitário inválido, negativo ou não numérico | erro no item correspondente, mensagem compreensível, não envia |
| Pedido sem itens | erro claro; não envia |
| Campos obrigatórios vazios (obra, fornecedor, data ou descrição de item) | erro no campo correspondente; não envia |
| Nenhuma obra cadastrada | empty state amigável, não tela branca |
| API fora do ar / 500 | estado de erro com opção de tentar novamente |
| Rejeitar sem motivo | validação antes do submit |
| Cadeia de alçada já concluída | botão de decisão desabilitado + explicação |

Loading state é obrigatório em toda lista.

---

# 📦 Como entregar (Prazo: 01/11/2026 às 23:59)
O repositório deve conter instruções claras para instalar dependências, configurar o ambiente e iniciar a solução completa (front-end, back-end e banco de dados, quando aplicável). O método de execução é livre; `docker compose` é aceito, mas não obrigatório.

Repositório deve conter:

* código-fonte do front-e˝nd e do back-end;
* dados de demonstração e instruções para criá-los ou carregá-los;
* `README.md` com explicando:
  * screenshots das telas;
  * as tecnologias escolhidas e os motivos da escolha;
  * como a regra de alçada é modelada, calculada e persistida;
  * como o front-end se comunica com o back-end;
  * como a consistência e a integridade dos dados são garantidas;
  * o que mudaria em produção;
1. Faça um **Fork** deste repositório (`https://github.com/ObraFlow/obraflow-case`).
2. Abra um **Pull Request (PR)** para este repositório até **01/11/2026 às 23:59**.
3. **Importante:** Na descrição do seu Pull Request, deixe seu **e-mail e telefone (WhatsApp)** para contato!

---

# Avaliação

| Critério | Peso |
|---|---:|
| Funcionamento completo: front-end, back-end e persistência | 25% |
| Modelagem e implementação das regras de alçada | 20% |
| Qualidade de código, organização e decisões técnicas | 15% |
| **Desenho de UI: hierarquia, clareza, consistência** | 20% |
| Estados (loading / empty / erro), responsividade e validações | 10% |
| Documentação (`## Decisões técnicas`) | 10% |

IA é permitida — mas você precisará explicar cada decisão na entrevista de 30 min.

---

## Contato


**Jonathan Bispo**  
WhatsApp: [+55 71 99204-4335](https://wa.me/5571992044335)  
E-mail: [contrato@obraflow.io](mailto:contrato@obraflow.io)
