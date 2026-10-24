# ObraFlow / Dokimos — Specs de desenvolvimento

Data: 24/10/2026. Versão do roteiro: 1.0. Status: **SPEC-001 a SPEC-003 verificadas localmente; SPEC-004 a SPEC-015 planejadas**. Evidências no registro de execução de cada spec.

Este é o ponto de entrada do desenvolvimento orientado por especificações. Cada spec define um resultado verificável, suas dependências, tarefas, cenários de aceite e evidências de conclusão. Não equivale a um cronograma nem comprova uma implementação existente.

A estratégia segue a preferência do candidato: **estabilizar a base do backend e, depois, concluir funcionalidades menores junto com o frontend**. A base não inclui implementar toda a API antes das telas. Depois da SPEC-004, cada funcionalidade de produto é entregue com persistência, HTTP, interface aplicável e validação.

## 1. Fontes de verdade

| Fonte | Responsabilidade |
|---|---|
| [AGENTS.md](AGENTS.md) | Convenções, segurança, arquitetura e limites de implementação |
| [README.md](README.md) | Enunciado e entrega; receberá instruções reais quando a aplicação existir |
| [Visão geral](docs/visao-geral.md) | Domínio, entidades, roles, permissões e user stories |
| [Contrato textual](docs/contrato-api.md) | Comportamento HTTP, precisão, sessão, erros e concorrência |
| [OpenAPI](docs/openapi.json) | Operações, schemas e exemplos de transporte |
| [PRODUCT.md](PRODUCT.md) | Contexto, capacidades e princípios do produto |
| [DESIGN.md](DESIGN.md) | Identidade confirmada: Manrope, vermelhão, grafite e superfícies quentes |
| [Design do frontend](docs/design-frontend.md) | Composição, interação, estados e acessibilidade |
| Este índice e suas specs | Ordem de execução, escopo de cada incremento e evidências exigidas |

As specs não substituem nem duplicam integralmente os contratos. Quando houver uma divergência, identificar os dois trechos, registrar a resolução e atualizar as fontes afetadas antes de implementar o comportamento. Mudança de contrato exige visão geral, contrato textual e OpenAPI coerentes, além de consumidores e testes.

### Resoluções de planejamento desta revisão

- A ordem sugerida para composição visual no documento de design não determina a ordem funcional. Este roteiro começa pelo backend e autenticação, depois login/estrutura, administração, alçadas, consulta, cadastro e decisões.
- Paleta e família tipográfica já estão confirmadas em DESIGN.md. Permanecem a escolha do asset licenciado e os ajustes semânticos/medidas validados no navegador.
- O design mencionava America/Sao_Paulo como proposta de apresentação. Prevalece o requisito de domínio: instantes no fuso do navegador, com o fuso explicitamente identificado; datas civis não passam por conversão de instante.
- Saúde operacional é infraestrutura: `/health/live` e `/health/ready` internos, com resposta mínima. Não altera as 21 operações de negócio do OpenAPI nem expõe dados privados.

## 2. Como executar uma spec

1. Ler a spec inteira, suas fontes e os critérios de conclusão das dependências. Conferir o código atual, manifests, Git e alterações de outras pessoas.
2. Registrar o plano local das tarefas ainda pendentes. O campo `status` do arquivo é a situação canônica; começar como `planned`, usar `in_progress` durante execução, `verified` apenas com aceite demonstrado, ou `blocked` com impedimento específico e trabalho restante.
3. Conferir o contrato das operações e escrever os cenários de comportamento pertinentes antes ou junto da implementação. Não criar testes que apenas espelhem funções ou detalhes internos.
4. Implementar o menor incremento completo. Nas specs verticais: persistência e API → componente/página → integração → estados e acessibilidade. Não deixar permissões, transações ou estados obrigatórios para uma etapa futura.
5. Executar as verificações pertinentes e comparar resultado observável com os critérios. Ajustar o código ou registrar pendências; não enfraquecer teste/contrato para concluir.
6. Preencher `Registro de execução` no arquivo da spec com data, alterações, comandos reais, resultados e limitações. Evidências locais não são evidências de produção. Não inserir segredos, cookies, tokens ou dados pessoais.
7. Atualizar documentos afetados e revisar o diff completo. Só marcar `verified` se todas as condições daquela spec estiverem cumpridas; compilação isolada ou fixture não basta para marcar integração.
8. Prosseguir para a próxima spec elegível. Commits, push, PR e publicação seguem autorização e regras de Git; não são efeitos automáticos de executar uma spec.

