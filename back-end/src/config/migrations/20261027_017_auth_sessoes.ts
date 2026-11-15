import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE users
      ADD COLUMN sessao_versao integer NOT NULL DEFAULT 0,
      ADD COLUMN bloqueado_em timestamptz NULL,
      ADD COLUMN bloqueado_por integer NULL REFERENCES users (id) ON DELETE SET NULL,
      ADD COLUMN bloqueio_motivo text NULL
  `);

  await knex.raw(`
    CREATE TABLE refresh_tokens (
      id serial PRIMARY KEY,
      usuario_id integer NOT NULL REFERENCES users (id) ON DELETE CASCADE,
      token_hash text NOT NULL,
      expira_em timestamptz NOT NULL,
      revogado_em timestamptz NULL,
      substituido_por integer NULL REFERENCES refresh_tokens (id) ON DELETE SET NULL,
      criado_em timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT uq_refresh_tokens_token_hash UNIQUE (token_hash)
    )
  `);
  await knex.raw('CREATE INDEX idx_refresh_tokens_usuario ON refresh_tokens (usuario_id)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP TABLE IF EXISTS refresh_tokens');

  await knex.raw(`
    ALTER TABLE users
      DROP COLUMN IF EXISTS bloqueio_motivo,
      DROP COLUMN IF EXISTS bloqueado_por,
      DROP COLUMN IF EXISTS bloqueado_em,
      DROP COLUMN IF EXISTS sessao_versao
  `);
}
