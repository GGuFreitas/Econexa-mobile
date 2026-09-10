import { conexaoDeMigracao, nomeDoBancoPadrao, recriarBanco } from './banco.js';

export async function setup(): Promise<void> {
  const connection = await recriarBanco(nomeDoBancoPadrao());
  const knex = conexaoDeMigracao(connection);
  try {
    await knex.migrate.latest();
  } finally {
    await knex.destroy();
  }
}
