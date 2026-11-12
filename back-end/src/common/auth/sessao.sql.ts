import { dbPool } from '@config/database.js';
import type { Executor } from '@shared/transacao.js';
import { COLUNAS_DO_USUARIO } from './auth.sql.js';
import type {
  RefreshTokenEmitido,
  RefreshTokenReivindicado,
  SituacaoDaCadeia,
  UsuarioRow,
} from './auth.types.js';

export async function inserirRefreshToken(
  usuarioId: number,
  tokenHash: string,
  validadeEmDias: number,
  executor: Executor = dbPool,
): Promise<RefreshTokenEmitido | null> {
  const result = await executor.query(
    `WITH usuario AS (
       SELECT id, sessao_versao FROM users WHERE id = $1 FOR UPDATE
     ), novo AS (
       INSERT INTO refresh_tokens (usuario_id, token_hash, expira_em)
       SELECT id, $2, NOW() + make_interval(days => $3::int) FROM usuario
       RETURNING id
     )
     SELECT novo.id, usuario.sessao_versao FROM novo, usuario`,
    [usuarioId, tokenHash, validadeEmDias],
  );
  return result.rows[0] ?? null;
}

export async function travarUsuarioDoRefreshToken(
  tokenHash: string,
  executor: Executor = dbPool,
): Promise<UsuarioRow | null> {
  const result = await executor.query(
    `SELECT ${COLUNAS_DO_USUARIO} FROM users
     WHERE id = (SELECT usuario_id FROM refresh_tokens WHERE token_hash = $1)
     FOR UPDATE`,
    [tokenHash],
  );
  return result.rows[0] ?? null;
}

export async function reivindicarRefreshToken(
  tokenHash: string,
  executor: Executor = dbPool,
): Promise<RefreshTokenReivindicado | null> {
  const result = await executor.query(
    `UPDATE refresh_tokens
     SET revogado_em = NOW()
     WHERE token_hash = $1 AND revogado_em IS NULL AND expira_em > NOW()
     RETURNING id, usuario_id`,
    [tokenHash],
  );
  return result.rows[0] ?? null;
}

export async function registrarSubstituto(
  id: number,
  substitutoId: number,
  executor: Executor = dbPool,
): Promise<void> {
  await executor.query('UPDATE refresh_tokens SET substituido_por = $2 WHERE id = $1', [
    id,
    substitutoId,
  ]);
}

export async function situacaoDaCadeia(tokenHash: string): Promise<SituacaoDaCadeia | null> {
  const result = await dbPool.query(
    `WITH RECURSIVE cadeia AS (
       SELECT id, usuario_id, substituido_por, revogado_em, expira_em
       FROM refresh_tokens
       WHERE token_hash = $1
       UNION ALL
       SELECT r.id, r.usuario_id, r.substituido_por, r.revogado_em, r.expira_em
       FROM refresh_tokens r
       INNER JOIN cadeia c ON r.id = c.substituido_por AND r.id > c.id
     )
     SELECT MIN(usuario_id) AS usuario_id,
            COALESCE(BOOL_OR(revogado_em IS NULL AND expira_em > NOW()), false) AS viva
     FROM cadeia`,
    [tokenHash],
  );
  const linha = result.rows[0];
  return linha?.usuario_id == null ? null : { usuario_id: Number(linha.usuario_id), viva: linha.viva };
}

export async function revogarRefreshToken(tokenHash: string): Promise<void> {
  await dbPool.query(
    'UPDATE refresh_tokens SET revogado_em = NOW() WHERE token_hash = $1 AND revogado_em IS NULL',
    [tokenHash],
  );
}

export async function incrementarSessaoVersao(
  usuarioId: number,
  executor: Executor = dbPool,
): Promise<number | null> {
  const result = await executor.query(
    'UPDATE users SET sessao_versao = sessao_versao + 1 WHERE id = $1 RETURNING sessao_versao',
    [usuarioId],
  );
  return result.rows.length > 0 ? Number(result.rows[0].sessao_versao) : null;
}

export async function revogarRefreshTokensDoUsuario(
  usuarioId: number,
  executor: Executor = dbPool,
): Promise<void> {
  await executor.query(
    'UPDATE refresh_tokens SET revogado_em = NOW() WHERE usuario_id = $1 AND revogado_em IS NULL',
    [usuarioId],
  );
}
