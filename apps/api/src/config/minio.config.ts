import { Expose } from 'class-transformer';
import {
  IsBooleanString,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
} from 'class-validator';

import { defineConfig } from './define-config';

class MinioConfig {
  @Expose({ name: 'API_MINIO_ENDPOINT' })
  @IsString()
  @IsNotEmpty()
  endpoint!: string;

  @Expose({ name: 'API_MINIO_PORT' })
  @IsInt()
  @Min(0)
  @Max(65535)
  port!: number;

  @Expose({ name: 'API_MINIO_USE_SSL' })
  @IsBooleanString()
  useSSL!: string;

  @Expose({ name: 'API_MINIO_ACCESS_KEY' })
  @IsString()
  @IsNotEmpty()
  accessKey!: string;

  @Expose({ name: 'API_MINIO_SECRET_KEY' })
  @IsString()
  @IsNotEmpty()
  secretKey!: string;

  @Expose({ name: 'API_MINIO_BUCKET' })
  @IsString()
  @IsNotEmpty()
  bucket!: string;
}

export default defineConfig('minio', MinioConfig);
