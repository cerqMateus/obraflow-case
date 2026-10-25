FROM node:24.18.1-bookworm-slim AS tools
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@10.20.0 --activate
WORKDIR /workspace
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY backend/package.json backend/package.json
COPY frontend/package.json frontend/package.json
COPY e2e/package.json e2e/package.json
RUN pnpm install --frozen-lockfile
COPY tsconfig.base.json eslint.config.mjs ./
COPY frontend frontend
WORKDIR /workspace/frontend

FROM tools AS build
RUN pnpm run build

FROM nginx:1.28.0-alpine AS runtime
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /workspace/frontend/dist /usr/share/nginx/html
EXPOSE 80
