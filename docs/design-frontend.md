# ObraFlow / Dokimos — Design do frontend

Data: 24/10/2026. Status: login e shell implementados na SPEC-005; telas de negócio especificadas para marcos futuros. Sem validação visual executada.

Este documento aplica a identidade de [DESIGN.md](../DESIGN.md) às telas previstas. O contexto está em [PRODUCT.md](../PRODUCT.md); domínio e permissões seguem a [visão geral](visao-geral.md); dados, limites e erros seguem o [contrato da API](contrato-api.md). As recomendações abaixo não alteram esses contratos.

## 1. Direção e origem das decisões

**Confirmado pelo usuário:** proximidade com as quatro referências Syntro, incluindo a mesma paleta e a Manrope.

**Implementado na SPEC-005:** login, consulta de sessão, feedback de falha e estrutura responsiva privada. Tokens reais e inventário extraído estão em DESIGN.md e `.impeccable/design.json`. As seções de negócio abaixo descrevem contratos futuros, não telas existentes. Não foi realizada inspeção visual desktop/móvel nem aceitação integrada com API e PostgreSQL reais.

Modo das superfícies: **Operate**. O usuário precisa solicitar, conferir, decidir ou configurar. A primeira área visível deve esclarecer contexto, situação e ação disponível, sem uma abertura promocional.

As referências orientam linguagem e acabamento; não justificam adicionar dashboard, economia estimada, orçamento ou outras capacidades ausentes do produto. As imagens originais estão anexadas à conversa, em arquivos temporários, e não são dependência do frontend.

## 2. Arquitetura de navegação

| Área | Operador | Admin |
|---|---|---|
| Pedidos | Próprios e aqueles de cuja cadeia participa | Todos, para consulta |
| Novo pedido | Disponível | Não disponível nesta versão |
| Decisão | Somente sua etapa atual | Não disponível |
| Obras e responsáveis | Seleção de obra no pedido, sem gestão | Gestão |
| Regras de alçada | Sem acesso à configuração | Gestão |

- Entrada após login: lista de pedidos, com pendências pessoais destacadas para Operador.
- Sidebar: marca textual, Pedidos e, para Admin, Obras e Alçadas. Mostrar nome e role da conta, além de Sair.
- “Novo pedido” aparece como ação da página de pedidos; não duplicar um botão dominante na sidebar.
- Cabeçalho mostra título e contexto. No detalhe, oferecer retorno à lista preservando filtros e página quando possível.
- Não oferecer atalhos administrativos a Operador. Visibilidade da navegação complementa autorização no servidor.
- Não exibir sino de notificações, busca global ou seletor de tema sem funcionalidade prevista.

Rotas fixadas na SPEC-005: `/login`, `/pedidos`, `/pedidos/novo`, `/pedidos/:orderId`, `/admin/obras`, `/admin/obras/:projectId` e `/admin/alcadas`. Somente login e shell estão implementados neste marco. Rotas futuras exibem indisponibilidade explícita; não há botão Novo pedido ou links de gestão anunciados como funcionais. Acesso direto administrativo por Operador e criação por Admin exibem acesso restrito. Qualquer deep link privado sem sessão conduz ao login.

## 3. Medidas e tokens da SPEC-005

Valores extraídos de `frontend/src/app/styles.css` e dos componentes; DESIGN.md concentra os tokens normativos. Não são medidas visuais aferidas no navegador.

| Elemento | Implementação atual |
|---|---|
| Fonte | Manrope Variable local por Fontsource; licença SIL OFL distribuída |
| Sidebar desktop | 224 px a partir de 768 px |
| Conteúdo privado | Margem 16 px; 32 px a partir de 640 px; 48 px a partir de 1024 px |
| Login | Duas colunas a partir de 1024 px; formulário até 384 px |
| Título principal | 30/36 px, peso 600 |
| Mensagem ampla do login | 48/60 px, peso 600 |
| Corpo e campos | 16/24 px; textos de apoio podem usar entrelinha ampliada |
| Labels e botões | 14/20 px, peso 600 |
| Metadados | 12/16 px |
| Controles | Botões com mínimo 44 px; inputs 48 px; visibilidade da senha 44 × 44 px |
| Cantos | Campos e navegação 8 px; controle da senha 6 px; coluna do login 24 px; botões cápsula |
| Profundidade | Superfícies planas e contornos; sem sombra de superfície |
| Movimento | Transição de cor nos botões, removida com movimento reduzido |

