import { Logger } from '@nestjs/common';
import { registerAs } from '@nestjs/config';
import { type ClassConstructor, plainToInstance } from 'class-transformer';
import { defaultMetadataStorage as untypedStorage } from 'class-transformer/cjs/storage.js';
import type { MetadataStorage } from 'class-transformer/types/MetadataStorage.js';
import { type ValidationError, validateSync } from 'class-validator';

const defaultMetadataStorage = untypedStorage as MetadataStorage;

export function defineConfig<T extends object>(
  namespace: string,
  Schema: ClassConstructor<T>,
) {
  schemas.set(namespace, Schema);
  return registerAs(namespace, () => buildConfig(Schema));
}

const schemas = new Map<string, ClassConstructor<object>>();

function getEnvKey(Schema: ClassConstructor<object>, property: string): string {
  const meta = defaultMetadataStorage.findExposeMetadata(Schema, property);
  return meta?.options.name ?? property;
}

function buildConfig<T extends object>(Schema: ClassConstructor<T>): T {
  return plainToInstance(Schema, process.env, {
    excludeExtraneousValues: true,
    exposeDefaultValues: true,
    enableImplicitConversion: true,
  });
}

export function validateAllConfigs(env: Record<string, unknown>): typeof env {
  const logger = new Logger('ConfigModule');
  const failures: { namespace: string; errors: ValidationError[] }[] = [];

  for (const [namespace, Schema] of schemas) {
    const instance = plainToInstance(Schema, env, {
      excludeExtraneousValues: true,
      exposeDefaultValues: true,
      enableImplicitConversion: true,
    });
    const errors = validateSync(instance, {
      skipMissingProperties: false,
      forbidUnknownValues: false,
      whitelist: false,
    });
    if (errors.length > 0) failures.push({ namespace, errors });
  }
  if (failures.length === 0) return env;

  for (const { namespace, errors } of failures) {
    const Schema = schemas.get(namespace)!;
    for (const error of errors) {
      const envKey = getEnvKey(Schema, error.property);
      for (const msg of Object.values(error.constraints ?? {})) {
        logger.error(`[${namespace}] ${envKey}: ${msg}`);
      }
    }
  }
  logger.fatal(
    `Configuration validation failed for ${failures.length} namespace(s): ${failures.map((f) => `"${f.namespace}"`).join(', ')}`,
  );
  process.exit(1);
}
