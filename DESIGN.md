---
name: ObraFlow / Dokimos
description: Interface operacional clara, com superfícies quentes, Manrope e acento vermelhão.
colors:
  background: "#F7F5F3"
  foreground: "#16181D"
  muted: "#F1EFEC"
  muted-foreground: "#5B636D"
  brand: "#EE4B34"
  brand-deep: "#D8402A"
  primary: "#B83120"
  primary-hover: "#9F291B"
  primary-foreground: "#FFFFFF"
  border: "#D8D2CB"
  input: "#827970"
  ring: "#245B86"
  destructive: "#9C2452"
typography:
  display:
    fontFamily: "Manrope Variable, system-ui, sans-serif"
    fontSize: "48px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Manrope Variable, system-ui, sans-serif"
    fontSize: "30px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Manrope Variable, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Manrope Variable, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.428571
  metadata:
    fontFamily: "Manrope Variable, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.333333
rounded:
  md: "6px"
  lg: "8px"
  3xl: "24px"
  full: "9999px"
spacing:
  2: "8px"
  3: "12px"
  4: "16px"
  5: "20px"
  6: "24px"
  8: "32px"
  12: "48px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.full}"
    typography: "{typography.label}"
    padding: "0 20px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-outline:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.full}"
    padding: "0 20px"
  button-ghost:
    textColor: "{colors.foreground}"
    rounded: "{rounded.full}"
    padding: "0 20px"
  input:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    height: "48px"
    padding: "0 12px"
  navigation:
    backgroundColor: "{colors.muted}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "0 12px"
---

# Design System: ObraFlow / Dokimos

## Overview

**Creative North Star: "Clareza para decidir"**

O ObraFlow combina superfícies claras e quentes, texto grafite, curvas suaves e acentos vermelhão. Sua personalidade é sóbria, precisa e próxima. A identidade confirmada pelo usuário preserva a paleta e a Manrope das referências Syntro, sem reproduzir sua marca, textos ou métricas.

O espaço organiza o trabalho; a informação operacional fornece a densidade. Valores, situação e responsável pela próxima etapa têm prioridade nas futuras telas de negócio. A SPEC-005 implementa login, sessão e estrutura de navegação; não implementa essas telas. Este registro foi extraído do código, sem inspeção visual no navegador.

**Key Characteristics:**

- Base neutra clara com contraste tipográfico firme.
- Manrope local em títulos, textos e formulários.
- Vermelhão de identidade e derivação escura para ações com texto branco.
- Superfícies planas, limites discretos e espaço para organizar conteúdo.
- Estados e indisponibilidade comunicados com texto explícito.

## Colors

A paleta combina vermelhão quente, grafite e neutros de papel. O frontmatter registra os valores efetivamente consumidos; a fonte de implementação é `frontend/src/app/styles.css`.

### Primary

- **Vermelhão de marca** (`brand`): ponto na identificação sobre grafite no login. `brand-deep` preserva a variação confirmada da identidade, ainda sem consumidor.
- **Vermelhão operacional** (`primary`): botão principal e ponto da marca no shell claro. Sua derivação mais escura permite texto branco; `primary-hover` diferencia a interação.
- **Azul de foco** (`ring`): contorno e anel de foco de controles.
- **Framboesa de erro** (`destructive`): mensagens e bordas inválidas; não confunde erro com a marca.

**The Cor com significado Rule.** Estado nunca depende apenas da cor; use texto e semântica acessível. Vermelhão de marca não representa rejeição.

### Neutral

- **Graphite** (`foreground`): texto principal e painel de identidade do login.
- **Slate** (`muted-foreground`): texto secundário, labels de suporte e metadados.
- **Paper** (`background`): controles, navegação e superfície clara de conteúdo.
- **Surface** (`muted`): fundo geral, navegação destacada e alertas de formulário.
- **Contorno quente** (`border`): separadores discretos, sem substituir limites interativos.
- **Limite de campo** (`input`): borda mais firme de campos.
- **Branco de ação** (`primary-foreground`): texto sobre o vermelhão operacional.

O CSS também reserva `success` e `pending`, sem consumidores na SPEC-005. Não há badges ou estados de aprovação implementados a extrair.

Cálculo sRGB dos pares definidos: Graphite/Paper 16,33:1; Slate/Paper 5,60:1; Slate/Surface 5,30:1; branco/ação 6,00:1; branco/hover 7,48:1; foco/Paper 6,62:1; erro/Surface 6,56:1; limite de campo/Paper 3,93:1; marca/Graphite 4,81:1. São cálculos dos tokens, não prova visual, nem auditoria completa de estados, opacidade ou conformidade.

## Typography

**Display Font:** Manrope Variable, com fallback `system-ui, sans-serif`.
**Body Font:** a mesma família.

**Character:** títulos firmes e leitura próxima, com regular no corpo e semibold em títulos, labels e ações. A fonte é empacotada localmente por Fontsource; licença SIL OFL preservada em `frontend/public/fonts/Manrope-OFL.txt` e distribuída no build.

