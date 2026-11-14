import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw('ALTER TABLE users ADD COLUMN excluido_em timestamptz NULL');
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('ALTER TABLE users DROP COLUMN IF EXISTS excluido_em');
}
