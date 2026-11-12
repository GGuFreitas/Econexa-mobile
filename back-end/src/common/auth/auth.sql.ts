import { dbPool } from '@config/database.js';
import type { Executor } from '@shared/transacao.js';
import type { CredenciaisRow, NovoUsuario, UsuarioRow } from './auth.types.js';

export const COLUNAS_DO_USUARIO = `id, nome, email, role, peso_voto, bloqueado_em, sessao_versao`;

export async function buscarCredenciaisPorEmail(email: string): Promise<CredenciaisRow | null> {
  const result = await dbPool.query(
    `SELECT ${COLUNAS_DO_USUARIO}, senha FROM users WHERE email = $1`,
    [email],
  );
  return result.rows[0] ?? null;
}

export async function buscarUsuarioPorEmail(
  email: string,
  executor: Executor = dbPool,
): Promise<UsuarioRow | null> {
  const result = await executor.query(`SELECT ${COLUNAS_DO_USUARIO} FROM users WHERE email = $1`, [
    email,
  ]);
  return result.rows[0] ?? null;
}

export async function buscarUsuarioPorId(
  id: number,
  executor: Executor = dbPool,
): Promise<UsuarioRow | null> {
  const result = await executor.query(`SELECT ${COLUNAS_DO_USUARIO} FROM users WHERE id = $1`, [id]);
  return result.rows[0] ?? null;
}

export async function inserirUsuario(
  novo: NovoUsuario,
  executor: Executor = dbPool,
): Promise<UsuarioRow> {
  const result = await executor.query(
    `INSERT INTO users (nome, email, senha, role, peso_voto)
     VALUES ($1, $2, $3, 'citizen', 1)
     RETURNING ${COLUNAS_DO_USUARIO}`,
    [novo.nome, novo.email, novo.senhaHash],
  );
  return result.rows[0];
}
