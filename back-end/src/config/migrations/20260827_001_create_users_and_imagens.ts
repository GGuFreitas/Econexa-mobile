import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('nome').notNullable();
    table.string('email').unique().notNullable();
    table.string('senha').notNullable();
    table.string('role').notNullable().defaultTo('citizen');
    table.integer('peso_voto').notNullable().defaultTo(1);
    table.timestamp('criado_em').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('imagens', (table) => {
    table.increments('id').primary();
    table.string('tipo_entidade').notNullable();
    table.integer('entidade_id').notNullable();
    table.string('url').notNullable();
    table.boolean('principal').notNullable().defaultTo(false);
    table.integer('ordem').notNullable().defaultTo(0);
    table.timestamp('criado_em').defaultTo(knex.fn.now());
    table.index(['tipo_entidade', 'entidade_id'], 'idx_imagens_entidade');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('imagens');
  await knex.schema.dropTableIfExists('users');
}
