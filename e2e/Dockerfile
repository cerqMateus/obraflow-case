FROM node:24.18.1-bookworm-slim AS node
FROM mcr.microsoft.com/playwright:v1.56.1-noble AS tools
# The browser image ships Node 22; the workspace requires the same Node 24 as the apps.
COPY --from=node /usr/local/ /usr/local/
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
# Enable only the workspace manager: the browser image has a dangling Yarn link.
RUN corepack enable pnpm && corepack prepare pnpm@10.20.0 --activate
WORKDIR /workspace
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
COPY e2e/package.json e2e/package.json
RUN pnpm install --frozen-lockfile
COPY tsconfig.base.json eslint.config.mjs ./
COPY e2e e2e
WORKDIR /workspace/e2e
