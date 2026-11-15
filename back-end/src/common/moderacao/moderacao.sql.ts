import { dbPool } from '@config/database.js';
import type { Executor } from '@shared/transacao.js';
import type { AlvoDoBloqueio, FilaDeDenunciasQuery, ProblemaDenunciado } from './moderacao.types.js';

export async function listarProblemasDenunciados(
  query: FilaDeDenunciasQuery,
): Promise<ProblemaDenunciado[]> {
  const result = await dbPool.query(
    `SELECT p.id AS problema_id, p.titulo, p.status,
            u.id AS autor_id, u.nome AS autor_nome, u.bloqueado_em IS NOT NULL AS autor_bloqueado,
            d.total_denuncias, d.ultima_denuncia_em, d.motivos
     FROM (
       SELECT problema_id,
              COUNT(*)::int AS total_denuncias,
              MAX(criado_em) AS ultima_denuncia_em,
              (ARRAY_AGG(motivo ORDER BY criado_em DESC))[1:5] AS motivos
       FROM problema_denuncias
       GROUP BY problema_id
     ) d
     INNER JOIN problemas p ON p.id = d.problema_id
     INNER JOIN users u ON u.id = p.usuario_id
     WHERE p.status <> 'removido'
     ORDER BY d.total_denuncias DESC, d.ultima_denuncia_em DESC
     LIMIT $1 OFFSET $2`,
    [query.limite, (query.pagina - 1) * query.limite],
  );
  return result.rows;
}

export async function descartarDenuncias(problemaId: number): Promise<number> {
  const result = await dbPool.query('DELETE FROM problema_denuncias WHERE problema_id = $1', [
    problemaId,
  ]);
  return result.rowCount ?? 0;
}

export async function travarAlvo(usuarioId: number, executor: Executor): Promise<AlvoDoBloqueio | null> {
  const result = await executor.query(
    'SELECT id, role, bloqueado_em, excluido_em FROM users WHERE id = $1 FOR UPDATE',
    [usuarioId],
  );
  return result.rows[0] ?? null;
}

export async function gravarBloqueio(
  usuarioId: number,
  moderadorId: number,
  motivo: string,
  executor: Executor,
): Promise<void> {
  await executor.query(
    `UPDATE users SET bloqueado_em = NOW(), bloqueado_por = $2, bloqueio_motivo = $3
     WHERE id = $1`,
    [usuarioId, moderadorId, motivo],
  );
}

export async function removerBloqueio(usuarioId: number): Promise<boolean> {
  const result = await dbPool.query(
    `UPDATE users SET bloqueado_em = NULL, bloqueado_por = NULL, bloqueio_motivo = NULL
     WHERE id = $1 AND bloqueado_em IS NOT NULL
     RETURNING id`,
    [usuarioId],
  );
  return result.rows.length > 0;
}
