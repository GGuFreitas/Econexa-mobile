import 'dotenv/config';
import type { Knex } from 'knex';

const connection = process.env.DATABASE_URL ?? '';

const base: Knex.Config = {
  client: 'pg',
  migrations: {
    directory: './src/config/migrations',
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
