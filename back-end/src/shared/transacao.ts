import type { Pool, PoolClient } from 'pg';
import { dbPool } from '@config/database.js';

export type Executor = Pool | PoolClient;

export async function emTransacao<T>(fn: (executor: Executor) => Promise<T>): Promise<T> {
  const client = await dbPool.connect();

  try {
    await client.query('BEGIN');
    const resultado = await fn(client);
    await client.query('COMMIT');
    return resultado;
  } catch (erro) {
    await client.query('ROLLBACK');
    throw erro;
  } finally {
    client.release();
  }
}