### Hierarchy

- **Display:** mensagem de identidade do login, apenas na composição ampla.
- **Title:** título do login e título principal da área privada.
- **Body:** conteúdo e campos; parágrafos de apoio usam entrelinha ampliada conforme contexto.
- **Label:** identificação persistente dos campos e ações.
- **Metadata:** assinatura Dokimos e avisos curtos de disponibilidade.

Os valores normativos estão no frontmatter. A escala também inclui marca em 24 px e subtítulos em 18 px. Caixa alta e espaçamento artificial não são usados como linguagem operacional. Números financeiros tabulares seguem como requisito para telas futuras.

## Layout

A estrutura privada usa navegação lateral de 224 px a partir de 768 px. O conteúdo tem largura mínima flexível, margens de 16 px no celular, 32 px a partir de 640 px e 48 px a partir de 1024 px. A base aceita largura mínima de 320 px. A navegação móvel expande no fluxo: não é drawer, não sobrepõe conteúdo e não exige contenção de foco. Ao seguir Pedidos, recolhe e leva o foco ao conteúdo principal.

O login divide a área em duas colunas a partir de 1024 px, com identidade grafite à esquerda e formulário compacto à direita (largura máxima de 384 px). Abaixo disso, a mensagem ampla é ocultada e a identificação permanece acima do formulário. Não há imagens raster distribuídas; tipografia, cor e composição definem a identidade.

Formulários usam espaçamento vertical de 24 px entre grupos e 8 px entre label e campo. Tela futura de pedidos, resumo financeiro e cadeia não determinam um molde obrigatório: suas composições permanecem em `docs/design-frontend.md` como requisitos futuros.

## Elevation & Depth

A SPEC-005 é plana: diferenças tonais, contornos e espaço delimitam regiões, sem sombras de superfície. O anel de foco é sinal de interação. Diálogos e painéis sobrepostos ainda não existem; quando implementados devem gerenciar foco e contexto inerte conforme AGENTS.md.

Botões usam transição curta de cor, desativada com movimento reduzido. Não há animação de entrada, skeleton pulsante ou deslocamento decorativo implementado.

## Shapes

Campos e navegação têm curvas suaves; botões usam cápsulas. A coluna clara do login tem canto amplo na composição desktop. O frontmatter registra os raios observados, sem transformar cada região em cartão. Ícones Lucide mantêm traço consistente; ícones decorativos são ocultados da árvore acessível. A marca permanece textual, sem copiar o símbolo Syntro.

## Components

### Buttons

Ações firmes e contidas. O primitivo `Button` oferece principal, contorno e ghost, com altura mínima de 44 px, espaçamento horizontal de 20 px, foco visível e opacidade reduzida quando desabilitado. O principal escurece no hover; contorno e ghost recebem Surface. O login ocupa a largura do formulário e anuncia “Entrando…” durante submissão. Não há variante destrutiva implementada.

### Inputs / Fields

Campos de 48 px, Paper, borda interativa e preenchimento horizontal de 12 px. Foco troca a borda e acrescenta anel azul; invalidade altera borda e acompanha mensagem associada ao campo. Labels permanecem visíveis. Login aceita gerenciador de senhas e colagem. Mostrar/ocultar senha tem nome acessível e estado pressionado; sua área atual de 44 × 44 px atende à meta de toque do projeto, sem substituir a inspeção real de acessibilidade.

### Navigation

Pedidos é o único link de negócio disponível, sobre Surface e com peso semibold. Admin recebe aviso textual de que Obras e alçadas virão depois; não recebe links fictícios. Nome e role vêm da sessão; Sair informa progresso e mantém erro contextual se a saída não for confirmada. Link de salto permite alcançar o conteúdo principal. Nenhum painel administrativo ou listagem está implementado.

### Session and feedback

Consulta da sessão tem progresso anunciado, falha recuperável e tentativa explícita. Login tem validação por campo, alerta focável para falha, mensagens gerais de credenciais e bloqueio de duplicação durante envio. Rotas futuras apresentam indisponibilidade ou acesso restrito sem conteúdo especulativo. Não há tabela, card, badge, diálogo ou cadeia implementados neste marco.

## Do's and Don'ts

### Do

- Do preservar Manrope local, grafite, vermelhão e superfícies quentes.
- Do distinguir cores de marca, ação, foco e erro.
- Do organizar interiores com alinhamento e espaço.
- Do comunicar progresso, erro e indisponibilidade com texto acessível.
- Do validar teclado, contraste, reflow e zoom na interface real antes de declarar conformidade.

### Don't

- Don't copiar marca, textos ou métricas da referência.
- Don't usar vermelhão como único sinal de erro ou rejeição.
- Don't anunciar telas futuras como recursos disponíveis.
- Don't inserir gráficos, notificações, rascunhos ou anexos fora do escopo.
- Don't apresentar tokens, testes de componentes ou cálculos de contraste como validação visual ou integração real.
