import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('problemas', (table) => {
    table.dropColumn('cont_visualizacoes');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('problemas', (table) => {
    table.integer('cont_visualizacoes').notNullable().defaultTo(0);
  });
}
