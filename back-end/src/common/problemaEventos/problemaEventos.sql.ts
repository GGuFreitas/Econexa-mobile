import { dbPool } from '@config/database.js';
import type { Executor } from '@shared/transacao.js';
import type {
  ListarEventosQuery,
  ProblemaEventoRow,
  RegistrarEventoInput,
} from './problemaEventos.types.js';

export async function problemaExiste(problemaId: number): Promise<boolean> {
  const result = await dbPool.query('SELECT 1 FROM problemas WHERE id = $1', [problemaId]);
  return result.rows.length > 0;
}

export async function inserirEvento(
  input: RegistrarEventoInput,
  executor: Executor = dbPool,
): Promise<ProblemaEventoRow> {
  const result = await executor.query(
    `INSERT INTO problema_eventos (problema_id, tipo, usuario_id, dados)
     VALUES ($1, $2, $3, $4::jsonb)
     RETURNING id, problema_id, tipo, usuario_id, dados, criado_em,
       (SELECT nome FROM users WHERE id = $3) AS autor_nome`,
    [input.problemaId, input.tipo, input.usuarioId ?? null, JSON.stringify(input.dados ?? {})],
  );
  return result.rows[0];
}

export async function listarEventos(query: ListarEventosQuery): Promise<ProblemaEventoRow[]> {
  const limit = query.limite ?? 20;
  const offset = ((query.pagina ?? 1) - 1) * limit;

  const result = await dbPool.query(
    `SELECT e.id, e.problema_id, e.tipo, e.usuario_id, e.dados, e.criado_em, u.nome AS autor_nome
     FROM problema_eventos e
     LEFT JOIN users u ON u.id = e.usuario_id
     WHERE e.problema_id = $1
     ORDER BY e.criado_em DESC, e.id DESC
     LIMIT $2 OFFSET $3`,
    [query.problemaId, limit, offset],
  );
  return result.rows;
}
