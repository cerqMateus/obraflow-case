# ObraFlow / Dokimos — Produto

<!-- impeccable:product-schema 1 -->

Documento de contexto para o frontend. Atualizado em 26/10/2026. A SPEC-005 implementa login, consulta da sessão e estrutura privada do frontend. A SPEC-006 implementa administração de obras e catálogos reais por API. A SPEC-007 acrescenta gestão de responsáveis dentro da obra, com histórico e impedimentos por regras/pedidos. Compras e configuração de alçadas continuam sendo requisitos futuros.

## Platform

web

Aplicação responsiva para desktop e navegador móvel. Não há aplicativo nativo previsto.

## Users

- **Operador:** solicita compras para obras, acompanha seus pedidos e decide as etapas às quais foi atribuído.
- **Admin:** acompanha todos os pedidos e configura obras, responsabilidades e regras de alçada. Não decide por operadores nem cria pedidos nesta versão.

Responsável por uma etapa é uma atribuição do Operador, não uma terceira role. Responsabilidade por obra torna o operador elegível para uma cadeia, sem lhe conceder acesso ou decisão sobre qualquer pedido da obra.

## Product Purpose

Organizar pedidos de compra com vários itens e aprovação sequencial conforme obra e valor total, preservando decisões e histórico. O serviço de aprovações é denominado Dokimos; a interface pertence ao ObraFlow.

## Operating Context

O fluxo principal é entrar, cadastrar um pedido, conferir sua cadeia e registrar decisões em ordem. A rejeição exige motivo e encerra o fluxo. O Admin prepara obras, vínculos e regras para os novos pedidos.

A avaliação deve ser possível localmente com dados fictícios e contas de demonstração, sem serviços pagos ou credenciais externas. Contas de demonstração usam login; não há seletor livre de identidade.

## Capabilities and Constraints

- Operador pode solicitar em qualquer obra disponível, mesmo sem responsabilidade nela.
- Operador consulta pedidos próprios ou aqueles de cuja cadeia participa, inclusive concluídos; Admin tem visão global.
- Somente o Operador da etapa atual pode decidir; pode ser também o solicitante.
- Cadeia e histórico de pedido enviado são preservados. Mudanças de regra valem para novos pedidos.
- Regras são salvas como configuração completa por obra; faixas não herdam etapas de outras faixas.
- Valores e situação persistidos pelo servidor prevalecem sobre estimativas locais.
- Listas são paginadas; seletores precisam oferecer acesso a resultados além da primeira página.
- Não fazem parte desta versão: rascunhos persistidos, edição ou reenvio de pedidos, anexos, notificações, gráficos analíticos, telas de usuários e fornecedores, recuperação de senha ou cadastro público.
- Limites, precisão financeira, conflitos e transporte seguem o contrato existente, sem redefinição neste documento.

## Brand Commitments

O usuário confirmou uma identidade próxima das referências Syntro anexadas à conversa: mesma paleta e família Manrope. A referência orienta a linguagem visual; sua marca, logotipo, textos e métricas não são conteúdo do ObraFlow.

Interface em português brasileiro, com contexto, valores e próxima ação fáceis de localizar. O sistema de design extraído da SPEC-005 está em [DESIGN.md](DESIGN.md).

## Evidence on Hand

- [Enunciado](README.md).
- [Visão geral e decisões de domínio](docs/visao-geral.md).
- [Contrato planejado](docs/contrato-api.md) e [OpenAPI](docs/openapi.json).
- Quatro referências visuais fornecidas pelo usuário na conversa: interface, paleta, tipografia e diálogo. Os anexos estão em caminhos temporários; não são assets distribuídos pelo repositório.

A SPEC-005 contém login com validação, estados de sessão e estrutura responsiva de navegação, usando a API de autenticação e sem seletor fictício de identidade. Admin pode listar, cadastrar e editar nomes de obras e conceder/revogar responsabilidades. Usuários e fornecedores são cadastrados somente por API. Compras e alçadas exibem indisponibilidade ou acesso restrito. Evidências HTTP, PostgreSQL e navegador estão nos registros de execução das specs; as referências de regras/pedidos da SPEC-007 usam fixtures persistidas, pois suas rotas ainda não existem. Manrope é distribuída localmente, com licença SIL OFL preservada. Nenhuma imagem de referência é asset do frontend.

## Product Principles

- Mostrar quem pode agir e qual é a próxima etapa.
- Conservar contexto e preenchimento diante de falhas recuperáveis.
- Distinguir informação ausente, carregamento, erro e resultado vazio.
- Preservar rastreabilidade, ordem de decisão e limites de acesso.

## Accessibility & Inclusion

Navegação por teclado, labels persistentes, foco gerenciado em diálogos, informação além da cor e adaptação para telas pequenas são requisitos já previstos. As SPEC-006/007 registram inspeção visual desktop/móvel, foco, pares de contraste e fluxos locais com API e banco reais. A revisão ampla de acessibilidade, zoom e todos os estados permanece na SPEC-013; as verificações realizadas não constituem certificação completa de conformidade.
