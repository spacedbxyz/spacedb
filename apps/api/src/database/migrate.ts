import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

async function main(): Promise<void> {
  const client = postgres({
    host: process.env.API_DATABASE_HOST!,
    port: Number(process.env.API_DATABASE_PORT),
    user: process.env.API_DATABASE_USERNAME!,
    password: process.env.API_DATABASE_PASSWORD!,
    database: process.env.API_DATABASE_NAME!,
    max: 1,
  });
  await migrate(drizzle(client), {
    migrationsFolder: './src/database/migrations',
  });
  await client.end();
}

void main();
