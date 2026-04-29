import { createORPCClient } from '@orpc/client';
import type { JsonifiedClient } from '@orpc/openapi-client';
import { OpenAPILink } from '@orpc/openapi-client/fetch';

import { contract, type ContractRouterClient } from '@spacedb/contract';

export type UpstreamClient = JsonifiedClient<ContractRouterClient<typeof contract>>;

export function createUpstreamClient(
  baseUrl: string,
  forwardHeaders: Record<string, string>,
): UpstreamClient {
  const link = new OpenAPILink(contract, {
    url: baseUrl,
    headers: () => forwardHeaders,
  });
  return createORPCClient(link);
}