Um desvio deve registrar: motivo, requisito afetado, alternativa escolhida, impacto e evidência. Quando envolver escolha técnica rotineira dentro da stack autorizada, decidir e documentar, sem criar uma aprovação adicional desnecessária. Escolhas de versões, biblioteca decimal, hash e store de sessão devem ser fixadas antes de seu primeiro uso, com documentação atual compatível.

## 3. Mapa de execução

| Ordem | Spec | Resultado demonstrável | Depende de |
|---|---|---|---|
| 1 | [SPEC-001 — Workspace e Docker](docs/specs/SPEC-001-base-workspace-docker.md) | Banco, backend mínimo e frontend mínimo iniciam de forma reproduzível | — |
| 2 | [SPEC-002 — Schema e banco de testes](docs/specs/SPEC-002-schema-migrations-testes.md) | Schema completo, migrations, contas iniciais e banco de testes isolado | 001 |
| 3 | [SPEC-003 — Base HTTP e contrato](docs/specs/SPEC-003-base-http-contrato.md) | Validação, erros, paginação, saúde e validação do OpenAPI | 001, 002 |
| 4 | [SPEC-004 — Sessão e autorização](docs/specs/SPEC-004-autenticacao-backend.md) | Login real, CSRF, sessão PostgreSQL e separação das roles por HTTP | 002, 003 |
| 5 | [SPEC-005 — Login e estrutura frontend](docs/specs/SPEC-005-login-frontend.md) | Entrar/sair pelo navegador, identidade real, navegação e tokens visuais | 004 |
| 6 | [SPEC-006 — Cadastros e obras](docs/specs/SPEC-006-cadastros-obras.md) | Admin cria/edita obras na interface; cadastros auxiliares funcionam por API | 005 |
| 7 | [SPEC-007 — Responsabilidades](docs/specs/SPEC-007-responsabilidades.md) | Admin concede e revoga vínculos com os impedimentos corretos | 006 |
| 8 | [SPEC-008 — Alçadas](docs/specs/SPEC-008-alcadas.md) | Admin configura e salva faixas e etapas completas na interface | 007 |
| 9 | [SPEC-009 — Consulta de pedidos](docs/specs/SPEC-009-consulta-pedidos.md) | Lista e detalhes reais, com acesso por conta e histórico | 008 |
| 10 | [SPEC-010 — Cadastro de pedidos](docs/specs/SPEC-010-cadastro-pedidos.md) | Operador cadastra N itens e recebe cadeia persistida, mesmo sem vínculo próprio | 009 |
| 11 | [SPEC-011 — Decisões](docs/specs/SPEC-011-decisoes.md) | Aprovação sequencial, própria e rejeição completas pela interface | 010 |
| 12 | [SPEC-012 — Disputas e preservação](docs/specs/SPEC-012-concorrencia-historico.md) | Fluxos concorrentes e mudanças administrativas preservam integridade | 011 |
| 13 | [SPEC-013 — Revisão da experiência](docs/specs/SPEC-013-experiencia-acessibilidade.md) | Todas as telas verificadas com teclado, erros, limites e larguras reais | 012 |
| 14 | [SPEC-014 — Demonstração e instalação limpa](docs/specs/SPEC-014-seed-instalacao.md) | Seed completo, execução só com Docker e regressão integrada reproduzível | 013 |
| 15 | [SPEC-015 — Encerramento e entrega](docs/specs/SPEC-015-entrega.md) | README, screenshots, evidências, revisão final e pacote de submissão | 014 |

