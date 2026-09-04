import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    DELETE FROM problema_denuncias
    WHERE id IN (
      SELECT id FROM (
        SELECT id,
               row_number() OVER (
                 PARTITION BY problema_id, usuario_id
                 ORDER BY criado_em ASC NULLS LAST, id ASC
               ) AS posicao
        FROM problema_denuncias
      ) ordenadas
      WHERE ordenadas.posicao > 1
    )
  `);

  await knex.raw(`
    ALTER TABLE problema_denuncias
    ADD CONSTRAINT uq_denuncias_problema_usuario UNIQUE (problema_id, usuario_id)
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(
    'ALTER TABLE problema_denuncias DROP CONSTRAINT IF EXISTS uq_denuncias_problema_usuario',
  );
}
