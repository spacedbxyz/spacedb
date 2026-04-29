import { Expose, Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { defineConfig } from './define-config';

class SwaggerConfig {
  @Expose({ name: 'API_SWAGGER_ENABLED' })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true || value === '1')
  @IsBoolean()
  enabled = true;

  @Expose({ name: 'API_SWAGGER_PATH' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  path = 'docs';
}

export default defineConfig('swagger', SwaggerConfig);
