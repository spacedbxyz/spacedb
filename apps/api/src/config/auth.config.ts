import { Expose, Transform } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

import { defineConfig } from './define-config';

class AuthConfig {
  @Expose({ name: 'API_AUTH_JWT_SECRET' })
  @IsString()
  @MinLength(32)
  jwtSecret!: string;

  @Expose({ name: 'API_AUTH_JWT_ACCESS_EXPIRY_SECONDS' })
  @IsInt()
  @Min(60)
  jwtAccessExpirySeconds: number = 900;

  @Expose({ name: 'API_AUTH_JWT_REFRESH_EXPIRY_SECONDS' })
  @IsInt()
  @Min(60)
  jwtRefreshExpirySeconds: number = 604800;

  @Expose({ name: 'API_AUTH_COOKIE_DOMAIN' })
  @IsOptional()
  @IsString()
  cookieDomain?: string;

  @Expose({ name: 'API_AUTH_COOKIE_SECURE' })
  @Transform(({ value }) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value.toLowerCase() === 'true';
    return true;
  })
  @IsBoolean()
  cookieSecure: boolean = true;

  @Expose({ name: 'API_AUTH_PASSWORD_MIN_LENGTH' })
  @IsInt()
  @Min(8)
  passwordMinLength: number = 8;
}

export default defineConfig('auth', AuthConfig);