Os números abreviados da tabela correspondem aos IDs `SPEC-001` a `SPEC-015`. Executar na ordem acima é o caminho recomendado; não abrir várias funcionalidades incompletas para antecipar etapas. As dependências nos arquivos são verificáveis e não permitem ciclos.

### Marcos de progresso

- **M1 — Base backend confiável:** SPEC-001 a SPEC-004 verificadas. Não anunciar produto completo: ainda não há operação pela interface.
- **M2 — Administração utilizável:** SPEC-005 a SPEC-008 verificadas. Login, obras, responsabilidades e regras funcionam de ponta a ponta.
- **M3 — Fluxo de compra completo:** SPEC-009 a SPEC-011 verificadas. Criar, consultar e decidir pedidos pela aplicação.
- **M4 — Candidato de entrega validado:** SPEC-012 a SPEC-015 verificadas tecnicamente. Submissão externa tem estado próprio e depende de dados/autorização do candidato.

A sequência respeita o prazo do enunciado, mas não promete duração por spec. Reservar os dias finais para validação e entrega; reduzir acabamento opcional antes de cortar integridade, estados exigidos ou documentação.

## 4. Convenções executáveis a criar

**Os comandos desta seção são contratos de implementação; sua disponibilidade é confirmada pelo registro da spec responsável.** Cada spec responsável deve criá-los, executá-los e ajustar a documentação se houver motivo para um nome diferente. Nunca rodar cegamente um comando antes de conferir o arquivo correspondente.

Executar todos os blocos de comandos das specs na raiz do repositório, não dentro de `docs/specs/`. Os serviços de ferramentas definem o diretório interno de execução; não exigir instalação de pnpm no host para essas receitas.

### Workspace e scripts

| Onde | Nome/script | Criar em | Responsabilidade |
|---|---|---|---|
| `backend/package.json` | `@obraflow/backend`; `dev`, `build`, `start`, `lint`, `typecheck` | 001 | Execução e qualidade do backend |
| `frontend/package.json` | `@obraflow/frontend`; `dev`, `build`, `lint`, `typecheck` | 001 | Execução e qualidade do frontend |
| Backend | `db:generate`, `db:migrate`, `db:seed:base` | 002 | Gerar cliente, aplicar migrations versionadas e cadastrar dados iniciais |
| Backend | `test:unit`, `test:integration` | 002 | Suites que encerram com exit code e usam destino de teste verificado |
| Raiz | `contract:check` | 003 | Validar OpenAPI, referências e exemplos JSON |
| Frontend | `test` | 005 | Testes de interação sem modo watch |
| `e2e/package.json` | `@obraflow/e2e`; `test` | 005 | Playwright com navegador real e API real; ampliar cenários por incremento |
| Backend | `db:seed:demo` | 014 | Carga completa, explícita e não destrutiva da demonstração |

Não criar scripts que retornem sucesso com suites inexistentes nem usar opções para ocultar ausência de testes. A SPEC-001 valida lint, tipos e build; testes surgem com comportamentos nas specs seguintes. Os scripts de integração devem recusar banco que não seja explicitamente de teste e usar a URL de testes, não a do ambiente de trabalho.

### Serviços Compose

| Serviço | Uso | Criar em |
|---|---|---|
| `postgres` | Banco e volume nomeado; sem porta pública por padrão | 001 |
| `backend` | NestJS compilado, porta interna 3000 | 001 |
| `frontend` | React compilado + Nginx, porta pública padrão `127.0.0.1:8080` | 001 |
| `backend-tools` | Imagem de ferramentas/dependências; scripts do backend | 001, completar em 002 |
| `migrate` | Tarefa única após banco saudável; backend aguarda sucesso | 002 |
| `frontend-tools` | Imagem de ferramentas para lint/tipos/build; testes adicionados na 005 | 001, completar em 005 |
| `e2e` | Navegadores e dependências do Playwright; não inicia no uso normal | 005 |

