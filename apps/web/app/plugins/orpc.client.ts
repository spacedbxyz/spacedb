import { createORPCClient } from '@orpc/client';
import type { JsonifiedClient } from '@orpc/openapi-client';
import { OpenAPILink } from '@orpc/openapi-client/fetch';

import { contract, type ContractRouterClient } from '@spacedb/contract';

const REFRESH_PATH = '/auth/refresh';

export default defineNuxtPlugin({
  name: 'orpc.client',
  setup() {
    const baseUrl = `${window.location.origin}/api`;

    const link = new OpenAPILink(contract, {
      url: baseUrl,
      headers: () => {
        const token = useAuth().accessToken.value;
        return token ? { authorization: `Bearer ${token}` } : {};
      },
      fetch: async (request, init) => {
        const auth = useAuth();
        const isRefresh = new URL(request.url).pathname.endsWith(REFRESH_PATH);

        if (
          !isRefresh &&
          auth.accessToken.value !== null &&
          !auth.isAccessTokenFresh()
        ) {
          await auth.refresh();
        }

        const buildRequest = (): Request => {
          const token = auth.accessToken.value;
          if (!token) return request;
          const headers = new Headers(request.headers);
          headers.set('authorization', `Bearer ${token}`);
          return new Request(request, { headers });
        };

        const baseInit: RequestInit = { ...init, credentials: 'include' };
        const response = await globalThis.fetch(buildRequest(), baseInit);
        if (response.status !== 401 || isRefresh) return response;

        const refreshed = await auth.refresh();
        if (!refreshed) return response;
        return globalThis.fetch(buildRequest(), baseInit);
      },
    });

    const client: JsonifiedClient<ContractRouterClient<typeof contract>> =
      createORPCClient(link);

    return { provide: { client } };
  },
});