A navegação móvel expande no fluxo, sem overlay. Seguir Pedidos recolhe a navegação e leva o foco ao conteúdo. O controle de senha oferece área de toque de 44 × 44 px; a inspeção real de acessibilidade continua pendente. Não há diálogo, drawer, tabela ou cadeia implementados.

Cores de marca, ação, foco e erro já estão definidas; sucesso e pendência são reservas sem consumidores. Cálculos sRGB dos pares estão em DESIGN.md; não equivalem a inspeção visual nem certificação de contraste em todos os estados.

## 4. Telas e visualizações

### 4.1 Login — implementado na SPEC-005

Formulário compacto em superfície Paper sobre Surface. Desktop usa região lateral grafite com identificação do serviço; celular conserva a identificação e prioriza o formulário. Sem fotografias, métricas ou promessa comercial inventada.

Conteúdo: ObraFlow, identificação discreta de Dokimos, e-mail, senha com controle acessível de visibilidade e “Entrar”. Labels persistentes; permitir colar senha e usar gerenciador de credenciais. Não incluir “Criar conta”, “Esqueci minha senha” ou “Lembrar-me” nesta versão.

Durante envio, anunciar progresso e impedir envio duplicado. Falha de credencial usa mensagem geral, sem revelar existência de conta; indisponibilidade oferece tentativa novamente. Após autenticação, exibir nome e role reais da sessão.

### 4.2 Pedidos e aprovações — contrato futuro

**Tarefa:** encontrar um pedido e identificar se há decisão disponível. **Primeiro viewport:** título, ação de criação quando permitida, filtros e início da lista. **Assinatura:** situação acompanhada da etapa atual, nunca apenas um badge.

Composição desktop, em ordem:

1. Título “Pedidos” e ação “Novo pedido” para Operador.
2. Filtro “Aguardando minha decisão” para Operador e filtros de obra e situação.
3. Tabela ampla e paginação de servidor.

| Coluna | Apresentação |
|---|---|
| Pedido | Identificador legível, com link explícito para detalhes |
| Obra / fornecedor | Hierarquia em duas linhas quando necessário |
| Data | Formatação brasileira, sem alterar a data civil por conversão de fuso |
| Itens | Quantidade total de itens do pedido |
| Total | Moeda brasileira, alinhada à direita |
| Situação | Pendente, aprovado ou rejeitado; texto e sinal visual |
| Etapa atual | Responsável atual e posição; pedidos finais indicam fluxo concluído ou encerrado |

Não aprovar diretamente pela linha: abrir contexto com itens e cadeia antes de decidir. A linha pode facilitar o clique, mas o link deve funcionar por teclado. Não usar uma linha inteira como substituto da semântica de tabela.

No celular, cada pedido vira bloco com identificador, obra, fornecedor, data, quantidade, total, situação e etapa. Metadados podem ocupar uma segunda linha; valores essenciais não desaparecem.

Sem indicadores no escopo inicial: não calcular contagem global ou somatório a partir da página carregada. Uma expansão futura exige agregação autorizada e contrato próprio.

### 4.3 Novo pedido

**Tarefa:** preencher vários itens, conferir total e cadastrar. Desktop usa área principal e resumo lateral; celular usa uma coluna. A tela inicia com um item vazio.

- Dados gerais: obra, fornecedor, data do pedido e observações internas opcionais.
- Itens: descrição, quantidade, unidade, preço unitário, total calculado e remoção com nome acessível que identifique o item.
- “Adicionar item” é uma ação secundária. Inserção preserva o preenchimento e leva o foco ao novo item.
- Resumo: obra e fornecedor selecionados, quantidade de itens, total estimado e “Cadastrar pedido”. Identificar totais como calculados e não editáveis.
- O servidor determina total e cadeia definitiva. Não mostrar uma prévia de regra ou cadeia baseada em dados administrativos que o Operador não pode consultar.
- Após sucesso, abrir detalhes retornados pelo servidor com confirmação e cadeia persistida.

Na largura ampla, resumo pode acompanhar a rolagem. No celular, fica depois dos itens; evitar barra fixa que cubra campos ou teclado virtual. Itens viram grupos verticais, mantendo todos os campos e totais.

