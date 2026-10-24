---
id: SPEC-001
status: verified
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

1. [x] Conferir Git e documentos atuais. Consultar documentação das versões candidatas e fixar Node, pnpm, PostgreSQL, React, Nest e dependências compatíveis; documentar motivos e requisitos, sem usar `latest` nas imagens.
2. [x] Criar manifests e configurações mínimas das duas aplicações. Registrar `dev`, `lint`, `typecheck` e `build`, e `start` no backend. Não criar testes vazios ou scripts que sempre retornam sucesso.
3. [x] Criar servidor Nest mínimo e compilação React mínima; ambos devem escutar interfaces adequadas aos containers. Manter a estrutura modular prevista sem gerar controllers de funcionalidades futuras.
4. [x] Criar Dockerfiles com contexto na raiz para acesso ao lockfile; instalar com lockfile congelado. Manter ferramentas e código necessários aos testes fora da imagem final de execução.
5. [x] Configurar Nginx para assets e fallback de rotas SPA; `/api` deve ser encaminhado ao backend antes do fallback, preservando caminho, host/origem pertinentes e limites do contrato.
6. [x] Configurar `postgres` com volume nomeado e healthcheck; backend aguarda banco saudável. Criar `backend-tools` e `frontend-tools` no perfil `tools` para os scripts de qualidade; `migrate` só será conectado na SPEC-002.
7. [x] Documentar configuração de `.env` a partir do exemplo e geração de segredo local forte sem exigir Node no host. Não colocar segredos nos exemplos, imagens ou variáveis públicas do frontend. Manter segredo estável entre reinícios.
8. [x] Criar overlay de desenvolvimento com código montado e atualização automática, preservando `/api` na mesma origem. Não montar `node_modules` do Windows sobre dependências Linux.
9. [x] Acrescentar instruções reais iniciais de execução ao README sem apagar o enunciado, identificando o que ainda não está implementado.

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

Executada e verificada localmente em **24/10/2026**, limitada à infraestrutura. Nenhuma outra spec foi executada.

### Implementação e versões

- Workspace `@obraflow/backend` e `@obraflow/frontend`, `e2e/` reservado, lockfile único, TypeScript estrito e scripts reais de dev/lint/tipos/build/start conforme cada pacote.
- Node 24.18.1, pnpm 10.20.0, TypeScript 5.9.3, React 19.2.0, Vite 8.0.10, Nest 11.1.16, PostgreSQL 17.6-bookworm e Nginx 1.28.0-alpine. ESLint 10.13.0, typescript-eslint 8.72.0. Bibliotecas e imagens fixadas por versão; lockfile contém integridades dos pacotes.
- `decimal.js` 10.6.0 selecionada nas duas aplicações; política futura documentada no README, sem implementar cálculos nesta spec. `pg` 8.16.3 faz somente a sondagem de conexão; Prisma entra na SPEC-002.
- Dockerfiles com estágios tools/build/runtime, backend final como UID 1000, ferramentas em perfil próprio, rede e volume nomeado. Nginx serve assets e fallback SPA com `/api` encaminhado sem remoção de prefixo. Overlay monta somente fontes/entrada HTML, sem dependências Windows.
- `.env.example`, exclusão de segredos do Git e contexto Docker, e `scripts/init-env.mjs` para gerar segredos sem Node no host e recusar sobrescrita. README preserva o enunciado e inclui execução, desenvolvimento, validações e decisões.

### Comandos executados e resultados

