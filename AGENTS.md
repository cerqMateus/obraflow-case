# AGENTS.md — ObraFlow / Dokimos

## 1. Aplicação destas instruções

Estas regras se aplicam a todo o repositório e a agentes e pessoas que contribuam nele. Instruções explícitas do usuário prevalecem. Instruções locais podem detalhar estas regras para um diretório, sem enfraquecer os requisitos de segurança, domínio e qualidade.

- Leia o contexto e o código existente antes de propor alterações. Inspecione o estado do Git e os diffs staged e unstaged; preserve trabalho não relacionado, inclusive arquivos não rastreados.
- Faça mudanças pequenas, coesas e limitadas à tarefa. Não reescreva arquivos, reorganize pastas ou adicione dependências sem necessidade concreta.
- Diferencie requisitos, propostas e funcionalidades implementadas. Não afirme que um endpoint, comando ou teste existe sem verificá-lo.
- Não amplie o escopo para resolver problemas hipotéticos. Registre decisões que alterem arquitetura, comportamento ou contrato.
- Subagentes, quando utilizados, devem receber nomes correspondentes à tarefa ou funcionalidade executada. Delegue responsabilidades sem sobreposição de edição.

## 2. Fontes de verdade e escopo

Antes de implementar uma funcionalidade, consulte os documentos aplicáveis:

| Documento | Responsabilidade |
| --- | --- |
| `README.md` | Enunciado, requisitos de entrega e instruções de execução quando disponíveis |
| `docs/visao-geral.md` | Escopo, stack, arquitetura, domínio, permissões e critérios de aceite |
| `docs/contrato-api.md` | Comportamento HTTP, limites, validações, segurança e erros |
| `docs/openapi.json` | Contrato estruturado, schemas e exemplos de transporte |
| `PRODUCT.md` | Contexto de uso e princípios de produto |
| `DESIGN.md` e `docs/design-frontend.md` | Identidade, tokens, composição, acessibilidade e interação |

O repositório começa com especificações; não confunda esse material com uma aplicação executável. Este AGENTS.md fixa convenções de implementação, sem substituir o contrato de domínio.

Se houver divergência entre documentos, código e contrato, identifique-a e resolva-a explicitamente antes de alterar o comportamento afetado. Não escolha silenciosamente a interpretação mais conveniente. Mudanças de contrato devem atualizar visão geral, contrato textual e OpenAPI em conjunto, além dos consumidores e testes pertinentes.

Não adicionar nesta entrega: múltiplas empresas, microsserviços, mensageria, notificações, anexos, gráficos analíticos, cadastro público, recuperação de senha, rascunhos persistidos, edição ou reenvio de pedidos enviados e telas de usuários/fornecedores. Esses cadastros continuam previstos por API conforme o escopo.

## 3. Stack e ambiente

Use a stack definida, sem introduzir alternativas concorrentes:

| Área | Stack |
| --- | --- |
| Workspace | pnpm workspaces; `frontend/`, `backend/` e `e2e/` |
| Frontend | React, TypeScript, Vite e React Router |
| Interface | Tailwind CSS e shadcn/ui |
| Formulários | React Hook Form e Zod |
| Dados remotos | TanStack Query e cliente HTTP único baseado em fetch |
| Backend | NestJS, TypeScript e adaptador Express |
| Validação HTTP | DTOs, class-validator e class-transformer |
| Persistência | Prisma e PostgreSQL |
| Contrato | OpenAPI / Swagger |
| Testes | Jest + Supertest; Vitest + React Testing Library; Playwright |
| Execução local | Docker Compose, sem serviços pagos ou credenciais externas |

- Fixe versões compatíveis ao criar a base; registre requisitos de Node.js e pnpm. Não use `latest` como estratégia de reprodutibilidade.
- Use somente pnpm para gerenciar dependências; mantenha um único `pnpm-lock.yaml` no workspace. No PowerShell, use `pnpm.cmd` se necessário.
- Não use o modo especial de monorepo do Nest CLI: há uma aplicação Nest independente.
- Não troque bibliotecas nem introduza Redux, Zustand, outro framework de estilos ou outro ORM sem uma necessidade demonstrada e decisão documentada.
- Escolha e documente a biblioteca decimal na criação da base. Frontend e backend precisam reproduzir a mesma política financeira, sem expor Prisma ao navegador.
- Scripts devem ser reproduzíveis e falhar com código de saída apropriado. Nunca documente como executado um comando apenas planejado.