Validar ao sair do campo e durante correção após erro, sem acusar todos os campos antes da interação. O cadastro fica indisponível enquanto inválido ou enviando; explicar o que falta em mensagem visível, sem depender de tooltip em botão desabilitado. Se não houver itens, manter “Adicionar item” acessível e explicar o impedimento.

Sem obras ou fornecedores, oferecer orientação contextual; o Operador solicita apoio ao Admin. Sem regra aplicável, preservar formulário e apresentar “Não há regra de aprovação para esta obra e este valor. Solicite a configuração ao administrador.” Não oferecer acesso às regras ao Operador.

### 4.4 Detalhe do pedido

Cabeçalho com identificador, situação, obra, fornecedor, data, solicitante e total. Corpo principal mostra itens e observações; região lateral mostra a cadeia. Histórico abaixo, com autor, decisão, instante e motivo de rejeição quando houver.

| Etapa | Representação |
|---|---|
| Concluída | Número ou ícone de confirmação, nome e registro da decisão |
| Atual | Maior contraste, nome e texto “Aguardando decisão” |
| Futura | Tratamento neutro e texto “Próxima etapa” |
| Rejeitada | Indicação explícita, motivo e encerramento |
| Futura após rejeição | “Não iniciada — fluxo encerrado”; nunca representar como aprovação |

Cadeia vertical é a apresentação de referência e funciona também com até 20 etapas. Não truncar responsáveis sem permitir consultar a sequência completa. No celular, mover cadeia para antes do histórico e manter acesso fácil aos itens.

Somente na etapa atribuída ao usuário, oferecer “Aprovar pedido” e “Rejeitar”. Para outra pessoa, informar “Aguardando decisão de [nome]”. Em pedidos finais, manter decisões desabilitadas com explicação textual próxima; para Admin, usar apresentação de consulta, sem controles que sugiram poder de decisão.

Aprovação usa confirmação compacta com identificador e total, sem concluir antes da resposta do servidor. Rejeição usa diálogo com identificador, total, motivo obrigatório e “Confirmar rejeição”. Cancelar retorna o foco ao disparador.

### 4.5 Regras de alçada

Área exclusiva do Admin. Seleção de obra no topo; abaixo, cobertura, faixas ordenadas e controles de edição. Faixas são linhas ou painéis amplos, sem um cartão para cada pessoa.

Cada faixa exibe limites em linguagem inequívoca e sua cadeia completa. Exemplos ilustrativos: “De R$ 0,00 até R$ 10.000,00” e “Acima de R$ 10.000,00, sem limite superior”. Limite inferior informado é exclusivo; superior é inclusivo; ambos ausentes significam todos os totais válidos. Não usar rótulos que confundam inclusão do limite.

Edição de faixa pode usar painel lateral; em telas pequenas, superfície de largura completa. Campos de limites precisam distinguir ausência de limite de zero. Selecionar apenas operadores com responsabilidade ativa na obra. Etapas numeradas têm controles “Subir” e “Descer”, além de adicionar/remover; arraste não é necessário.

Alterações ficam locais até “Salvar configuração”, que envia o conjunto inteiro. “Aplicar faixa” no painel altera apenas a edição local; não comunicar persistência antes do salvamento global. Remover faixa também marca alteração local. Avisar ao trocar de obra ou sair com mudanças não salvas e permitir continuar editando.

Mostrar lacunas e sobreposições de forma distinta: lacuna é aviso de cobertura e pode ser salva conforme contrato; sobreposição é inválida. Informar “Alterações valem para novos pedidos”. Conflito de revisão exige reconciliação explícita; não sobrescrever nem descartar silenciosamente a edição local.

### 4.6 Obras

Lista de obras, ação “Nova obra” e edição de nome em painel lateral. Abrir uma obra leva ao contexto de responsáveis, com acesso à sua configuração de alçadas. Não inventar endereço, orçamento, percentual de execução ou situação de obra como campos existentes.

Exibir loading, vazio e erro; somente confirmar criação ou edição após resposta persistida. Não oferecer exclusão de obra nesta versão.

### 4.7 Responsáveis por obra

Dentro da obra selecionada, mostrar operadores vinculados e estado do vínculo. Separar ativos de revogados por filtro explícito. “Adicionar responsável” abre seleção pesquisável e paginada de operadores elegíveis, sem incluir Admin.

