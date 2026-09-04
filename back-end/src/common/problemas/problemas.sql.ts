import { dbPool } from '@config/database.js';
import type { Executor } from '@shared/transacao.js';
import type {
  CriarProblemaInput,
  ListarProblemasQuery,
  Problema,
  ProblemaStatus,
} from './problemas.types.js';

export const RAIO_LISTAGEM_METROS = 5000;

function pontoGeografia(lngIdx: number, latIdx: number): string {
  return `ST_SetSRID(ST_MakePoint($${lngIdx}, $${latIdx}), 4326)::geography`;
}

export async function insertProblema(
  input: CriarProblemaInput,
  executor: Executor = dbPool,
): Promise<Problema> {
  const result = await executor.query(
    `INSERT INTO problemas (usuario_id, titulo, descricao, causa_id, tags, tipo, geom, local_nome, escopo)
     VALUES ($1, $2, $3, $4, $5, $6, ST_SetSRID(ST_MakePoint($7, $8), 4326), $9, $10)
     RETURNING *, ST_X(geom) AS lng, ST_Y(geom) AS lat`,
    [
      input.usuarioId,
      input.titulo,
      input.descricao ?? null,
      input.causaId,
      input.tags ?? [],
      input.tipo ?? 'problema',
      input.lng,
      input.lat,
      input.localNome ?? null,
      input.escopo ?? 'local',
    ],
  );
  return result.rows[0];
}

export async function listarProblemas(query: ListarProblemasQuery): Promise<Problema[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  const hasPoint = query.lat != null && query.lng != null;

  if (query.status) {
    params.push(query.status);
    conditions.push(`p.status = $${params.length}`);
  } else {
    conditions.push(`p.status <> 'removido'`);
  }
  if (query.tipo) {
    params.push(query.tipo);
    conditions.push(`p.tipo = $${params.length}`);
  }
  if (query.escopo) {
    params.push(query.escopo);
    conditions.push(`p.escopo = $${params.length}`);
  }
  if (query.causaId) {
    params.push(query.causaId);
    conditions.push(`p.causa_id = $${params.length}`);
  }
  if (query.tags && query.tags.length) {
    params.push(query.tags);
    conditions.push(`p.tags && $${params.length}`);
  }

  let geoPointExpr = '';
  if (hasPoint) {
    params.push(query.lng, query.lat, query.raio ?? RAIO_LISTAGEM_METROS);
    const ponto = pontoGeografia(params.length - 2, params.length - 1);
    const raioIdx = params.length;
    conditions.push(`ST_DWithin(p.geom::geography, ${ponto}, $${raioIdx})`);
    geoPointExpr = `, ST_Distance(p.geom::geography, ${ponto}) AS distancia_m`;
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = query.limite ?? 20;
  const offset = ((query.pagina ?? 1) - 1) * limit;
  params.push(limit, offset);
  const limitIdx = params.length - 1;
  const offsetIdx = params.length;

  const orderBy = hasPoint
    ? 'distancia_m ASC, p.cont_apoios_ponderados DESC, p.criado_em DESC'
    : 'p.cont_apoios_ponderados DESC, p.criado_em DESC';

  const result = await dbPool.query(
    `SELECT p.*, ST_X(p.geom) AS lng, ST_Y(p.geom) AS lat${geoPointExpr}
     FROM problemas p
     ${where}
     ORDER BY ${orderBy}
     LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    params,
  );
  return result.rows;
}

export async function getProblemaById(id: number): Promise<Problema | null> {
  const result = await dbPool.query(
    `SELECT p.*, ST_X(p.geom) AS lng, ST_Y(p.geom) AS lat
     FROM problemas p
     WHERE p.id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function findNearbyProblema(
  lat: number,
  lng: number,
  raioMetros: number,
  causaId: number,
  tipo: string,
): Promise<Problema | null> {
  const ponto = pontoGeografia(1, 2);
  const result = await dbPool.query(
    `SELECT p.*, ST_X(p.geom) AS lng, ST_Y(p.geom) AS lat,
            ST_Distance(p.geom::geography, ${ponto}) AS distancia_m
     FROM problemas p
     WHERE p.causa_id = $4 AND p.tipo = $5
       AND p.status NOT IN ('removido', 'resolvido')
       AND ST_DWithin(p.geom::geography, ${ponto}, $3)
     ORDER BY distancia_m ASC, p.id ASC
     LIMIT 1`,
    [lng, lat, raioMetros, causaId, tipo],
  );
  return result.rows[0] ?? null;
}

export async function atualizarStatus(
  id: number,
  status: ProblemaStatus,
  executor: Executor = dbPool,
): Promise<Problema> {
  const result = await executor.query(
    `UPDATE problemas SET status = $2, atualizado_em = now()
     WHERE id = $1
     RETURNING *, ST_X(geom) AS lng, ST_Y(geom) AS lat`,
    [id, status],
  );
  return result.rows[0];
}

export async function incrementarVisualizacoes(id: number): Promise<void> {
  await dbPool.query(
    `UPDATE problemas SET cont_visualizacoes = cont_visualizacoes + 1 WHERE id = $1`,
    [id],
  );
}

export interface FiltroAgregacao {
  status?: string;
  tipo?: string;
  escopo?: string;
  causaId?: number;
}

function buildWhere(query: FiltroAgregacao): { clause: string; params: unknown[] } {
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (query.status) {
    params.push(query.status);
    conditions.push(`status = $${params.length}`);
  } else {
    conditions.push(`status <> 'removido'`);
  }
  if (query.tipo) {
    params.push(query.tipo);
    conditions.push(`tipo = $${params.length}`);
  }
  if (query.escopo) {
    params.push(query.escopo);
    conditions.push(`escopo = $${params.length}`);
  }
  if (query.causaId) {
    params.push(query.causaId);
    conditions.push(`causa_id = $${params.length}`);
  }
  const clause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  return { clause, params };
}

export async function contarPorCausa(
  query: FiltroAgregacao,
): Promise<{ causa_id: number; total: number }[]> {
  const { clause, params } = buildWhere(query);
  const result = await dbPool.query(
    `SELECT causa_id, COUNT(*)::int AS total FROM problemas ${clause} GROUP BY causa_id ORDER BY total DESC`,
    params,
  );
  return result.rows;
}

export async function contarPorTipo(
  query: FiltroAgregacao,
): Promise<{ tipo: string; total: number }[]> {
  const { clause, params } = buildWhere(query);
  const result = await dbPool.query(
    `SELECT tipo, COUNT(*)::int AS total FROM problemas ${clause} GROUP BY tipo ORDER BY total DESC`,
    params,
  );
  return result.rows;
}

export async function totalProblemas(query: FiltroAgregacao): Promise<number> {
  const { clause, params } = buildWhere(query);
  const result = await dbPool.query(
    `SELECT COUNT(*)::int AS total FROM problemas ${clause}`,
    params,
  );
  return Number(result.rows[0]?.total ?? 0);
}

export async function tendenciasProblemas(
  query: FiltroAgregacao & { limite?: number },
): Promise<Problema[]> {
  const { clause, params } = buildWhere(query);
  params.push(query.limite ?? 10);
  const limitIdx = params.length;
  const result = await dbPool.query(
    `SELECT p.*, ST_X(p.geom) AS lng, ST_Y(p.geom) AS lat
     FROM problemas p ${clause}
     ORDER BY p.cont_apoios_ponderados DESC, p.criado_em DESC
     LIMIT $${limitIdx}`,
    params,
  );
  return result.rows;
}
