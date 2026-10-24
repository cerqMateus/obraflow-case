FROM node:24.18.1-bookworm-slim AS tools
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@10.20.0 --activate
WORKDIR /workspace
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
RUN pnpm install --frozen-lockfile
COPY tsconfig.base.json eslint.config.mjs ./
COPY backend backend
COPY docs/openapi.json backend/contract/openapi.json
COPY scripts scripts
COPY docs/openapi.json docs/openapi.json
WORKDIR /workspace/backend
RUN pnpm run db:generate

FROM tools AS build
RUN pnpm run build
RUN pnpm --filter @obraflow/backend --prod deploy --legacy /output

FROM node:24.18.1-bookworm-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /output/node_modules ./node_modules
COPY --from=build --chown=node:node /workspace/backend/dist ./dist
COPY --from=build --chown=node:node /workspace/backend/generated ./generated
COPY --from=build --chown=node:node /workspace/backend/contract ./contract
COPY --from=build --chown=node:node /workspace/backend/prisma/migrations ./prisma/migrations
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
