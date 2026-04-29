import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';

import appConfig from './app.config';
import databaseConfig from './database.config';
import { validateAllConfigs } from './define-config';
import minioConfig from './minio.config';
import swaggerConfig from './swagger.config';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: true,
      load: [appConfig, databaseConfig, minioConfig, swaggerConfig],
      validate: validateAllConfigs,
      cache: true,
      expandVariables: false,
    }),
  ],
})
export class ConfigModule {}
