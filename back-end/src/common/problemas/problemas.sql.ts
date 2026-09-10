import { dbPool } from '@config/database.js';
import type { Executor } from '@shared/transacao.js';
import type {
  CriarProblemaInput,
  FiltroProblemas,
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

interface FiltroConstruido {
  where: string;
  params: unknown[];
  distancia: string;
}

function construirFiltro(query: FiltroProblemas): FiltroConstruido {
  const conditions: string[] = [];
  const params: unknown[] = [];

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

  let distancia = '';
  if (query.lat != null && query.lng != null) {
    params.push(query.lng, query.lat, query.raio ?? RAIO_LISTAGEM_METROS);
    const ponto = pontoGeografia(params.length - 2, params.length - 1);
    conditions.push(`ST_DWithin(p.geom::geography, ${ponto}, $${params.length})`);
    distancia = `ST_Distance(p.geom::geography, ${ponto})`;
  }

  return { where: `WHERE ${conditions.join(' AND ')}`, params, distancia };
}

export async function listarProblemas(query: ListarProblemasQuery): Promise<Problema[]> {
  const { where, params, distancia } = construirFiltro(query);

  const limit = query.limite ?? 20;
  const offset = ((query.pagina ?? 1) - 1) * limit;
  params.push(limit, offset);
  const limitIdx = params.length - 1;
  const offsetIdx = params.length;

  const orderBy = distancia
    ? 'distancia_m ASC, p.cont_apoios_ponderados DESC, p.criado_em DESC'
    : 'p.cont_apoios_ponderados DESC, p.criado_em DESC';

  const result = await dbPool.query(
    `SELECT p.*, ST_X(p.geom) AS lng, ST_Y(p.geom) AS lat${
      distancia ? `, ${distancia} AS distancia_m` : ''
    }
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

export async function contarPorCausa(
  query: FiltroProblemas,
): Promise<{ causa_id: number; total: number }[]> {
  const { where, params } = construirFiltro(query);
  const result = await dbPool.query(
    `SELECT p.causa_id, COUNT(*)::int AS total
     FROM problemas p
     ${where}
     GROUP BY p.causa_id
     ORDER BY total DESC`,
    params,
  );
  return result.rows;
}

export async function contarPorTipo(
  query: FiltroProblemas,
): Promise<{ tipo: string; total: number }[]> {
  const { where, params } = construirFiltro(query);
  const result = await dbPool.query(
    `SELECT p.tipo, COUNT(*)::int AS total
     FROM problemas p
     ${where}
     GROUP BY p.tipo
     ORDER BY total DESC`,
    params,
  );
  return result.rows;
}

export async function totalProblemas(query: FiltroProblemas): Promise<number> {
  const { where, params } = construirFiltro(query);
  const result = await dbPool.query(
    `SELECT COUNT(*)::int AS total FROM problemas p ${where}`,
    params,
  );
  return Number(result.rows[0]?.total ?? 0);
}

export async function tendenciasProblemas(query: ListarProblemasQuery): Promise<Problema[]> {
  const { where, params, distancia } = construirFiltro(query);
  params.push(query.limite ?? 10);
  const limitIdx = params.length;
  const result = await dbPool.query(
    `SELECT p.*, ST_X(p.geom) AS lng, ST_Y(p.geom) AS lat${
      distancia ? `, ${distancia} AS distancia_m` : ''
    }
     FROM problemas p
     ${where}
     ORDER BY p.cont_apoios_ponderados DESC, p.criado_em DESC
     LIMIT $${limitIdx}`,
    params,
  );
  return result.rows;
}
