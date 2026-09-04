import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(
    'CREATE INDEX IF NOT EXISTS idx_problemas_geom_geog ON problemas USING GIST ((geom::geography))',
  );
  await knex.raw(
    'CREATE INDEX IF NOT EXISTS idx_eventos_geom_geog ON eventos USING GIST ((geom::geography))',
  );

  await knex.raw('DROP INDEX IF EXISTS idx_problemas_geom');
  await knex.raw('DROP INDEX IF EXISTS idx_eventos_geom');
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(
    'CREATE INDEX IF NOT EXISTS idx_problemas_geom ON problemas USING GIST (geom)',
  );
  await knex.raw('CREATE INDEX IF NOT EXISTS idx_eventos_geom ON eventos USING GIST (geom)');

  await knex.raw('DROP INDEX IF EXISTS idx_problemas_geom_geog');
  await knex.raw('DROP INDEX IF EXISTS idx_eventos_geom_geog');
}
