import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

export const dbPool  = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

dbPool.query('SELECT NOW()')
  .then(() => console.log('Conexão com o banco de dados estabelecida com sucesso!'))
  .catch((err) =>{ 
    console.error('Erro ao conectar com o banco de dados:', err)
    process.exit(1)
  });