“Revogar responsabilidade” abre confirmação com pessoa e obra. Se houver impedimentos, manter vínculo e mostrar contagens e referências devolvidas pelo servidor. Quando a relação estiver truncada, comunicar que existem outros impedimentos. Não sugerir revogação parcial ou substituição em pedidos enviados.

## 5. Componentes implementados e previstos

Implementados: Button (principal, contorno e ghost), Input, formulário de login, estrutura de navegação e estados de sessão/indisponibilidade. O catálogo `.impeccable/design.json` traduz os primitivos existentes para consulta isolada; não é código de produção nem prova visual. Não há variante destrutiva, tabela, badge, diálogo ou cadeia implementados. O inventário abaixo orienta os próximos marcos:

| Componente | Contrato visual e de interação |
|---|---|
| Estrutura da aplicação | Sidebar, cabeçalho, conteúdo e identidade da sessão |
| Cabeçalho de página | Título, contexto curto e ação dominante quando aplicável |
| Botão | Primário, secundário, textual e destrutivo; foco, progresso e indisponibilidade com explicação |
| Campo | Label, indicação de obrigatório, ajuda quando necessária e erro associado |
| Seletor pesquisável | Carregamento, vazio, erro e busca/paginação de servidor; seleção identificável por teclado |
| Tabela / bloco de pedido | Mesmos dados essenciais nas duas apresentações; links acessíveis e paginação |
| Situação | Texto e ícone ou forma, além da cor; sem aparência de botão quando não interativo |
| Cadeia de aprovação | Ordem, pessoa, estado e decisão; diferencia encerramento de conclusão |
| Resumo financeiro | Total alinhado e destacado; estimativa local distinta do total persistido |
| Diálogo / painel | Título, contexto, foco contido, fechamento acessível e retorno ao disparador |
| Estado de lista | Loading, ausência de cadastros, filtro sem resultado e erro recuperável |
| Feedback de operação | Confirmação após resposta; erro persistente junto à tarefa, sem depender de mensagem temporária |

## 6. Estados e recuperação

| Estado | Comportamento esperado |
|---|---|
| Carregando lista ou seletor | Estrutura estável e anúncio de progresso; não exibir vazio antes da resposta |
| Lista vazia | Explicar ausência e oferecer ação permitida |
| Filtro sem resultado | Preservar filtros e oferecer limpar; não sugerir ausência de cadastros |
| Erro de leitura | Mensagem contextual e “Tentar novamente” |
| Erro de campo | Mensagem junto ao campo; associar descrição e invalidade semanticamente |
| Enviando | Progresso, bloqueio de duplicação e preservação do conteúdo |
| Falha de escrita | Manter dados e orientar recuperação; não simular sucesso |
| Resultado incerto por perda de conexão | Explicar incerteza; não repetir mutação automaticamente nem prometer ausência de duplicidade |
| Conflito de decisão | Informar que o pedido mudou, atualizar detalhes e exigir nova leitura; não reenviar decisão |
| Conflito de regra | Preservar edição local para comparação e solicitar revisão antes de salvar novamente |
| Sessão expirada | Encerrar contexto autenticado, limpar dados privados e retornar ao login; não restaurar dados sob outra conta |
| Sem acesso | Mensagem neutra, retorno seguro e ausência de conteúdo privado |
| Sucesso | Confirmar com dados retornados pelo servidor e atualizar leituras afetadas |

Feedback temporário pode complementar uma confirmação, mas não ser a única forma de entender erro ou resultado. Não usar skeleton pulsante quando movimento reduzido estiver ativo.

## 7. Conteúdo, dinheiro e volume

