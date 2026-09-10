import { fileURLToPath, URL } from 'node:url';
import { dirname, resolve } from 'node:path';
import pg from 'pg';
import knexFactory, { type Knex } from 'knex';

const { Client } = pg;

const AQUI = dirname(fileURLToPath(import.meta.url));
const DIRETORIO_DE_MIGRACOES = resolve(AQUI, '..', '..', 'config', 'migrations');

export const METROS_POR_GRAU_LATITUDE = 110574;

export function urlDoBanco(nome: string): string {
  const url = new URL(process.env.DATABASE_URL as string);
  url.pathname = `/${nome}`;
  return url.toString();
}

export function nomeDoBancoPadrao(): string {
  return new URL(process.env.DATABASE_URL as string).pathname.slice(1);
}

export async function recriarBanco(nome: string): Promise<string> {
  const admin = new Client({ connectionString: urlDoBanco('postgres') });
  await admin.connect();
  try {
    await admin.query(`DROP DATABASE IF EXISTS ${nome} WITH (FORCE)`);
    await admin.query(`CREATE DATABASE ${nome}`);
  } finally {
    await admin.end();
  }
  return urlDoBanco(nome);
}

export async function removerBanco(nome: string): Promise<void> {
  const admin = new Client({ connectionString: urlDoBanco('postgres') });
  await admin.connect();
  try {
    await admin.query(`DROP DATABASE IF EXISTS ${nome} WITH (FORCE)`);
  } finally {
    await admin.end();
  }
}

export function conexaoDeMigracao(connection: string): Knex {
  return knexFactory({
    client: 'pg',
    connection,
    migrations: {
      directory: DIRETORIO_DE_MIGRACOES,
      extension: 'ts',
      loadExtensions: ['.ts'],
    },
  });
}

export function deslocarParaNorte(lat: number, metros: number): number {
  return lat + metros / METROS_POR_GRAU_LATITUDE;
}
