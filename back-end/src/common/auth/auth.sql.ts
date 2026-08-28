import { dbPool } from '@config/database.js';

export async function findUserByEmail(email: string) {
  const result = await dbPool.query(
    'SELECT id, nome, email, senha, role, peso_voto FROM users WHERE email = $1',
    [email],
  );
  return result.rows[0] ?? null;
}

export async function findUserById(id: number) {
  const result = await dbPool.query(
    'SELECT id, nome, email, role, peso_voto FROM users WHERE id = $1',
    [id],
  );
  return result.rows[0] ?? null;
}

export async function insertUser(input: { nome: string; email: string; passwordHash: string; role: string }) {
  const result = await dbPool.query(
    `INSERT INTO users (nome, email, senha, role, peso_voto)
     VALUES ($1, $2, $3, $4, 1)
     RETURNING id, nome, email, role, peso_voto`,
    [input.nome, input.email, input.passwordHash, input.role],
  );
  return result.rows[0];
}
