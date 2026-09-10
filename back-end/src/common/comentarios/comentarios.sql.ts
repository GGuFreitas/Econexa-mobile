import { dbPool } from '@config/database.js';
import type { Executor } from '@shared/transacao.js';
import type {
  ComentarioRow,
  CriarComentarioInput,
  ListarComentariosQuery,
} from './comentarios.types.js';

export async function problemaExiste(problemaId: number): Promise<boolean> {
  const result = await dbPool.query('SELECT 1 FROM problemas WHERE id = $1', [problemaId]);
  return result.rows.length > 0;
}

export async function inserirComentario(
  input: CriarComentarioInput,
  executor: Executor = dbPool,
): Promise<ComentarioRow> {
  const result = await executor.query(
    `INSERT INTO problema_comentarios (problema_id, usuario_id, conteudo)
     VALUES ($1, $2, $3)
     RETURNING id, problema_id, usuario_id, conteudo, criado_em,
       (SELECT nome FROM users WHERE id = $2) AS autor_nome`,
    [input.problemaId, input.usuarioId, input.conteudo],
  );
  return result.rows[0];
}

export async function listarComentarios(query: ListarComentariosQuery): Promise<ComentarioRow[]> {
  const limit = query.limite ?? 20;
  const offset = ((query.pagina ?? 1) - 1) * limit;

  const result = await dbPool.query(
    `SELECT c.id, c.problema_id, c.usuario_id, c.conteudo, c.criado_em, u.nome AS autor_nome
     FROM problema_comentarios c
     INNER JOIN users u ON u.id = c.usuario_id
     WHERE c.problema_id = $1
     ORDER BY c.criado_em DESC, c.id DESC
     LIMIT $2 OFFSET $3`,
    [query.problemaId, limit, offset],
  );
  return result.rows;
}

export async function getComentarioById(id: number): Promise<ComentarioRow | null> {
  const result = await dbPool.query(
    `SELECT c.id, c.problema_id, c.usuario_id, c.conteudo, c.criado_em, u.nome AS autor_nome
     FROM problema_comentarios c
     INNER JOIN users u ON u.id = c.usuario_id
     WHERE c.id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function removerComentario(id: number): Promise<number> {
  const result = await dbPool.query(
    'DELETE FROM problema_comentarios WHERE id = $1 RETURNING id',
    [id],
  );
  return result.rows.length;
}
