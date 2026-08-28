import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('problema_denuncias', (table) => {
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
    table.string('motivo', 40).notNullable();
    table.timestamp('criado_em').defaultTo(knex.fn.now());
  });

  await knex.schema.raw(
    'CREATE INDEX idx_denuncias_problema ON problema_denuncias (problema_id)',
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('problema_denuncias');
}
