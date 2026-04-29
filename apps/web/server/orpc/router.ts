import { implement } from '@orpc/server';

import { contract } from '@spacedb/contract';

import type { UpstreamClient } from './upstream';

export type BffContext = {
  upstream: UpstreamClient;
};

const os = implement(contract).$context<BffContext>();

export const router = os.router({
  health: {
    ping: os.health.ping.handler(({ context }) => context.upstream.health.ping()),
    liveness: os.health.liveness.handler(({ context }) =>
      context.upstream.health.liveness(),
    ),
    readiness: os.health.readiness.handler(({ context }) =>
      context.upstream.health.readiness(),
    ),
    check: os.health.check.handler(({ context }) => context.upstream.health.check()),
  },
});

export type Router = typeof router;
