import { dbPool } from '@config/database.js';
import type {
  CriarProblemaInput,
  ListarProblemasQuery,
  Problema,
} from './problemas.types.js';

export async function insertProblema(input: CriarProblemaInput): Promise<Problema> {
  const result = await dbPool.query(
    `INSERT INTO problemas (usuario_id, titulo, descricao, causa_id, tags, tipo, geom, local_nome, escopo)
     VALUES ($1, $2, $3, $4, $5, $6, ST_SetSRID(ST_MakePoint($7, $8), 4326), $9, $10)
     RETURNING *`,
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
    params.push(query.lng, query.lat, query.raio ?? 5000);
    const lngIdx = params.length - 2;
    const latIdx = params.length - 1;
    const raioIdx = params.length;
    conditions.push(
      `ST_DWithin(p.geom, ST_SetSRID(ST_MakePoint($${lngIdx}, $${latIdx}), 4326), $${raioIdx})`,
    );
    geoPointExpr = `, ST_Distance(p.geom, ST_SetSRID(ST_MakePoint($${lngIdx}, $${latIdx}), 4326)) AS distancia_m`;
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

export async function incrementarVisualizacoes(id: number): Promise<void> {
  await dbPool.query(
    `UPDATE problemas SET cont_visualizacoes = cont_visualizacoes + 1 WHERE id = $1`,
    [id],
  );
}
