import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw('DROP INDEX IF EXISTS idx_denuncias_problema');
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(
    'CREATE INDEX IF NOT EXISTS idx_denuncias_problema ON problema_denuncias (problema_id)',
  );
}