- Ambiente usado: Windows/PowerShell, Node local 24.18.1 para validação adicional; Docker Engine 29.8.0 e Compose 5.5.1 com containers Linux. Execução principal e bootstrap comprovados por Docker, sem exigir esses runtimes no host do avaliador.
- `corepack pnpm install --frozen-lockfile`: passou. `corepack pnpm lint`, `corepack pnpm typecheck` e `corepack pnpm build`: passaram nas duas aplicações.
- Ambos os comandos `docker compose ... config --quiet` desta spec: passaram, incluindo overlay de desenvolvimento.
- `docker compose --profile tools build backend-tools frontend-tools` e os seis comandos de lint/typecheck/build listados acima: passaram dentro dos containers, com saída zero.
- `docker compose up --build -d`: passou; PostgreSQL e backend saudáveis, frontend disponível. Build usa instalação com lockfile congelado. O empacotamento de produção usa deploy legado do pnpm 10, que emite aviso sobre workspace compartilhado, sem falha.
- Bootstrap em diretório temporário de `docker run --rm ... node:24.18.1-bookworm-slim`: geração passou; segunda execução recusou sobrescrita e o arquivo permaneceu idêntico. Nenhum segredo foi exibido.
- `docker compose -f compose.yaml -f compose.dev.yaml up --build -d --force-recreate`: passou. Alterações temporárias nas fontes comprovaram recompilação/reinício do Nest e atualização automática visível no navegador pelo Vite; arquivos originais restaurados. API pelo mesmo `/api` retornou a marca temporária e voltou ao estado normal.
- `docker compose up --build -d --force-recreate`: passou ao retornar ao modo compilado. Ambiente final deixado em execução em `http://localhost:8080`.
- `git diff --check`: passou. Revisão dos arquivos novos e diff documental realizada; sem commits ou push.

### Evidências de aceite

| Critério | Evidência local |
| --- | --- |
| AC-001-01 | Builds e inicialização por Compose; geração do ambiente em container Node descartável; runtime backend sem TypeScript, ESLint ou concurrently |
| AC-001-02 | Navegador abriu React compilado e o link `/api/technical-status` mostrou `{"status":"ok"}`; Nest executa `SELECT 1` real no PostgreSQL antes de responder |
| AC-001-03 | Volume `obraflow_postgres-data` e destino `/var/lib/postgresql/data` mantidos nas recriações; inode do arquivo `global/pg_control` permaneceu `369655`, sem tabelas provisórias |
| AC-001-04 | Logs do Compose mostram banco Healthy antes do início do backend e backend Healthy antes do frontend; `compose ps` publica somente `127.0.0.1:8080`, sem portas do banco/backend no host |
| AC-001-05 | API verificada pelo Nginx e pelo Vite; `.env` excluído do build; busca pelos dois segredos locais nos assets da imagem Nginx não encontrou correspondência |

HTTP adicional: `/` e `/rota-spa` retornaram HTML 200; `/api/nao-existe` e `/api` retornaram JSON 404 do Nest, sem fallback HTML. Endpoints internos de saúde não são encaminhados pelo Nginx. Backend final confirmado com `id`: usuário `node`, UID/GID 1000.

### Decisões e limites

- A rota pública temporária `/api/technical-status` é infraestrutura mínima para demonstrar o proxy; `/health/live` e `/health/ready` continuam internos. Não se adicionaram operações de domínio ao OpenAPI. Remoção/consolidação dessa sondagem pode ocorrer na base HTTP da SPEC-003.
- Correções durante execução: instalação inicialmente limitada pela rede do sandbox, resolvida com acesso autorizado; build inicial capturou manifest e lockfile durante atualização, repetido com arquivos estabilizados; comandos recursivos passaram a usar Corepack para evitar o pnpm global 11.24.0 do host; injeção explícita no controller preserva metadados Nest e regra de imports do lint.
- Sem autenticação, entidades, migrations, seed, cálculos financeiros ou testes de negócio neste marco. Persistência com registros reais será comprovada na SPEC-002. Não há teste E2E automatizado, certificação visual desktop/móvel, nem prova de produção. Inspeção do navegador comprova apenas a superfície técnica e atualização do ambiente local.
- Tailwind e design de produto não foram antecipados; a página técnica usa HTML sem estilos. Não há pendências impeditivas dos critérios da SPEC-001.
