---
id: SPEC-001
status: planned
depends_on: []
user_stories: ["US-13"]
operation_ids: []
---

# SPEC-001 — Workspace e Docker executáveis

## Objetivo

Criar a base reproduzível do monorepo e comprovar que PostgreSQL, um backend Nest mínimo e um frontend mínimo compilado se comunicam. Ainda não implementar funcionalidades de negócio ou autenticação.

## Entradas e dependências

Ler [roteiro e comandos](../../SPECS.md), [AGENTS.md](../../AGENTS.md), [arquitetura](../visao-geral.md) e [contrato](../contrato-api.md). Sem dependência de outra spec.

## Escopo e entregáveis

- Workspace pnpm, pacotes `@obraflow/backend` e `@obraflow/frontend`, lockfile único, TypeScript estrito e scripts iniciais.
- Dockerfiles com etapas de ferramentas, build e execução; backend sem privilégios e frontend compilado servido por Nginx.
- `compose.yaml`, `compose.dev.yaml`, exemplos de ambiente, `.dockerignore`, rede e volume nomeado do banco.
- Entrada pública `http://localhost:8080`; encaminhamento de `/api` sem remover prefixo; backend e PostgreSQL sem publicação de portas por padrão.

## Fora do escopo

Não implementar entidades, rotas de negócio, seed completo, design de páginas ou falsa autenticação. Frontend mínimo é uma superfície técnica temporária, não uma tela concluída do produto.

## Tarefas de execução

1. [ ] Conferir Git e documentos atuais. Consultar documentação das versões candidatas e fixar Node, pnpm, PostgreSQL, React, Nest e dependências compatíveis; documentar motivos e requisitos, sem usar `latest` nas imagens.
2. [ ] Criar manifests e configurações mínimas das duas aplicações. Registrar `dev`, `lint`, `typecheck` e `build`, e `start` no backend. Não criar testes vazios ou scripts que sempre retornam sucesso.
3. [ ] Criar servidor Nest mínimo e compilação React mínima; ambos devem escutar interfaces adequadas aos containers. Manter a estrutura modular prevista sem gerar controllers de funcionalidades futuras.
4. [ ] Criar Dockerfiles com contexto na raiz para acesso ao lockfile; instalar com lockfile congelado. Manter ferramentas e código necessários aos testes fora da imagem final de execução.
5. [ ] Configurar Nginx para assets e fallback de rotas SPA; `/api` deve ser encaminhado ao backend antes do fallback, preservando caminho, host/origem pertinentes e limites do contrato.
6. [ ] Configurar `postgres` com volume nomeado e healthcheck; backend aguarda banco saudável. Criar `backend-tools` e `frontend-tools` no perfil `tools` para os scripts de qualidade; `migrate` só será conectado na SPEC-002.
7. [ ] Documentar configuração de `.env` a partir do exemplo e geração de segredo local forte sem exigir Node no host. Não colocar segredos nos exemplos, imagens ou variáveis públicas do frontend. Manter segredo estável entre reinícios.
8. [ ] Criar overlay de desenvolvimento com código montado e atualização automática, preservando `/api` na mesma origem. Não montar `node_modules` do Windows sobre dependências Linux.
9. [ ] Acrescentar instruções reais iniciais de execução ao README sem apagar o enunciado, identificando o que ainda não está implementado.

## Critérios e cenários de aceite

- **AC-001-01:** com Docker e ambiente configurado, build e inicialização funcionam sem Node/pnpm/PostgreSQL instalados no host.
- **AC-001-02:** o navegador abre a superfície mínima em `localhost:8080`; uma chamada técnica encaminhada chega ao Nest, não ao fallback HTML.
- **AC-001-03:** reiniciar/recriar containers sem excluir volumes mantém o mesmo volume nomeado e diretório de dados do PostgreSQL. A prova com registros reais ocorre na SPEC-002, depois das migrations, sem criar tabelas de negócio provisórias.
- **AC-001-04:** backend não é liberado antes do banco saudável; nenhuma porta do banco está publicada inadvertidamente.
- **AC-001-05:** dev e build compilado usam a mesma fronteira `/api`; secrets não aparecem no bundle nem no contexto de build.

## Verificação e conclusão

Conferir os scripts criados. Executar lint, tipos e build das duas aplicações e `docker compose config --quiet`; depois `docker compose up --build -d`, consultar estado/logs seguros e abrir a superfície mínima. Validar o overlay de desenvolvimento separadamente. Registrar o volume mantido e os requisitos efetivamente utilizados. Não declarar funcionamento de autenticação, pedidos ou alçadas.

## Comandos de verificação

Comandos planejados, disponíveis após as tarefas e dependências desta spec. Conferir os manifests antes de executar. Integração/E2E exigem o projeto isolado já iniciado conforme [SPECS.md](../../SPECS.md); não usar banco de trabalho. As suites contêm somente comportamentos já implementados neste marco.

```powershell
docker compose config --quiet
docker compose -f compose.yaml -f compose.dev.yaml config --quiet
docker compose --profile tools run --rm backend-tools pnpm run lint
docker compose --profile tools run --rm backend-tools pnpm run typecheck
docker compose --profile tools run --rm backend-tools pnpm run build
docker compose --profile tools run --rm frontend-tools pnpm run lint
docker compose --profile tools run --rm frontend-tools pnpm run typecheck
docker compose --profile tools run --rm frontend-tools pnpm run build
docker compose up --build -d
```

## Registro de execução

Não iniciada. Preencher data, versões fixadas, arquivos, comandos/resultados, prova de rede/persistência e pendências antes de alterar `status` para `verified`.
