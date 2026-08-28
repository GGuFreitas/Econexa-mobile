import { dbPool } from '@config/database.js';
import type {
  CriarEventoInput,
  Evento,
  ListarEventosQuery,
  VincularProblemaInput,
} from './eventos.types.js';

export async function insertEvento(input: CriarEventoInput): Promise<Evento> {
  const result = await dbPool.query(
    `INSERT INTO eventos (usuario_id, causa_id, titulo, descricao, tipo, geom, data_inicio, data_fim)
     VALUES ($1, $2, $3, $4, $5, ST_SetSRID(ST_MakePoint($6, $7), 4326), $8, $9)
     RETURNING *`,
    [
      input.usuarioId,
      input.causaId,
      input.titulo.trim(),
      input.descricao?.trim() ?? null,
      input.tipo ?? 'mutirao',
      input.lng ?? null,
      input.lat ?? null,
      input.dataInicio,
      input.dataFim ?? null,
    ],
  );
  return result.rows[0];
}

export async function listarEventos(query: ListarEventosQuery): Promise<Evento[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  const hasPoint = query.lat != null && query.lng != null;

  if (query.status) {
    params.push(query.status);
    conditions.push(`e.status = $${params.length}`);
  }
  if (query.tipo) {
    params.push(query.tipo);
    conditions.push(`e.tipo = $${params.length}`);
  }
  if (query.causaId) {
    params.push(query.causaId);
    conditions.push(`e.causa_id = $${params.length}`);
  }

  let geoPointExpr = '';
  if (hasPoint) {
    params.push(query.lng, query.lat, query.raio ?? 5000);
    const lngIdx = params.length - 2;
    const latIdx = params.length - 1;
    const raioIdx = params.length;
    conditions.push(
      `ST_DWithin(e.geom, ST_SetSRID(ST_MakePoint($${lngIdx}, $${latIdx}), 4326), $${raioIdx})`,
    );
    geoPointExpr = `, ST_Distance(e.geom, ST_SetSRID(ST_MakePoint($${lngIdx}, $${latIdx}), 4326)) AS distancia_m`;
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = query.limite ?? 20;
  const offset = ((query.pagina ?? 1) - 1) * limit;
  params.push(limit, offset);
  const limitIdx = params.length - 1;
  const offsetIdx = params.length;

  const orderBy = hasPoint
    ? 'distancia_m ASC, e.data_inicio ASC'
    : 'e.data_inicio ASC, e.criado_em DESC';

  const result = await dbPool.query(
    `SELECT e.*, ST_X(e.geom) AS lng, ST_Y(e.geom) AS lat${geoPointExpr}
     FROM eventos e
     ${where}
     ORDER BY ${orderBy}
     LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    params,
  );
  return result.rows;
}

export async function getEventoById(id: number): Promise<Evento | null> {
  const result = await dbPool.query(
    `SELECT e.*, ST_X(e.geom) AS lng, ST_Y(e.geom) AS lat
     FROM eventos e
     WHERE e.id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function contarParticipantes(eventoId: number): Promise<number> {
  const result = await dbPool.query(
    `SELECT COUNT(*)::int AS total FROM evento_participantes WHERE evento_id = $1`,
    [eventoId],
  );
  return Number(result.rows[0]?.total ?? 0);
}

export async function contarProblemasVinculados(eventoId: number): Promise<number> {
  const result = await dbPool.query(
    `SELECT COUNT(*)::int AS total FROM evento_problema WHERE evento_id = $1`,
    [eventoId],
  );
  return Number(result.rows[0]?.total ?? 0);
}

export async function vincularProblema(input: VincularProblemaInput): Promise<void> {
  await dbPool.query(
    `INSERT INTO evento_problema (evento_id, problema_id, resolveu)
     VALUES ($1, $2, $3)
     ON CONFLICT (evento_id, problema_id) DO UPDATE SET resolveu = EXCLUDED.resolveu`,
    [input.eventoId, input.problemaId, input.resolveu ?? false],
  );

  if (input.resolveu) {
    await dbPool.query(
      `UPDATE problemas SET status = 'resolvido' WHERE id = $1`,
      [input.problemaId],
    );
  }
}

export async function inscrever(eventoId: number, usuarioId: number): Promise<boolean> {
  const result = await dbPool.query(
    `INSERT INTO evento_participantes (evento_id, usuario_id)
     VALUES ($1, $2)
     ON CONFLICT (evento_id, usuario_id) DO NOTHING
     RETURNING evento_id`,
    [eventoId, usuarioId],
  );
  return result.rows.length > 0;
}

export async function desinscrever(eventoId: number, usuarioId: number): Promise<number> {
  const result = await dbPool.query(
    `DELETE FROM evento_participantes WHERE evento_id = $1 AND usuario_id = $2 RETURNING usuario_id`,
    [eventoId, usuarioId],
  );
  return result.rows.length;
}
