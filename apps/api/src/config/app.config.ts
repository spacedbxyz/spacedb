import { Expose } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

import { defineConfig } from './define-config';

export enum LogLevel {
  Fatal = 'fatal',
  Error = 'error',
  Warn = 'warn',
  Log = 'log',
  Debug = 'debug',
  Verbose = 'verbose',
}

class AppConfig {
  @Expose({ name: 'API_HOST' })
  @IsString()
  @IsNotEmpty()
  host!: string;

  @Expose({ name: 'API_PORT' })
  @IsInt()
  @Min(0)
  @Max(65535)
  port!: number;

  @Expose({ name: 'API_LOG_LEVEL' })
  @IsOptional()
  @IsEnum(LogLevel)
  logLevel: LogLevel = LogLevel.Log;
}

export default defineConfig('app', AppConfig);
