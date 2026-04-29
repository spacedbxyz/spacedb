import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/database/schema/index.ts',
  out: './src/database/migrations',
  casing: 'snake_case',
  dbCredentials: {
    host: process.env.API_DATABASE_HOST!,
    port: Number(process.env.API_DATABASE_PORT),
    user: process.env.API_DATABASE_USERNAME!,
    password: process.env.API_DATABASE_PASSWORD!,
    database: process.env.API_DATABASE_NAME!,
    ssl: false,
  },
  verbose: true,
  strict: true,
});
