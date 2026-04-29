import { createORPCClient } from '@orpc/client';
import type { JsonifiedClient } from '@orpc/openapi-client';
import { OpenAPILink } from '@orpc/openapi-client/fetch';

import { contract, type ContractRouterClient } from '@spacedb/contract';

export default defineNuxtPlugin(() => {
  const link = new OpenAPILink(contract, {
    url: `${window.location.origin}/api`,
    headers: () => {
      const accessToken = useState<string | null>('auth.accessToken').value;
      return accessToken ? { authorization: `Bearer ${accessToken}` } : {};
    },
    fetch: (req, init) =>
      globalThis.fetch(req, { ...init, credentials: 'include' }),
  });

  const client: JsonifiedClient<ContractRouterClient<typeof contract>> =
    createORPCClient(link);

  return { provide: { client } };
});