## 4. TypeScript e qualidade estrutural

- Ative tipagem estrita nas duas aplicações. Não use `any`, `@ts-ignore`, casts duplos ou asserções não nulas para esconder erros. Dados externos entram como `unknown` e são validados/narrowed na fronteira.
- Prefira tipos explícitos nas fronteiras públicas: props, contratos HTTP, serviços e casos de uso. Use inferência onde ela mantém clareza.
- Use nomes de código em inglês e linguagem de interface em português brasileiro. Componentes e tipos em PascalCase; hooks começando por `use`; mantenha convenções de arquivos consistentes por aplicação.
- Modele situações e decisões com uniões ou enums coerentes com o contrato. Não espalhe strings e números mágicos.
- Funções e classes devem ter uma responsabilidade. Evite parâmetros booleanos que mudam completamente o comportamento; prefira operações nomeadas.
- Não crie camadas, factories, repositories genéricos ou utilitários sem consumidores reais. Não esconda regras de negócio em arquivos `utils` genéricos.
- Comentários explicam motivos, invariantes e escolhas difíceis; não narram o código. Código morto, imports não usados e logs de depuração devem ser removidos.
- Não silencie lint, erros de tipos ou falhas de testes para concluir uma tarefa. Corrija a causa ou relate o impedimento.

### Limites de tamanho e responsabilidade

Os limites abaixo são regras deste projeto, não limitações das bibliotecas:

- Um componente React principal por arquivo. Tipos e pequenos auxiliares privados podem acompanhar o componente; componentes com comportamento próprio devem ser extraídos.
- Meta: componentes com até 150 linhas. Acima de 200 linhas no arquivo `.tsx`, revise e decomponha antes de concluir. Nenhum arquivo de componente escrito manualmente deve ultrapassar 250 linhas sem justificativa local explícita e responsabilidade indivisível demonstrável.
- Hooks e funções devem preferencialmente ficar abaixo de 50 linhas. Acima de 80 linhas, reveja responsabilidades, fluxo e extrações de regras puras.
- Serviços e casos de uso escritos manualmente devem preferencialmente ficar abaixo de 250 linhas. Acima de 300, separe por operação ou responsabilidade.
- Contagens consideram linhas não vazias e não incluem comentários isolados. Schemas, migrations, código gerado e fixtures extensas não seguem esses tetos; isso não autoriza misturar responsabilidades.
- Não contorne os limites comprimindo código, removendo formatação ou espalhando funções arbitrariamente. Extraia unidades com nome, contrato e propósito claros.
- Não crie componentes que concentrem página, formulário inteiro, modal, tabela, consultas e regras de domínio no mesmo arquivo.

## 5. Arquitetura do frontend

Siga a estrutura de `docs/visao-geral.md`:

```text
frontend/src/
  app/                 # Rotas, providers e composição da aplicação
  modules/
    auth/
    administration/
    purchase-orders/
    approval-rules/
    catalogs/
  shared/
    api-client/
    components/
    utils/
```

- Cada módulo expõe uma API pequena por `index.ts`. Imports entre módulos usam essa entrada pública; não acesse arquivos internos de outro módulo. Dentro do próprio módulo, evite importar seu barrel para prevenir ciclos.
- Páginas são diretórios em `modules/<feature>/pages/<page>/`, com componentes e hooks exclusivos próximos de seu uso. A camada de rotas apenas compõe layouts, proteção de navegação e páginas.
- Um componente usado por uma página permanece nela; por duas páginas do módulo, vai para `modules/<feature>/components/`; por dois módulos, pode ir para `shared/components/`.
- Primitivos de interface do shadcn/ui podem nascer em `shared/components/ui/`, pois constituem a base visual. Não coloque componentes de negócio nesse diretório.
- Use componentes React como arrow functions, com props tipadas. Não declare componentes dentro de outros componentes.
- Componentes consomem hooks; hooks de query/mutation usam serviços do módulo; serviços usam o cliente HTTP compartilhado. Não faça fetch em JSX, handlers de apresentação ou efeitos de componentes.
- Mantenha regras financeiras e transições em funções puras testáveis. O frontend apresenta estimativas; a decisão definitiva pertence ao backend.
- Use IDs estáveis como keys. Em itens dinâmicos, preserve a identidade fornecida por `useFieldArray`; não use índice, texto editável ou ID aleatório criado durante renderização.
- Evite `useEffect` para sincronizar estados que podem ser derivados. Não adicione memoização sem necessidade concreta.

