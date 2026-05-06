import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';

let started: StartedPostgreSqlContainer | undefined;

export async function startPostgres(): Promise<StartedPostgreSqlContainer> {
  if (started) return started;
  started = await new PostgreSqlContainer('postgres:17-alpine')
    .withDatabase('spacedb_test')
    .withUsername('spacedb_test')
    .withPassword('spacedb_test')
    .start();
  return started;
}

export async function stopPostgres(): Promise<void> {
  if (started) {
    await started.stop({ remove: true, removeVolumes: true });
    started = undefined;
  }
}
