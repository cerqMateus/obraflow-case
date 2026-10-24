FROM node:24.18.1-bookworm-slim AS tools
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
WORKDIR /workspace/backend

FROM tools AS build
RUN pnpm run build
RUN pnpm --filter @obraflow/backend --prod deploy --legacy /output

FROM node:24.18.1-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build --chown=node:node /output/node_modules ./node_modules
COPY --from=build --chown=node:node /workspace/backend/dist ./dist
USER node
EXPOSE 3000
CMD ["node", "dist/main.js"]
