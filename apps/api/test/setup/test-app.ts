import type { Server } from 'node:http';
import { ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { useContainer } from 'class-validator';
import cookieParser from 'cookie-parser';
import { sql } from 'drizzle-orm';

import { AppModule } from '../../src/app.module';
import { GlobalExceptionFilter } from '../../src/common/filters/global-exception.filter';
import { DRIZZLE, type Database } from '../../src/database/database.module';

export interface TestApp {
  http: Server;
  db: Database;
  resetDb: () => Promise<void>;
  close: () => Promise<void>;
}

export async function createTestApp(): Promise<TestApp> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication<NestExpressApplication>({
    bodyParser: false,
    logger: false,
  });

  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidUnknownValues: true,
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter(app.get(HttpAdapterHost)));

  await app.init();

  const db = app.get<Database>(DRIZZLE);

  return {
    http: app.getHttpServer(),
    db,
    resetDb: () =>
      db
        .execute(
          sql`TRUNCATE TABLE refresh_tokens, users RESTART IDENTITY CASCADE`,
        )
        .then(() => undefined),
    close: () => app.close(),
  };
}
