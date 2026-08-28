import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

export const dbPool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export async function checkDatabaseConnection(): Promise<void> {
  await dbPool.query('SELECT 1');
  console.log('Conexão com o banco de dados estabelecida com sucesso!');
}