## 6. Estilos: Tailwind obrigatório

- Toda estilização de componentes e páginas deve usar utilitários Tailwind diretamente em `className`.
- É proibido criar CSS por componente ou página: nada de `.module.css`, SCSS, Sass, Less, styled-components, Emotion, `<style>` ou arquivos `*.styles.ts` que apenas escondam classes.
- **Única exceção de infraestrutura:** um arquivo global de entrada do Tailwind, por exemplo `frontend/src/app/styles.css`, pode conter importação do Tailwind, tokens de tema, variáveis semânticas exigidas pelo shadcn/ui, registro de fontes locais e base global mínima. Não pode conter seletores de páginas/componentes, classes utilitárias particulares ou layouts. Use a sintaxe compatível com a versão instalada.
- Essa entrada é a integração técnica do Tailwind, não uma alternativa para escrever estilos de interface. Não crie outros arquivos CSS da aplicação.
- Use `cn()` para composição condicional e variantes tipadas nos primitivos quando necessário. Evite duplicar longas combinações de classes em vários consumidores.
- Classes devem existir completas no código. Não construa nomes como `bg-${color}-500`; use mapas de classes completas e detectáveis no build.
- Não use `@apply` para recriar uma camada de componentes CSS. Prefira composição React e variantes dos primitivos.
- Não use `style` para cores, espaçamentos, tipografia ou layout estáticos. Valores realmente calculados em execução podem ser passados por variáveis CSS ou pela API de posicionamento de uma biblioteca, com motivo documentado e sem substituir Tailwind.
- Centralize tokens de cores, tipografia, raio e espaçamento. Não espalhe hexadecimais ou valores arbitrários para imitar tokens existentes.
- Preserve Manrope e a paleta de `DESIGN.md`: vermelhão, grafite e superfícies quentes. Vermelhão de marca não representa rejeição; estados precisam de semântica própria e texto.
- Valide contraste nas combinações reais. Não presuma que branco sobre o vermelhão da marca atende aos requisitos.
- Considere diálogos, drawers, menus, estados de foco e telas pequenas parte da mesma entrega visual.

## 7. Estado, formulários e comunicação

- Dados da API pertencem ao TanStack Query. Não copie listas ou entidades remotas para Context, stores, `localStorage` ou estados paralelos.
- Formulários pertencem ao React Hook Form, com schemas Zod e erros próximos dos campos. Estado transitório de interface fica local; filtros compartilháveis devem preferir parâmetros de URL.
- Derive totais e indicadores em vez de manter cópias sincronizadas. Não use `Number`, `parseFloat` ou arredondamentos binários para cálculo monetário.
- O cliente HTTP centraliza origem, cookies, token CSRF, leitura de respostas e erros padronizados. Não capture erros para retornar arrays vazios, sucesso fictício ou dados de demonstração.
- Query keys incluem filtros, paginação e contexto de identidade. Limpe caches privados ao encerrar ou trocar sessão e impeça respostas de requisições antigas de repovoarem o contexto anterior.
- Atualize/invalide consultas afetadas somente após sucesso confirmado; use a resposta persistida. Não avance etapas de aprovação de forma otimista.
- Desabilite submissões enquanto pendentes. Não configure retry automático para cadastro, decisões ou substituição de regras.
- Em falha de rede após mutação, o resultado pode ser incerto: preserve conteúdo seguro e oriente a consultar o recurso antes de repetir. Não prometa operação exatamente uma vez.
- Em `409`, informe conflito e recarregue os dados; preserve o rascunho aplicável para reconciliação manual. Não sobrescreva configurações nem repita decisões automaticamente.
- Distinga `401`, `403`, `404`, erros de campo, conflitos e indisponibilidade. Respeite o comportamento definido no contrato.
- Todas as listas têm carregamento, vazio, erro com nova tentativa e sucesso. Seletores devem alcançar resultados além da primeira página; não carregue o catálogo inteiro como atalho.

## 8. Experiência e acessibilidade

