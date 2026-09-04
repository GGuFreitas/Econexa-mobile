import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as carregarEnv } from 'dotenv';
import type { Knex } from 'knex';

const aqui = dirname(fileURLToPath(import.meta.url));
const raiz = resolve(aqui, '..', '..');

carregarEnv({ path: resolve(raiz, '.env') });

const connection = process.env.DATABASE_URL ?? '';

const base: Knex.Config = {
  client: 'pg',
  migrations: {
    directory: resolve(aqui, 'migrations'),
    extension: 'ts',
    loadExtensions: ['.ts', '.js'],
  },
};

const config: { development: Knex.Config; test: Knex.Config; production: Knex.Config } = {
  development: { ...base, connection },
  test: { ...base, connection: process.env.DATABASE_URL_TEST ?? connection },
  production: { ...base, connection },
};

export default config;
