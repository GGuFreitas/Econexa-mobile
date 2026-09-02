import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('mobilizacoes', (table) => {
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
    table.string('titulo', 120).notNullable();
    table.text('descricao');
    table.timestamp('data_inicio').notNullable();
    table.timestamp('data_fim');
    table.string('local_nome', 160);
    table.specificType('geom', 'geometry(Point, 4326)');
    table.string('status', 20).notNullable().defaultTo('agendada');
    table.text('resultado_descricao');
    table.jsonb('resultado_metricas');
    table.timestamp('criado_em').defaultTo(knex.fn.now());
    table.timestamp('atualizado_em').defaultTo(knex.fn.now());
    table.index('problema_id', 'idx_mobilizacoes_problema');
  });

  await knex.schema.createTable('mobilizacao_participantes', (table) => {
    table
      .integer('mobilizacao_id')
      .notNullable()
      .references('id')
      .inTable('mobilizacoes')
      .onDelete('CASCADE');
    table
      .integer('usuario_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE');
    table.timestamp('criado_em').defaultTo(knex.fn.now());
    table.primary(['mobilizacao_id', 'usuario_id']);
  });

  await knex.schema.raw(
    'CREATE INDEX idx_mobilizacoes_geom ON mobilizacoes USING GIST (geom)',
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('mobilizacao_participantes');
  await knex.schema.dropTableIfExists('mobilizacoes');
}
