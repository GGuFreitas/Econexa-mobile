import type { Knex } from 'knex';

const MARCADOR_SEM_SENHA = '!sem-senha';

export async function up(knex: Knex): Promise<void> {
  await knex.raw('ALTER TABLE users ALTER COLUMN senha DROP NOT NULL');
  await knex.raw('UPDATE users SET senha = NULL WHERE senha = ?', [MARCADOR_SEM_SENHA]);

  await knex.raw(`
    CREATE TABLE usuario_oauth_contas (
      id serial PRIMARY KEY,
      usuario_id integer NOT NULL REFERENCES users (id) ON DELETE CASCADE,
      provider varchar(20) NOT NULL,
      provider_user_id varchar(255) NOT NULL,
      criado_em timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT uq_usuario_oauth_contas_provider UNIQUE (provider, provider_user_id)
    )
  `);
  await knex.raw('CREATE INDEX idx_usuario_oauth_contas_usuario ON usuario_oauth_contas (usuario_id)');
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP TABLE IF EXISTS usuario_oauth_contas');

  await knex.raw('UPDATE users SET senha = ? WHERE senha IS NULL', [MARCADOR_SEM_SENHA]);
  await knex.raw('ALTER TABLE users ALTER COLUMN senha SET NOT NULL');
}
