import { startPostgres, stopPostgres } from './postgres-container';

export default async function globalSetup(): Promise<() => Promise<void>> {
  const pg = await startPostgres();
  process.env.API_DATABASE_HOST = pg.getHost();
  process.env.API_DATABASE_PORT = String(pg.getMappedPort(5432));
  process.env.API_DATABASE_USERNAME = pg.getUsername();
  process.env.API_DATABASE_PASSWORD = pg.getPassword();
  process.env.API_DATABASE_NAME = pg.getDatabase();
  process.env.API_DATABASE_AUTO_MIGRATE = 'true';

  process.env.API_HOST = '127.0.0.1';
  process.env.API_PORT = '0';
  process.env.API_LOG_LEVEL = 'warn';

  process.env.API_AUTH_JWT_SECRET ??=
    'e2e-test-secret-with-min-32-characters!!';
  process.env.API_AUTH_JWT_ACCESS_EXPIRY_SECONDS ??= '900';
  process.env.API_AUTH_JWT_REFRESH_EXPIRY_SECONDS ??= '604800';
  process.env.API_AUTH_COOKIE_SECURE ??= 'false';
  process.env.API_AUTH_PASSWORD_MIN_LENGTH ??= '8';

  process.env.API_OPENAPI_ENABLED ??= 'false';

  process.env.API_MINIO_ENDPOINT ??= '127.0.0.1';
  process.env.API_MINIO_PORT ??= '9000';
  process.env.API_MINIO_USE_SSL ??= 'false';
  process.env.API_MINIO_ACCESS_KEY ??= 'test';
  process.env.API_MINIO_SECRET_KEY ??= 'test12345';
  process.env.API_MINIO_BUCKET ??= 'test';

  return async () => {
    await stopPostgres();
  };
}
