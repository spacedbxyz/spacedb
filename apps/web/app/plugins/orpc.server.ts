import { createORPCClient } from '@orpc/client';
import type { JsonifiedClient } from '@orpc/openapi-client';
import { OpenAPILink } from '@orpc/openapi-client/fetch';

import { contract, type ContractRouterClient } from '@spacedb/contract';

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();
  const event = useRequestEvent();

  const link = new OpenAPILink(contract, {
    url: config.apiBase,
    headers: () => {
      const correlationId = event?.headers.get('x-correlation-id');
      return correlationId ? { 'x-correlation-id': correlationId } : {};
    },
  });

  const client: JsonifiedClient<ContractRouterClient<typeof contract>> =
    createORPCClient(link);

  return {
    provide: { client },
  };
});
