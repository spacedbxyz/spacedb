import type { INestApplication } from '@nestjs/common';
import type { ConfigService, ConfigType } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import type { Request, Response } from 'express';
import { dump as yamlDump } from 'js-yaml';

import type appConfig from '../../config/app.config';
import type swaggerConfig from '../../config/swagger.config';

type Env = {
  app: ConfigType<typeof appConfig>;
  swagger: ConfigType<typeof swaggerConfig>;
};

export function setupSwagger(
  app: INestApplication,
  config: ConfigService<Env, true>,
): string | null {
  const swagger = config.get('swagger', { infer: true });
  if (!swagger.enabled) return null;

  const builder = new DocumentBuilder()
    .setTitle('spacedb API')
    .build();

  const document = SwaggerModule.createDocument(app, builder);
  const path = swagger.path;

  const httpAdapter = app.getHttpAdapter();
  httpAdapter.use(`/${path}.json`, (_req: Request, res: Response) => {
    res.json(document);
  });
  httpAdapter.use(`/${path}.yaml`, (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/yaml');
    res.send(yamlDump(document));
  });
  httpAdapter.use(
    `/${path}`,
    apiReference({
      theme: 'purple',
      layout: 'modern',
      metaData: {
        title: 'spacedb API',
        description: 'spacedb API Documentation',
      },
      hideClientButton: true,
      showSidebar: true,
      persistAuth: true,
      showDeveloperTools: 'never',
      agent: { disabled: true },
      mcp: { disabled: true },
      telemetry: false,
      content: document,
    }),
  );

  return path;
}
