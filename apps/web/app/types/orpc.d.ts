import type { JsonifiedClient } from '@orpc/openapi-client';

import type { contract, ContractRouterClient } from '@spacedb/contract';

declare module '#app' {
  interface NuxtApp {
    $client: JsonifiedClient<ContractRouterClient<typeof contract>>;
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $client: JsonifiedClient<ContractRouterClient<typeof contract>>;
  }
}

export {};