- Use HTML semântico, labels persistentes, botões para ações e links para navegação. Não transforme `div` clicável em controle padrão.
- Garanta teclado, foco visível, ordem de tabulação coerente e identificação acessível de ícones interativos.
- Diálogos devem ter título, descrição quando necessária, foco inicial adequado, contenção de foco e retorno ao acionador. Use os primitivos acessíveis existentes.
- Erros devem indicar o campo e como corrigir, com associação acessível. Não dependa só de toast, tooltip, ícone ou cor.
- A cadeia deve diferenciar etapas concluídas, atual, futuras e ignoradas. Ações indisponíveis precisam de explicação acessível, inclusive com botão desabilitado.
- Apresente datas e valores em pt-BR sem alterar formatos canônicos da API. Datas de calendário não devem mudar de dia por conversão indevida de fuso.
- Valide desktop e navegador móvel. Não aceite scroll horizontal da página; tabelas largas podem ter rolagem contida e contexto preservado.
- Respeite redução de movimento. Não use animações ou decoração que atrasem tarefas, disputem com os valores ou escondam estados.
- Evite excesso de cartões, texto auxiliar repetitivo e ações principais concorrentes. Mostre contexto, valor, situação e próxima ação com hierarquia clara.

## 9. Backend, contratos e persistência

- Organize o monólito em módulos de domínio conforme a visão geral. Controllers traduzem HTTP; DTOs validam entradas; casos de uso coordenam regras e transações; funções de domínio executam cálculos e transições.
- Separe criação de pedido, decisão, substituição de configuração e gestão de responsabilidades. Não concentre tudo em um serviço genérico.
- Módulos Nest exportam apenas dependências necessárias. Evite ciclos; não use `forwardRef` para encobrir uma divisão inadequada.
- Prisma fica no backend. Não exporte modelos internos, cliente Prisma ou credenciais para o frontend. Use DTOs explícitos de resposta com seleção de campos permitidos.
- Valide corpo, query e parâmetros. Recuse campos desconhecidos e derivados enviados pelo cliente; não faça mass assignment do corpo no ORM.
- Preserve `/api/v1`, paginação, códigos de erro, formatos de resposta e limites definidos no contrato. Não substitua o envelope de erro por mensagens ad hoc.
- Identidade, autoria, instantes de decisão, totais, situação e próxima etapa são determinados pelo servidor.
- Toda alteração de schema precisa de migration versionada. Não use sincronização destrutiva ou alteração manual do banco como substituto de migration.
- Use constraints e índices para integridade e consultas reais. Evite N+1, consultas ilimitadas e paginação em memória.
- Todas as leituras protegidas e escritas de um caso de uso atômico usam a mesma transação, inclusive ao atravessar serviços. Não consulte pelo cliente Prisma global no meio dessa operação.
- Use SQL parametrizado quando bloqueios ou restrições exigirem SQL específico. Nunca concatene entradas do usuário em SQL.
- Mantenha leituras coerentes entre cabeçalho, itens, etapas e situação. Mock de ORM não prova isolamento ou concorrência.

## 10. Invariantes obrigatórias de domínio

