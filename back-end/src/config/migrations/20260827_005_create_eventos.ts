import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('eventos', (table) => {
    table.increments('id').primary();
    table
      .integer('usuario_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table
      .integer('causa_id')
      .notNullable()
      .references('id')
      .inTable('causas')
      .onDelete('CASCADE');
    table.string('titulo', 120).notNullable();
    table.text('descricao');
    table.string('tipo', 20).notNullable().defaultTo('mutirao');
    table.specificType('geom', 'geometry(Point, 4326)');
    table.timestamp('data_inicio').notNullable();
    table.timestamp('data_fim');
    table.string('status', 20).notNullable().defaultTo('planejado');
    table.timestamp('criado_em').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('evento_problema', (table) => {
    table
      .integer('evento_id')
      .notNullable()
      .references('id')
      .inTable('eventos')
      .onDelete('CASCADE');
    table
      .integer('problema_id')
      .notNullable()
      .references('id')
      .inTable('problemas')
      .onDelete('CASCADE');
    table.boolean('resolveu').notNullable().defaultTo(false);
    table.primary(['evento_id', 'problema_id']);
  });

  await knex.schema.createTable('evento_participantes', (table) => {
    table
      .integer('evento_id')
      .notNullable()
      .references('id')
      .inTable('eventos')
      .onDelete('CASCADE');
    table
      .integer('usuario_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.timestamp('criado_em').defaultTo(knex.fn.now());
    table.primary(['evento_id', 'usuario_id']);
  });

  await knex.schema.raw(
    'CREATE INDEX idx_eventos_geom ON eventos USING GIST (geom)',
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('evento_participantes');
  await knex.schema.dropTableIfExists('evento_problema');
  await knex.schema.dropTableIfExists('eventos');
}
