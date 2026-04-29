import { ClassSerializerInterceptor, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';

import { CorrelationModule } from './common/correlation/correlation.module';
import { ConfigModule } from './config/config.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [ConfigModule, CorrelationModule, HealthModule],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },
  ],
})
export class AppModule {}
