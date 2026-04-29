import { Expose } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

import { defineConfig } from './define-config';

class DatabaseConfig {
  @Expose({ name: 'API_DATABASE_HOST' })
  @IsString()
  @IsNotEmpty()
  host!: string;

  @Expose({ name: 'API_DATABASE_PORT' })
  @IsInt()
  @Min(0)
  @Max(65535)
  port!: number;

  @Expose({ name: 'API_DATABASE_USERNAME' })
  @IsString()
  @IsNotEmpty()
  username!: string;

  @Expose({ name: 'API_DATABASE_PASSWORD' })
  @IsString()
  @IsNotEmpty()
  password!: string;

  @Expose({ name: 'API_DATABASE_NAME' })
  @IsString()
  @IsNotEmpty()
  database!: string;
}

export default defineConfig('database', DatabaseConfig);
