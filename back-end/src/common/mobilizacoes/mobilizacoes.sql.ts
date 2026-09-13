import { dbPool } from '@config/database.js';
import type {
  AtualizarMobilizacaoInput,
  CriarMobilizacaoInput,
  ListarMobilizacoesQuery,
  Mobilizacao,
  MobilizacaoStatus,
  ResultadoMobilizacaoInput,
} from './mobilizacoes.types.js';

export async function problemaExiste(problemaId: number): Promise<boolean> {
  const result = await dbPool.query('SELECT 1 FROM problemas WHERE id = $1', [problemaId]);
  return result.rows.length > 0;
}

export async function insertMobilizacao(input: CriarMobilizacaoInput): Promise<Mobilizacao> {
  const result = await dbPool.query(
    `INSERT INTO mobilizacoes (problema_id, usuario_id, titulo, descricao, data_inicio, data_fim, local_nome, geom)
     VALUES ($1, $2, $3, $4, $5, $6, $7, ST_SetSRID(ST_MakePoint($8, $9), 4326))
     RETURNING *`,
    [
      input.problemaId,
      input.usuarioId,
      input.titulo.trim(),
      input.descricao?.trim() ?? null,
      input.dataInicio,
      input.dataFim ?? null,
      input.localNome?.trim() ?? null,
      input.lng ?? null,
      input.lat ?? null,
    ],
  );
  return result.rows[0];
}

export async function listarMobilizacoes(query: ListarMobilizacoesQuery): Promise<Mobilizacao[]> {
  const limit = query.limite ?? 20;
  const offset = ((query.pagina ?? 1) - 1) * limit;

  const result = await dbPool.query(
    `SELECT m.*, ST_X(m.geom) AS lng, ST_Y(m.geom) AS lat
     FROM mobilizacoes m
     WHERE m.problema_id = $1
     ORDER BY m.data_inicio ASC
     LIMIT $2 OFFSET $3`,
    [query.problemaId, limit, offset],
  );
  return result.rows;
}

export async function getMobilizacaoById(id: number): Promise<Mobilizacao | null> {
  const result = await dbPool.query(
    `SELECT m.*, ST_X(m.geom) AS lng, ST_Y(m.geom) AS lat
     FROM mobilizacoes m
     WHERE m.id = $1`,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function updateMobilizacao(
  id: number,
  input: AtualizarMobilizacaoInput,
): Promise<Mobilizacao> {
  const sets: string[] = [];
  const params: unknown[] = [];

  if (input.titulo != null) {
    params.push(input.titulo.trim());
    sets.push(`titulo = $${params.length}`);
  }
  if (input.descricao != null) {
    params.push(input.descricao.trim());
    sets.push(`descricao = $${params.length}`);
  }
  if (input.dataInicio != null) {
    params.push(input.dataInicio);
    sets.push(`data_inicio = $${params.length}`);
  }
  if (input.dataFim != null) {
    params.push(input.dataFim);
    sets.push(`data_fim = $${params.length}`);
  }
  if (input.localNome != null) {
    params.push(input.localNome.trim());
    sets.push(`local_nome = $${params.length}`);
  }
  if (input.lat != null && input.lng != null) {
    params.push(input.lng, input.lat);
    sets.push(`geom = ST_SetSRID(ST_MakePoint($${params.length - 1}, $${params.length}), 4326)`);
  }
  sets.push('atualizado_em = now()');

  params.push(id);
  const result = await dbPool.query(
    `UPDATE mobilizacoes SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
    params,
  );
  return result.rows[0];
}

export async function updateStatus(id: number, status: MobilizacaoStatus): Promise<Mobilizacao> {
  const result = await dbPool.query(
    `UPDATE mobilizacoes SET status = $1, atualizado_em = now() WHERE id = $2 RETURNING *`,
    [status, id],
  );
  return result.rows[0];
}

export async function registrarResultado(
  id: number,
  input: ResultadoMobilizacaoInput,
): Promise<Mobilizacao> {
  const result = await dbPool.query(
    `UPDATE mobilizacoes
     SET resultado_descricao = $1, resultado_metricas = $2, status = 'realizada', atualizado_em = now()
     WHERE id = $3
     RETURNING *`,
    [input.descricao.trim(), input.metricas ? JSON.stringify(input.metricas) : null, id],
  );
  return result.rows[0];
}

export async function contarParticipantes(mobilizacaoId: number): Promise<number> {
  const result = await dbPool.query(
    `SELECT COUNT(*)::int AS total FROM mobilizacao_participantes WHERE mobilizacao_id = $1`,
    [mobilizacaoId],
  );
  return Number(result.rows[0]?.total ?? 0);
}

export async function participar(mobilizacaoId: number, usuarioId: number): Promise<boolean> {
  const result = await dbPool.query(
    `INSERT INTO mobilizacao_participantes (mobilizacao_id, usuario_id)
     VALUES ($1, $2)
     ON CONFLICT (mobilizacao_id, usuario_id) DO NOTHING
     RETURNING mobilizacao_id`,
    [mobilizacaoId, usuarioId],
  );
  return result.rows.length > 0;
}

export async function sair(mobilizacaoId: number, usuarioId: number): Promise<number> {
  const result = await dbPool.query(
    `DELETE FROM mobilizacao_participantes WHERE mobilizacao_id = $1 AND usuario_id = $2 RETURNING usuario_id`,
    [mobilizacaoId, usuarioId],
  );
  return result.rows.length;
}