1. Existem apenas `admin` e `operator`. Responsável por etapa não é uma terceira role.
2. Admin configura e acompanha; não cria pedidos nem decide por operadores nesta versão.
3. Operador cria em qualquer obra disponível, mesmo sem responsabilidade nela. Consulta somente pedidos próprios ou de cuja cadeia participa, inclusive concluídos.
4. Responsabilidade ativa na obra habilita participação na cadeia; não concede acesso a todos os pedidos nem decisão fora da etapa atribuída.
5. Somente o operador da etapa atual decide, com vínculo ativo, pedido pendente, `stepId` e `expectedVersion` válidos. Aprovação própria é permitida manualmente nas mesmas condições.
6. Pedido exige pelo menos um item válido. Quantidade positiva; preço não negativo. Servidor recalcula e persiste tudo atomicamente.
7. Dinheiro e quantidades viajam como strings decimais. Use quantidade `DECIMAL(9,3)`, preço `DECIMAL(12,2)` e totais/limites `DECIMAL(18,2)`, com limites exatos do contrato.
8. Arredonde cada total de item com `ROUND_HALF_UP` em duas casas e some os totais arredondados. Valide overflow; não trunque entradas ou aceite precisão extra silenciosamente.
9. A faixa usa o total do pedido: limite inferior exclusivo, superior inclusivo; `null` indica ausência de limite. Total zero é válido apenas com cobertura. Não herde etapas de outras faixas.
10. Sobreposição de faixas, operador repetido na mesma cadeia e responsabilidade inativa/de outra obra são inválidos. Lacunas são permitidas e informadas; sem regra aplicável, não persista pedido parcial.
11. O envio copia a cadeia completa, os nomes e os dados históricos previstos. Alterações futuras em regras e cadastros não reescrevem pedidos existentes.
12. Aprovação intermediária libera apenas a próxima etapa; a última aprova o pedido. Rejeição exige motivo, encerra o pedido e marca futuras etapas como `skipped`, sem inventar decisões.
13. Pedido enviado e histórico não são editáveis ou removíveis nesta versão. Remover regra preserva seu snapshot histórico conforme o contrato.
14. Configuração de alçadas é substituída como conjunto completo por obra, com `expectedRevision`, validação integral e transação. Não salve parcialmente etapas ou faixas.
15. Criação, configuração e concessão/revogação bloqueiam a obra; decisões bloqueiam obra antes do pedido. Confira versão, etapa e elegibilidade dentro da transação.
16. Duas decisões concorrentes com a mesma versão produzem uma única transição; a outra recebe conflito. Revogação em uso é bloqueada sem mudanças parciais.
17. Revisões e versões seguem o contrato. Referência legível de pedido é gerada de forma única no servidor; nunca a partir da contagem de registros.

## 11. Autenticação, autorização e segurança

- Use login local real e sessão persistida no PostgreSQL. É proibido substituir autenticação por seletor de identidade ou confiar em usuário/role enviados livremente pelo cliente.
- Preserve cookie `obraflow.sid` HttpOnly, SameSite=Lax, Path=/, sem Domain, Secure em HTTPS e expiração absoluta de 8 horas, sem renovação por atividade. HTTP é exceção apenas local.
- Preserve bootstrap CSRF com sessão anônima de até 15 minutos, regeneração no login, invalidação no logout, proteção CSRF e validação de origem nas mutações, conforme o contrato.
- Não armazene identificadores de sessão em `localStorage` ou `sessionStorage`. Não exponha tokens em URLs ou logs.
- Autorização é obrigatória no servidor, tanto em listas quanto em consultas por ID e mutações. Bloquear rota no frontend não é proteção suficiente.
- Pedidos fora do acesso do usuário seguem a política de `404` do contrato, sem revelar existência ou detalhes de conflitos antes da autorização.
- Senhas usam hash apropriado. Nunca retorne hashes, senhas ou dados de sessão em DTOs, erros ou logs.
- Use mensagens públicas seguras, correlação de requisições e logs técnicos sem dados sensíveis. Não exponha stack traces ou SQL ao cliente.
- Mantenha rate limit de login, limite de corpo e validação de configuração. Nunca desative segurança para facilitar demonstrações ou testes completos.
- `.env.example` contém apenas placeholders seguros; segredos reais não entram em código, fixtures, imagens, documentação ou commits. Contas fictícias locais devem ser claramente identificadas como demonstração.

## 12. Testes e critérios de conclusão

Execute as validações disponíveis e pertinentes ao escopo. Não invente scripts antes de verificar os manifests. Ao criar a base, disponibilize scripts claros para lint, tipos, testes e build de cada aplicação.

| Mudança | Evidência mínima pertinente |
| --- | --- |
| Cálculo/faixas/transições | Testes unitários de precisão, fronteiras, lacunas, sobreposição e estados inválidos |
| API e permissões | Testes HTTP de sucesso e negação, inputs inválidos, códigos e campos do contrato |
| Persistência/concorrência | Integração com PostgreSQL real, rollback, snapshots e conexões independentes para disputas |
| Formulários/interface | Interações do usuário, itens dinâmicos, erros, estado pendente, vazio e falha |
| Fluxo integrado | Playwright com frontend, API e banco locais reais e contas das duas roles |
| Estilos/layout | Build e inspeção visual em desktop/móvel, teclado, foco e contraste |
| Ambiente/migrations | Instalação limpa, migrations, seed e persistência após reinício |
| Contrato | Validação do OpenAPI e exemplos, consumidores e respostas HTTP relevantes |

