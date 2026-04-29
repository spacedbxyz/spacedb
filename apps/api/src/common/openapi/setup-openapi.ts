import type { INestApplication } from '@nestjs/common';
import { OpenAPIGenerator } from '@orpc/openapi';
import { ZodToJsonSchemaConverter } from '@orpc/zod/zod4';
import { apiReference } from '@scalar/nestjs-api-reference';
import type { Request, Response } from 'express';
import { dump as yamlDump } from 'js-yaml';

import { contract } from '@spacedb/contract';

export interface OpenApiOptions {
  enabled?: boolean;
  path?: string;
  title?: string;
  version?: string;
  description?: string;
}

export async function setupOpenApi(
  app: INestApplication,
  options: OpenApiOptions = {},
): Promise<string | null> {
  if (options.enabled === false) return null;

  const path = options.path ?? 'docs';
  const generator = new OpenAPIGenerator({
    schemaConverters: [new ZodToJsonSchemaConverter()],
  });

  const document = await generator.generate(contract, {
    info: {
      title: options.title ?? 'spacedb API',
      version: options.version ?? '0.0.0',
      description: options.description ?? 'spacedb API Documentation',
    },
    servers: [{ url: '/' }],
  });

  const httpAdapter = app.getHttpAdapter();

  httpAdapter.get(`/${path}/json`, (_req: Request, res: Response) => {
    res.json(document);
  });

  httpAdapter.get(`/${path}/yaml`, (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/yaml');
    res.send(yamlDump(document));
  });

  const reference = apiReference({
    url: `/${path}/json`,
    theme: 'purple',
    layout: 'modern',
    metaData: {
      title: options.title ?? 'spacedb API',
      description: options.description ?? 'spacedb API Documentation',
    },
    hideClientButton: true,
    showSidebar: true,
    persistAuth: true,
    showDeveloperTools: 'never',
    agent: { disabled: true },
    mcp: { disabled: true },
    telemetry: false,
  });

  httpAdapter.get(
    `/${path}`,
    reference as Parameters<typeof httpAdapter.get>[1],
  );

  return path;
}
