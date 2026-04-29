import { createORPCClient } from '@orpc/client';
import type { JsonifiedClient } from '@orpc/openapi-client';
import { OpenAPILink } from '@orpc/openapi-client/fetch';
import { getRequestHeaders } from 'h3';

import { contract, type ContractRouterClient } from '@spacedb/contract';

const FORWARD = ['cookie', 'authorization'] as const;

export default defineNuxtPlugin(() => {
  const event = useRequestEvent();
  if (!event) throw new Error('SSR plugin invoked without request event');
  const { apiBase } = useRuntimeConfig();
  const inbound = getRequestHeaders(event);

  const link = new OpenAPILink(contract, {
    url: apiBase,
    headers: () => {
      const h: Record<string, string> = {};
      for (const k of FORWARD) {
        const v = inbound[k];
        if (v) h[k] = v;
      }
      return h;
    },
  });

  const client: JsonifiedClient<ContractRouterClient<typeof contract>> =
    createORPCClient(link);

  return { provide: { client } };
});
