import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw('CREATE EXTENSION IF NOT EXISTS postgis');
  await knex.raw('CREATE EXTENSION IF NOT EXISTS pgcrypto');

  await knex.schema.createTable('causas', (table) => {
    table.increments('id').primary();
    table.string('nome').notNullable();
    table.string('cor').notNullable().defaultTo('#22c55e');
    table.string('icone').notNullable().defaultTo('map-pin');
    table.boolean('ativo').notNullable().defaultTo(true);
  });

  await knex.raw(`
    INSERT INTO causas (nome, cor, icone) VALUES
    ('Mobilidade', '#3b82f6', 'bus'),
    ('Infraestrutura', '#f59e0b', 'construction'),
    ('Poluição', '#10b981', 'wind'),
    ('Desmatamento', '#16a34a', 'tree'),
    ('Cultura', '#a855f7', 'palette'),
    ('Segurança', '#ef4444', 'shield'),
    ('Saúde', '#ec4899', 'heart'),
    ('Educação', '#6366f1', 'book')
  `);

  await knex.schema.createTable('problemas', (table) => {
    table.increments('id').primary();
    table.integer('usuario_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('titulo').notNullable();
    table.text('descricao');
    table.integer('causa_id').notNullable().references('id').inTable('causas');
    table.specificType('tags', 'text[]').notNullable().defaultTo('{}');
    table.string('tipo').notNullable().defaultTo('problema');
    table.string('status').notNullable().defaultTo('ativo');
    table.specificType('geom', 'geometry(Point, 4326)').notNullable();
    table.string('local_nome');
    table.string('escopo').notNullable().defaultTo('local');
    table.integer('cont_apoios').notNullable().defaultTo(0);
    table.specificType('cont_apoios_ponderados', 'numeric').notNullable().defaultTo(0);
    table.integer('cont_visualizacoes').notNullable().defaultTo(0);
    table.timestamp('criado_em').defaultTo(knex.fn.now());
    table.timestamp('atualizado_em').defaultTo(knex.fn.now());
    table.index(['causa_id', 'status'], 'idx_problemas_causa_status');
  });

  await knex.raw('CREATE INDEX idx_problemas_geom ON problemas USING GIST (geom)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP INDEX IF EXISTS idx_problemas_geom');
  await knex.schema.dropTableIfExists('problemas');
  await knex.schema.dropTableIfExists('causas');
  await knex.raw('DROP EXTENSION IF EXISTS postgis CASCADE');
  await knex.raw('DROP EXTENSION IF EXISTS pgcrypto CASCADE');
}
