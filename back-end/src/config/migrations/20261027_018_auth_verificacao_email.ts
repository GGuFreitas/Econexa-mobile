import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE users
      ADD COLUMN email_verificado boolean NOT NULL DEFAULT false,
      ADD COLUMN email_verificado_em timestamptz NULL
  `);

  await knex.raw(`
    CREATE TABLE email_verification_tokens (
      id serial PRIMARY KEY,
      usuario_id integer NOT NULL REFERENCES users (id) ON DELETE CASCADE,
      token_hash text NOT NULL,
      expira_em timestamptz NOT NULL,
      usado_em timestamptz NULL,
      criado_em timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT uq_email_verification_tokens_token_hash UNIQUE (token_hash)
    )
  `);
  await knex.raw(
    'CREATE INDEX idx_email_verification_tokens_usuario ON email_verification_tokens (usuario_id)',
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP TABLE IF EXISTS email_verification_tokens');

  await knex.raw(`
    ALTER TABLE users
      DROP COLUMN IF EXISTS email_verificado_em,
      DROP COLUMN IF EXISTS email_verificado
  `);
}
