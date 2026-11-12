import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE password_reset_tokens (
      id serial PRIMARY KEY,
      usuario_id integer NOT NULL REFERENCES users (id) ON DELETE CASCADE,
      codigo_hash text NOT NULL,
      expira_em timestamptz NOT NULL,
      usado_em timestamptz NULL,
      tentativas integer NOT NULL DEFAULT 0,
      criado_em timestamptz NOT NULL DEFAULT now()
    )
  `);
  await knex.raw(
    'CREATE INDEX idx_password_reset_tokens_usuario ON password_reset_tokens (usuario_id, criado_em DESC)',
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP TABLE IF EXISTS password_reset_tokens');
}
