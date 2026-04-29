# syntax=docker/dockerfile:1.7

FROM node:24-alpine AS base
RUN apk add --no-cache libc6-compat tini \
 && corepack enable \
 && corepack prepare pnpm@9.0.0 --activate
ENV PNPM_HOME=/pnpm CI=true
WORKDIR /app

FROM base AS pruner
COPY . .
RUN pnpm dlx turbo@^2.9.6 prune @spacedb/web --docker

FROM base AS installer
COPY --from=pruner /app/out/json/ ./
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts
COPY --from=pruner /app/out/full/ ./
RUN pnpm --filter @spacedb/web exec nuxt prepare \
 && pnpm turbo run build --filter=@spacedb/web

FROM base AS runner
ENV HOST=0.0.0.0 PORT=3000
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nuxt
WORKDIR /app
COPY --from=installer --chown=nuxt:nodejs /app/apps/web/.output ./.output
USER nuxt
EXPOSE 3000
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", ".output/server/index.mjs"]
