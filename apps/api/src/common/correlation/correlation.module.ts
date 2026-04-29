import { Global, Module } from '@nestjs/common';
import type { Request } from 'express';
import { ClsModule, type ClsService, type ClsStore } from 'nestjs-cls';

export interface RequestContext extends ClsStore {
  correlationId: string;
  requestId: string;
  ipAddress?: string;
  userAgent?: string;
}

@Global()
@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        generateId: true,
        idGenerator: (req: Request) =>
          (req.headers['x-correlation-id'] as string | undefined) ??
          crypto.randomUUID(),
        setup: (cls, req: Request) => {
          const ctx = cls as unknown as ClsService<RequestContext>;
          ctx.set('correlationId', cls.getId());
          ctx.set('requestId', crypto.randomUUID());
          ctx.set('ipAddress', req.ip);
          ctx.set('userAgent', req.headers['user-agent']);
        },
      },
    }),
  ],
  exports: [ClsModule],
})
export class CorrelationModule {}
