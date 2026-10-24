---
name: ObraFlow / Dokimos
description: Interface operacional clara, com superfícies quentes, Manrope e acento vermelhão.
---

<!-- SEED: established with the user before implementation; re-run $impeccable document once there's code to capture the actual tokens and components. -->

# Design System: ObraFlow / Dokimos

## Overview

**Creative North Star: "Clareza para decidir"**

Direção inicial baseada nas referências Syntro fornecidas pelo usuário e na escolha explícita de manter a paleta e a tipografia. O ObraFlow combina superfícies claras e quentes, texto grafite, curvas suaves e acentos vermelhão. Sua personalidade é sóbria, precisa e próxima.

O espaço organiza o trabalho; a informação operacional fornece a densidade. Valores, situação e responsável pela próxima etapa têm prioridade. Elementos decorativos não competem com a decisão. A identidade é expressa por proporção, tipografia e uso seletivo de cor.

**Key Characteristics:**

- Base neutra clara com contraste tipográfico firme.
- Manrope em títulos, valores, tabelas e formulários.
- Vermelhão concentrado em ações e navegação ativa.
- Painéis suaves com interiores organizados por alinhamento.
- Cadeia sequencial de aprovação como padrão visual recorrente.

Status: especificação anterior à implementação. A família e as seis cores abaixo estão confirmadas pela referência. Composições e comportamentos detalhados em [design do frontend](docs/design-frontend.md) são propostas de aplicação; dimensões, cores semânticas auxiliares e tokens definitivos dependem do primeiro protótipo.

## Colors

### Primary

| Cor da referência | Valor | Aplicação |
|---|---|---|
| Vermilion | `#EE4B34` | Marca, destaque de ação e navegação ativa |
| Deep Vermilion | `#D8402A` | Variação de interação; não presumir contraste suficiente com texto claro |

**Regra da ação dominante.** Cada contexto de tarefa apresenta uma ação principal. Um formulário dentro de diálogo tem seu próprio contexto; o fundo fica inerte enquanto o diálogo estiver aberto.

Vermelhão identifica a marca e a ação, não reprovação. Erro e rejeição precisam de uma família semântica distinguível, texto e ícone. A escolha dessa família e das cores de sucesso, pendência e foco permanece em aberto até a validação do protótipo.

### Neutral

| Cor da referência | Valor | Aplicação |
|---|---|---|
| Graphite | `#16181D` | Texto principal, números e regiões de alto contraste |
| Slate | `#5B636D` | Texto secundário e metadados |
| Paper | `#F7F5F3` | Superfícies de conteúdo |
| Surface | `#F1EFEC` | Fundo geral e áreas de suporte |

**Regra da cor com significado.** Estado nunca depende apenas da cor. Nomear a situação, distinguir etapa atual de etapa futura e explicitar impedimentos.

Na implementação, verificar cada par real de primeiro plano e fundo: meta mínima de 4,5:1 para texto comum e 3:1 para texto grande e elementos gráficos essenciais. Não presumir que texto branco sobre o vermelhão da referência atende ao requisito. Se necessário, usar texto grafite, um fundo operacional derivado mais escuro ou outro tratamento de contraste, documentando a derivação sem substituir as cores da marca.

## Typography

**Display Font:** Manrope, com fallback `system-ui, sans-serif`.
**Body Font:** Manrope, com o mesmo fallback.

Títulos e valores usam semibold; corpo usa regular; labels e ações usam medium. Pesos light e extra bold presentes na referência não precisam aparecer na interface operacional.

Hierarquia: título de página, título de seção, corpo, label e metadado. Valores totais podem ter escala maior, sem competir com a identificação da tarefa. Usar números tabulares em comparações financeiras, quando suportados pela fonte. Evitar texto operacional em caixa alta e espaçamento artificial entre letras.

A escala inicial recomendada está no documento de telas; os tamanhos efetivamente implementados serão registrados como tokens após o protótipo. Preferir fonte distribuída localmente, com licença preservada, para manter a execução independente de serviços externos. O arquivo de fonte ainda precisa ser incorporado.

## Layout

Navegação lateral discreta no desktop, cabeçalho compacto e uma área principal ampla. Títulos apresentam o contexto e a ação da página. A separação acontece por espaço, alinhamento e mudança tonal; cartões são reservados a grupos que precisam de identidade própria.

O formulário de compra pode usar duas colunas, com resumo lateral; listas e configurações precisam de largura para comparação. Essa composição pertence a cada tela, não é um molde obrigatório para todas as páginas.

Em telas pequenas, navegação recolhida, conteúdo em uma coluna e resumo reposicionado junto ao envio. Preservar itens, valores e cadeia; converter a apresentação antes de ocultar informação essencial. Rolagem horizontal deve ficar contida em regiões que realmente a exigem.

## Elevation & Depth

Profundidade produzida principalmente pela diferença tonal entre Surface e Paper. Contornos discretos reforçam limites interativos quando o contraste tonal não basta. Evitar sombras repetidas em cada painel.

Diálogos e painéis sobrepostos podem ter sombra leve e fundo escurecido. Conteúdo do fundo fica inerte e o foco permanece na superfície ativa. Não usar efeitos de vidro, texturas ou gradientes como camada decorativa.

Movimento serve à orientação: transições curtas de estado e abertura, sem deslocar informações financeiras durante leitura ou decisão. Respeitar a preferência por movimento reduzido; tempos finais dependem do protótipo.

## Shapes

Painéis principais têm cantos suaves mais amplos; campos, tabelas e controles mantêm curvas menores. Botões principais e etiquetas podem ter formato de cápsula. Evitar repetir cápsulas em todas as regiões.

Ícones devem pertencer a uma única família de traço consistente. Ações somente com ícone exigem nome acessível e explicação visual quando necessário. Não reproduzir o símbolo Syntro: enquanto não houver marca própria aprovada, usar ObraFlow como identificação textual.

## Do's and Don'ts

### Do

- Destacar valor total, situação e próxima etapa.
- Usar a paleta e a Manrope confirmadas como base da identidade.
- Organizar interiores de painéis com alinhamento e espaço.
- Preservar dados essenciais e decisões acessíveis no celular.
- Validar contraste, teclado e zoom na interface real.
- Documentar valores derivados e tokens após sua implementação.

### Don't

- Não copiar a marca, textos ou métricas da referência.
- Não usar vermelhão como único sinal de rejeição ou erro.
- Não inserir gráficos ou indicadores sem dados e finalidade no escopo.
- Não ocultar regras de permissão atrás de botões sem explicação.
- Não introduzir rascunhos, anexos, notificações ou reenvio por conveniência visual.
- Não apresentar este documento como prova de implementação ou conformidade.
