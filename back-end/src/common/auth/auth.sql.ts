import { dbPool } from '@config/database.js';
import type { Executor } from '@shared/transacao.js';
import type { CredenciaisRow, NovoUsuario, UsuarioRow } from './auth.types.js';

export const COLUNAS_DO_USUARIO = `id, nome, email, role, peso_voto, email_verificado,
  bloqueado_em, sessao_versao`;

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
    `INSERT INTO users (nome, email, senha, role, peso_voto, email_verificado, email_verificado_em)
     VALUES ($1, $2, $3, 'citizen', 1, $4::boolean, CASE WHEN $4::boolean THEN NOW() END)
     RETURNING ${COLUNAS_DO_USUARIO}`,
    [novo.nome, novo.email, novo.senhaHash, novo.emailVerificado],
  );
  return result.rows[0];
}

export async function inserirTokenDeVerificacao(
  usuarioId: number,
  tokenHash: string,
  validadeEmHoras: number,
  executor: Executor = dbPool,
): Promise<void> {
  await executor.query(
    `INSERT INTO email_verification_tokens (usuario_id, token_hash, expira_em)
     VALUES ($1, $2, NOW() + make_interval(hours => $3::int))`,
    [usuarioId, tokenHash, validadeEmHoras],
  );
}

export async function reivindicarTokenDeVerificacao(
  tokenHash: string,
  executor: Executor = dbPool,
): Promise<number | null> {
  const result = await executor.query(
    `UPDATE email_verification_tokens
     SET usado_em = NOW()
     WHERE token_hash = $1 AND usado_em IS NULL AND expira_em > NOW()
     RETURNING usuario_id`,
    [tokenHash],
  );
  return result.rows.length > 0 ? Number(result.rows[0].usuario_id) : null;
}

export async function marcarEmailVerificado(
  usuarioId: number,
  executor: Executor = dbPool,
): Promise<boolean> {
  const result = await executor.query(
    `UPDATE users SET email_verificado = true, email_verificado_em = NOW()
     WHERE id = $1 AND email_verificado = false
     RETURNING id`,
    [usuarioId],
  );
  return result.rows.length > 0;
}

export async function emailDoTokenJaVerificado(tokenHash: string): Promise<boolean> {
  const result = await dbPool.query(
    `SELECT u.email_verificado
     FROM email_verification_tokens t
     INNER JOIN users u ON u.id = t.usuario_id
     WHERE t.token_hash = $1`,
    [tokenHash],
  );
  return result.rows[0]?.email_verificado === true;
}
