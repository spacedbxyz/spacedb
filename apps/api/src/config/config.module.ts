import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';

import appConfig from './app.config';
import authConfig from './auth.config';
import databaseConfig from './database.config';
import { validateAllConfigs } from './define-config';
import minioConfig from './minio.config';
import openapiConfig from './openapi.config';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: true,
      load: [appConfig, authConfig, databaseConfig, minioConfig, openapiConfig],
      validate: validateAllConfigs,
      cache: true,
      expandVariables: false,
    }),
  ],
})
export class ConfigModule {}
