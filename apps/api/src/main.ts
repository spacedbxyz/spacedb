import {
  type LogLevel as NestLogLevel,
  Logger,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService, type ConfigType } from '@nestjs/config';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { useContainer } from 'class-validator';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { setupOpenApi } from './common/openapi/setup-openapi';
import type appConfig from './config/app.config';
import { LogLevel } from './config/app.config';
import type openapiConfig from './config/openapi.config';

type AppEnv = {
  app: ConfigType<typeof appConfig>;
  openapi: ConfigType<typeof openapiConfig>;
};

const LOG_LEVEL_ORDER: NestLogLevel[] = [
  'fatal',
  'error',
  'warn',
  'log',
  'debug',
  'verbose',
];

function getEnabledLogLevels(level: LogLevel): NestLogLevel[] {
  return LOG_LEVEL_ORDER.slice(0, LOG_LEVEL_ORDER.indexOf(level) + 1);
}

async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');
  const initialLevel = (process.env.API_LOG_LEVEL as LogLevel) || LogLevel.Log;

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: getEnabledLogLevels(initialLevel),
    bodyParser: false,
  });

  useContainer(app.select(AppModule), { fallbackOnErrors: true });

  app.use(cookieParser());

  const config = app.get<ConfigService<AppEnv, true>>(ConfigService);
  app.useLogger(
    getEnabledLogLevels(config.get('app.logLevel', { infer: true })),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidUnknownValues: true,
    }),
  );

  app.enableCors({
    origin: true,
    credentials: true,
    exposedHeaders: ['Content-Disposition'],
  });

  app.useGlobalFilters(new GlobalExceptionFilter(app.get(HttpAdapterHost)));

  const openapi = config.get('openapi', { infer: true });
  const docsPath = await setupOpenApi(app, {
    enabled: openapi.enabled,
    path: openapi.path,
  });

  app.enableShutdownHooks();

  const port = config.get('app.port', { infer: true });
  const host = config.get('app.host', { infer: true });
  await app.listen(port, host);

  const url = await app.getUrl();
  if (docsPath) {
    logger.log(`API documentation available at: ${url}/${docsPath}`);
  }
  logger.log(`Application is running on: ${url}`);
}
void bootstrap();
