import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { APP_INTERCEPTOR, REQUEST } from '@nestjs/core';
import { ORPCError, ORPCModule } from '@orpc/nest';
import { experimental_RethrowHandlerPlugin as RethrowHandlerPlugin } from '@orpc/server/plugins';
import type { Request } from 'express';
import { ClsService } from 'nestjs-cls';

import {
  ContextModule,
  type RequestContext,
} from './common/context/context.module';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';

declare module '@orpc/nest' {
  interface ORPCGlobalContext {
    request: Request;
    correlationId: string;
    requestId: string;
  }
}

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    ContextModule,
    ORPCModule.forRootAsync({
      inject: [REQUEST, ClsService],
      useFactory: (req: Request, cls: ClsService<RequestContext>) => ({
        context: {
          request: req,
          correlationId: cls.get('correlationId'),
          requestId: cls.get('requestId'),
        },
        plugins: [
          new RethrowHandlerPlugin({
            filter: (error) => !(error instanceof ORPCError),
          }),
        ],
      }),
    }),
    HealthModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },
  ],
})
export class AppModule {}
