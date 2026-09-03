import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('problema_comentarios', (table) => {
    table.increments('id').primary();
    table
      .integer('problema_id')
      .notNullable()
      .references('id')
      .inTable('problemas')
      .onDelete('CASCADE');
    table
      .integer('usuario_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.text('conteudo').notNullable();
    table.timestamp('criado_em').defaultTo(knex.fn.now());
  });

  await knex.schema.raw(
    'CREATE INDEX idx_comentarios_problema ON problema_comentarios (problema_id, criado_em DESC)',
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('problema_comentarios');
}