- Inclua regressão para correções de domínio, permissão, cálculo ou concorrência. Não crie testes que apenas repetem a implementação nem snapshots extensos sem valor de comportamento.
- Priorize exatamente no limite e um centavo acima, valores com arredondamento, zero coberto/não coberto, overflow, aprovação própria, chamada direta sem permissão e decisões simultâneas.
- Mocks são adequados para isolamento unitário e estados da interface; não substituem prova de autorização, transação ou fluxo real.
- Não marque integração como concluída com dados locais fictícios substituindo a API, mocks de rede ou validação estática do OpenAPI.
- Use banco de testes isolado. Nunca execute reset, limpeza destrutiva ou seed de teste contra banco de trabalho sem verificar o destino.
- Seed deve criar cenários suficientes das duas roles, ao menos duas obras, responsabilidades, regras e pedidos em diferentes estados. Reexecução tem comportamento explícito e não apaga dados silenciosamente.
- Para concluir, revise o diff completo, execute lint/tipos/testes/build pertinentes, confirme alinhamento documental e informe o que passou, falhou ou não foi executado. Não corrija falhas preexistentes alheias ao escopo sem necessidade.
- Mudanças exclusivamente documentais pedem revisão de coerência, links e diff; não exigem inventar testes de aplicação.

## 13. Documentação técnica e uso do Context7

- Use Context7 MCP para consultar documentação atual ao trabalhar com sintaxe, configuração, versões, migrações, integração ou diagnóstico específico de bibliotecas, frameworks, SDKs, APIs, CLIs e serviços de nuvem, mesmo quando familiares.
- Comece por `resolve-library-id` com nome e objetivo; selecione a correspondência mais relevante e confiável, preferindo a versão em uso. Só dispense essa resolução se o usuário fornecer um ID exato no formato `/org/project`.
- Depois use `query-docs`, com uma pergunta específica por conceito. Faça consultas separadas para conceitos independentes e aplique a documentação compatível com as versões instaladas.
- Não use Context7 para refatoração puramente estrutural, scripts genéricos, revisão de código, conceitos gerais ou depuração exclusiva de regras de negócio.
- Não copie exemplos de documentação sem adaptar segurança, versões e contexto. Não envie código privado, credenciais ou dados pessoais nas consultas.
- Mantenha no README os comandos reais de instalação/execução, ambiente, migrations, seed, contas fictícias, testes, endpoints, screenshots e a seção `Decisões técnicas`.
- Registre limitações e diferenças para produção. Não apresente proposta, mock, teste unitário ou inspeção estática como validação de comportamento em execução.

## 14. Git e entrega

- Não crie commits, push, PR ou merge por iniciativa apenas para encerrar uma tarefa de código/documentação. Execute as ações de Git solicitadas e preserve mudanças não relacionadas.
- Quando commits forem solicitados: leia o diff completo, apresente plano breve e separe por finalidade em commits pequenos, coesos e independentes. Use Conventional Commits em inglês: `tipo(escopo): descrição objetiva`.
- Não misture funcionalidade, refatoração, documentação e configuração sem relação. Não inclua segredos, temporários, relatórios gerados ou arquivos de build.
- Não use `--no-verify`, `--force` ou reset destrutivo como atalho. Não faça push sem autorização explícita.
- Para PR solicitada, compare com a base correta, leia commits e diff completo, respeite o template, atualize PR existente e relate validações/riscos. Use draft se houver trabalho incompleto, testes pendentes ou decisões abertas; não faça merge.
- Contatos pessoais exigidos pelo enunciado só entram na entrega com os dados e a autorização do candidato; não invente nem copie contatos de terceiros.

## 15. Checklist de revisão

- [ ] Mudança atende ao escopo e aos critérios de aceite dos documentos.
- [ ] Componentes e casos de uso têm responsabilidade única e respeitam os limites de tamanho.
- [ ] Interface usa Tailwind; a única entrada CSS contém apenas infraestrutura permitida.
- [ ] Fronteiras de módulos, estados e contratos estão preservadas.
- [ ] Backend revalida permissões, entradas e invariantes sem confiar no cliente.
- [ ] Dinheiro, snapshots, transações, revisões e ordem de decisão seguem o contrato.
- [ ] Estados de interface, recuperação de falhas, responsividade e acessibilidade foram considerados.
- [ ] Testes e verificações pertinentes passaram ou limitações estão explicitamente relatadas.
- [ ] Documentação acompanha as alterações; nenhum segredo ou arquivo indevido foi incluído.
