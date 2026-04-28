# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat tini \
 && corepack enable \
 && corepack prepare pnpm@9.0.0 --activate
ENV PNPM_HOME=/pnpm CI=true
WORKDIR /app

FROM base AS pruner
COPY . .
RUN pnpm dlx turbo@^2.9.6 prune @spacedb/api --docker

FROM base AS installer
COPY --from=pruner /app/out/json/ ./
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ ./
RUN pnpm turbo run build --filter=@spacedb/api

FROM base AS proddeps
COPY --from=pruner /app/out/json/ ./
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --prod --frozen-lockfile --ignore-scripts

FROM base AS runner
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nestjs
WORKDIR /app
COPY --from=proddeps  --chown=nestjs:nodejs /app/node_modules            ./node_modules
COPY --from=proddeps  --chown=nestjs:nodejs /app/apps/api/node_modules   ./apps/api/node_modules
COPY --from=installer --chown=nestjs:nodejs /app/apps/api/dist           ./apps/api/dist
COPY --from=installer --chown=nestjs:nodejs /app/apps/api/package.json   ./apps/api/package.json
USER nestjs
WORKDIR /app/apps/api
EXPOSE 3000
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main.js"]