`backend-tools`, `frontend-tools` e `e2e` ficam em perfil `tools`. Builds usam o contexto do workspace e o lockfile único. Node.js e pnpm no host são opcionais para desenvolvimento, não requisitos do avaliador que usa Docker.

Os diretórios de trabalho dos serviços de ferramentas são `/workspace/backend`, `/workspace/frontend` e `/workspace/e2e`, respectivamente. O workspace completo fica em `/workspace`, permitindo `pnpm -w run contract:check` a partir de `backend-tools` sem instalar runtime no host.

Arquivos previstos: `compose.yaml`, `compose.dev.yaml`, `compose.test.yaml`, Dockerfiles, configuração Nginx, `.env.example`, `.env.test.example` e `.dockerignore`. Não existem por efeito deste roteiro.

### Ambiente de testes isolado

Usar outro projeto Compose chamado `obraflow-test`, outro volume e banco terminado em `_test`. O overlay `compose.test.yaml` liga backend, ferramentas e navegador a esse banco; usar `.env.test`, criado explicitamente a partir do exemplo, sem reutilizar credenciais reais. Não apontar testes para o banco da demonstração ou de desenvolvimento.

O navegador dentro do serviço `e2e` acessará `http://frontend`; nesse projeto, `APP_ORIGIN` também será `http://frontend`. No ambiente de uso humano, será `http://localhost:8080`. Porta publicada do projeto de testes deve ser distinta, por exemplo 18080; não usar `localhost` de um container como endereço de outro serviço. Preservar CSRF e verificação de origem nos dois ambientes.

Migrations, integração e E2E usam esse projeto de testes em sequência; não executar limpeza de fixtures concorrentemente com outro grupo de testes que compartilhe o banco. Durante a limpeza, os scripts conferem o nome do banco e o destino efetivo. Reset de schema/volume exige destino de teste confirmado e ação explícita; reinício comum nunca limpa dados.

### Receitas de validação após os arquivos existirem

Da raiz, depois de configurar os arquivos locais:

```powershell
docker compose config --quiet
docker compose up --build -d
docker compose --profile tools run --rm backend-tools pnpm run db:seed:base
```

Teste isolado, disponível conforme as specs 002 e 005:

```powershell
docker compose -p obraflow-test --env-file .env.test -f compose.yaml -f compose.test.yaml config --quiet
docker compose -p obraflow-test --env-file .env.test -f compose.yaml -f compose.test.yaml up --build -d
docker compose -p obraflow-test --env-file .env.test -f compose.yaml -f compose.test.yaml --profile tools run --rm backend-tools pnpm run test:integration
docker compose -p obraflow-test --env-file .env.test -f compose.yaml -f compose.test.yaml --profile tools run --rm e2e pnpm run test
```

Na SPEC-005, a suite E2E contém apenas autenticação. As specs seguintes ampliam a suite conforme os endpoints reais ficam prontos. Preparar fixtures específicas antes de cada grupo; a carga completa de demonstração só será exigida na SPEC-014.

Atalho para quem tem o runtime fixado no host: `pnpm --filter @obraflow/backend run <script>` ou `pnpm --filter @obraflow/frontend run <script>`. Para integração, preferir as ferramentas dentro do Compose isolado, sem expor PostgreSQL só para facilitar testes. No PowerShell, `pnpm.cmd` pode ser necessário.

## 5. Regras de conclusão transversais