- Interface em pt-BR, com verbos concretos: cadastrar, aprovar, rejeitar, salvar configuração e revogar responsabilidade.
- Dinheiro em real brasileiro; quantidade aceita até três casas decimais e preço até duas, conforme contrato. Não truncar entrada inválida.
- Cálculo local serve à estimativa: arredondar cada total de item antes da soma conforme contrato e substituir pelo total persistido após cadastro.
- Valor ausente é “Não informado” quando aplicável; zero válido é apresentado como zero. Não usar travessão para situações semanticamente diferentes sem rótulo.
- Datas civis preservam o dia informado. Instantes do histórico usam o fuso do navegador, identificado na área do histórico, conforme a visão geral. A proposta anterior de fixar America/Sao_Paulo foi substituída por essa regra na consolidação das specs.
- Limites de conteúdo seguem o contrato: até 100 itens por pedido, 50 faixas por obra e 20 etapas por faixa. Listas e seletores não podem carregar apenas a primeira página e aparentar completude.
- Verificar descrições e nomes longos, valores financeiros máximos e motivos extensos. Quebrar texto ou oferecer expansão; não ocultar informação crítica em tooltip.
- Distinguir limite de coleção de erro de conexão; explicar quando “Adicionar” não está disponível por limite atingido.

## 8. Acessibilidade e responsividade

- Meta de contraste: 4,5:1 para texto comum; 3:1 para texto grande e limites gráficos essenciais. Verificar pares reais, incluindo estados e controles sobre cada superfície.
- Foco visível e não encoberto, sequência coerente e operação completa por teclado.
- Campos com labels; placeholder nunca substitui label. Erros associados aos campos e resumo focável quando necessário para localizar falhas de envio.
- Botões de ícone têm nome acessível; ordenação de etapas anuncia nova posição.
- Diálogos têm título acessível, foco inicial adequado, Escape/cancelamento e retorno ao disparador; não fechar silenciosamente um motivo já digitado.
- Cabeçalhos de tabela preservam associação com células. Na versão em blocos, cada valor tem rótulo compreensível.
- Anunciar carregamento e resultado sem interromper a leitura a cada tecla. Evitar regiões de anúncio duplicadas.
- Testar reflow a 320 px, texto ampliado e zoom de 200%; não permitir sobreposição de ações fixas ao conteúdo ou foco.
- Respeitar movimento reduzido. Cor, hover e arraste nunca são requisitos únicos para compreender ou operar.

## 9. Validação e próximos marcos

Ordem funcional definida em [SPECS.md](../SPECS.md): base backend → login/estrutura → obras → responsabilidades → alçadas → consulta de pedidos → cadastro → decisões → revisão integrada. A sugestão visual anterior de começar pela lista não determina a ordem de implementação. Cada incremento já inclui estados, responsividade e acessibilidade aplicáveis; a revisão final verifica a experiência como um todo.

Antes de considerar a interface pronta:

- [x] Registrar tokens implementados e gerar o catálogo de componentes a partir do código na SPEC-005.
- [ ] Validar paleta em uso, especialmente contraste de botões vermelhão e distinção de rejeição.
- [ ] Inspecionar desktop amplo, largura intermediária e celular em uma rodada conjunta.
- [ ] Exercitar teclado, foco, zoom e movimento reduzido.
- [ ] Conferir os estados de leitura, escrita e concorrência de cada tela.
- [ ] Conferir Admin, Operador solicitante, responsável atual e participante futuro.
- [ ] Exercitar nomes longos, máximos financeiros, 100 itens e cadeias de 20 etapas.
- [ ] Confirmar que edição local, estimativa e resposta persistida estão distinguíveis.
- [ ] Validar fluxos e permissões contra a API real; mock visual não comprova autorização.

**Em aberto:** símbolo próprio da marca; revisão visual e de contraste em todos os estados; teclado, zoom e reflow reais; aceitação integrada de login/logout e permissões com API e banco reais; implementação dos próximos marcos de negócio. A fonte e sua licença, os tokens de foco/erro e as medidas atuais já estão incorporados.

A documentação da SPEC-005 foi extraída do código. Na execução da SPEC-005 passaram lint, tipos, build de produção e 11 testes unitários/de componentes em 4 arquivos, incluindo regressão de foco na navegação móvel para a mesma rota. O código E2E passou por lint e tipos, sem execução de navegador. Essas evidências não substituem a inspeção visual nem o fluxo real integrado. A construção de novas imagens Docker e a rodada visual desktop/móvel foram adiadas pelo usuário devido à pressão de espaço em disco. Nenhuma captura de tela ou certificação visual é entregue por esta atualização.

As rampas tonais do sidecar são sintetizadas apenas para prévia de paleta no catálogo; não constituem tokens implementados. Os exemplos HTML/CSS são isolados e não executam autenticação ou navegação da aplicação.
