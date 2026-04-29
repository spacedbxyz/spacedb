import { OpenAPIHandler } from '@orpc/openapi/fetch';
import { onError } from '@orpc/server';

import { router } from '../orpc/router';
import { createUpstreamClient } from '../orpc/upstream';

const handler = new OpenAPIHandler(router, {
  interceptors: [onError((error) => console.error(error))],
});

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const correlationId = getRequestHeader(event, 'x-correlation-id');

  const upstream = createUpstreamClient(
    config.apiBase,
    correlationId ? { 'x-correlation-id': correlationId } : {},
  );

  const { matched, response } = await handler.handle(toWebRequest(event), {
    prefix: '/api',
    context: { upstream },
  });

  if (matched) return response;

  setResponseStatus(event, 404, 'Not Found');
  return 'Not Found';
});