- Entrega vertical inclui validação no backend, resposta persistida, UI conectada e recuperação de falhas. Não substituir API por mocks para declarar a spec verificada.
- Controle de acesso e de concorrência nasce com a funcionalidade. A SPEC-012 amplia a prova de disputas entre funcionalidades; não é licença para adiar locks ou permissões.
- Transações atravessam serviços pelo mesmo contexto, sempre bloqueando obra antes de pedido quando aplicável. Sem ORM global fora da transação no meio da operação.
- Sem terceira role ou cadastro de Aprovador; etapas referenciam responsabilidades de Operadores.
- Tailwind diretamente em `className`, uma única entrada CSS de infraestrutura, componentes React arrow functions e limites de responsabilidade conforme AGENTS.md.
- Interfaces usam Manrope local com licença, paleta confirmada e estados semânticos próprios. Não usar vermelhão da marca como única indicação de rejeição.
- Cada lista/seletor tem loading, vazio, erro e acesso às páginas seguintes. Não mostrar apenas a primeira página como se fosse o catálogo completo.
- Datas civis preservam o dia; instantes usam UTC no transporte e fuso de apresentação explícito. Quantidades/dinheiro mantêm precisão e limites canônicos.
- Testes negativos incluem HTTP direto, não apenas botões escondidos. Condições de corrida usam conexões independentes contra PostgreSQL.
- Evidências visuais incluem diálogos, desktop, telas pequenas e foco; checks estáticos não comprovam usabilidade ou autenticação.
- Não ampliar para notificações, gráficos, telas de usuários/fornecedores, edição de pedido enviado, reenvio ou substituição de responsáveis em pedidos existentes.

### Registro mínimo por spec

No campo `Registro de execução`, registrar: data, arquivos/casos de uso alterados, cenários executados, comando real e resultado, tipo de evidência (estática, unitária, HTTP com PostgreSQL, navegador integrado ou inspeção visual), pendências e eventual revisão de contrato. Capturas e relatórios só devem ser preservados quando úteis; não versionar tokens, estado autenticado de navegador, temporários ou relatórios volumosos de execução.

## 6. Cobertura de user stories

| User story | Specs responsáveis |
|---|---|
| US-01 — Identidade e role | 004, 005 |
| US-02 — Pedido com N itens | 010 |
| US-03 — Alçada pelo total | 008, 010 |
| US-04 — Consulta e pendências | 009 |
| US-05 — Detalhes e histórico | 009, 012 |
| US-06 — Aprovar etapa | 011 |
| US-07 — Rejeitar com motivo | 011 |
| US-08 — Explicação de indisponibilidade | 009, 011 |
| US-09 — Faixas por obra | 008 |
| US-10 — Ordem dos operadores | 008 |
| US-11 — Concorrência | 011, 012 |
| US-12 — Recuperação de falhas | 005 a 013, por funcionalidade |
| US-13 — Execução local | 001, 014, 015 |
| US-14 — Gestão de obras | 006 |
| US-15 — Responsabilidades | 007, 012 |
| US-16 — Aprovação própria | 011, 012 |

As `operation_ids` dos arquivos de spec identificam quem implementa cada operação do OpenAPI; consumidores e regressões podem referenciá-las sem assumir nova propriedade. As 21 operações devem ter exatamente uma spec de implementação responsável, sem ficar faltando ou ser implementadas em duplicidade.

## 7. Finalização

O projeto só está tecnicamente pronto quando todas as specs estiverem verificadas com evidências pertinentes, o fluxo completo passar por HTTP e navegador com PostgreSQL real, o build compilado funcionar numa instalação limpa e os requisitos do README estiverem cobertos. Documentos não encerram pendências de implementação.

A prontidão técnica e a submissão externa são estados diferentes. A SPEC-015 inclui revisão de fork/base, título/descrição de PR e instruções de submissão. Contato do candidato, push e criação/atualização de PR seguem autorização específica e instruções de Git. Não inventar contato nem publicar dados de terceiros.

## 8. Referências de execução

- [pnpm — seleção de pacotes no workspace](https://pnpm.io/filtering)
- [Docker Compose — ordem e condições de inicialização](https://docs.docker.com/compose/how-tos/startup-order/)
- [Prisma — aplicação de migrations versionadas](https://www.prisma.io/docs/orm/prisma-client/deployment/deploy-database-changes-with-prisma-migrate)

Consultar documentação atual das versões escolhidas durante cada implementação, conforme AGENTS.md. Estes exemplos não fixam versões fictícias nem substituem verificar a compatibilidade real.
