import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { conexaoDeMigracao, nomeDoBancoPadrao, recriarBanco } from './banco.js';

const IMAGEM_POSTGIS = 'postgis/postgis:15-3.4';

let container: StartedPostgreSqlContainer | undefined;

async function urlDoPostgres(): Promise<string> {
  const externo = process.env.DATABASE_URL_ITEST;
  if (externo) return externo;

  container = await new PostgreSqlContainer(IMAGEM_POSTGIS)
    .withDatabase('econexa_itest')
    .start();

  return container.getConnectionUri();
}

export async function setup(): Promise<void> {
  process.env.DATABASE_URL = await urlDoPostgres();

  const connection = await recriarBanco(nomeDoBancoPadrao());
  const knex = conexaoDeMigracao(connection);
  try {
    await knex.migrate.latest();
  } finally {
    await knex.destroy();
  }
}

export async function teardown(): Promise<void> {
  await container?.stop();
  container = undefined;
}
