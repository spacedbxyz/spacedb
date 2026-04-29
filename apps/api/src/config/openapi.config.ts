import { Expose, Transform, Type } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { defineConfig } from './define-config';

class OpenApiConfig {
  @Expose({ name: 'API_OPENAPI_ENABLED' })
  @Type(() => String)
  @Transform(({ value }) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value.toLowerCase() === 'true';
    return true;
  })
  @IsOptional()
  @IsBoolean()
  enabled: boolean = true;

  @Expose({ name: 'API_OPENAPI_PATH' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  path: string = 'docs';
}

export default defineConfig('openapi', OpenApiConfig);
