import { join } from 'node:path';

import {
  Global,
  Inject,
  Logger,
  Module,
  type OnApplicationBootstrap,
  type OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService, type ConfigType } from '@nestjs/config';
import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres, { type Sql } from 'postgres';

import type databaseConfig from '../config/database.config';

import * as schema from './schema';

export const DRIZZLE = Symbol('DRIZZLE');
export const PG_CLIENT = Symbol('PG_CLIENT');

export type Database = PostgresJsDatabase<typeof schema>;

type Env = { database: ConfigType<typeof databaseConfig> };

const MIGRATIONS_FOLDER = join(__dirname, 'migrations');

@Global()
@Module({
  providers: [
    {
      provide: PG_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>): Sql => {
        const cfg = config.get('database', { infer: true });
        return postgres({
          host: cfg.host,
          port: cfg.port,
          user: cfg.username,
          password: cfg.password,
          database: cfg.database,
          max: 10,
          idle_timeout: 20,
          connect_timeout: 10,
        });
      },
    },
    {
      provide: DRIZZLE,
      inject: [PG_CLIENT],
      useFactory: (client: Sql): Database =>
        drizzle(client, { schema, casing: 'snake_case' }),
    },
  ],
  exports: [DRIZZLE],
})
export class DatabaseModule implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseModule.name);

  constructor(
    @Inject(PG_CLIENT) private readonly client: Sql,
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly config: ConfigService<Env, true>,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    const cfg = this.config.get('database', { infer: true });
    if (!cfg.autoMigrate) {
      this.logger.log('Auto-migrate disabled, skipping migrations');
      return;
    }
    this.logger.log(`Running migrations from ${MIGRATIONS_FOLDER}`);
    await migrate(this.db, { migrationsFolder: MIGRATIONS_FOLDER });
    this.logger.log('Migrations applied');
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.end({ timeout: 5 });
  }
}
