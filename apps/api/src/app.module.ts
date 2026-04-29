import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { APP_INTERCEPTOR, REQUEST } from '@nestjs/core';
import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { TransactionalAdapterDrizzleOrm } from '@nestjs-cls/transactional-adapter-drizzle-orm';
import { ORPCError, ORPCModule } from '@orpc/nest';
import { experimental_RethrowHandlerPlugin as RethrowHandlerPlugin } from '@orpc/server/plugins';
import type { Request } from 'express';
import { ClsModule } from 'nestjs-cls';

import { AuthModule } from './auth/auth.module';
import type { Principal } from './auth/auth.types';
import { ConfigModule } from './config/config.module';
import {
  DatabaseModule,
  DRIZZLE,
  type Database,
} from './database/database.module';
import { HealthModule } from './health/health.module';
import { UsersModule } from './users/users.module';

declare module '@orpc/nest' {
  interface ORPCGlobalContext {
    request: Request;
    currentUser?: Principal;
  }
}

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    ClsModule.forRoot({
      plugins: [
        new ClsPluginTransactional({
          imports: [DatabaseModule],
          adapter: new TransactionalAdapterDrizzleOrm<Database>({
            drizzleInstanceToken: DRIZZLE,
            defaultTxOptions: { isolationLevel: 'read committed' },
          }),
        }),
      ],
    }),
    ORPCModule.forRootAsync({
      inject: [REQUEST],
      useFactory: (req: Request) => ({
        context: { request: req },
        plugins: [
          new RethrowHandlerPlugin({
            filter: (error) => !(error instanceof ORPCError),
          }),
        ],
      }),
    }),
    HealthModule,
    UsersModule,
    AuthModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },
  ],
})
export class AppModule {}
