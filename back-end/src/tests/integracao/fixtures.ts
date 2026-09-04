import { dbPool } from '@config/database.js';
import type { ProblemaStatus, ProblemaTipo } from '@common/problemas/problemas.types.js';

export const SAO_PAULO = { lat: -23.5505, lng: -46.6333 };

export interface ProblemaFixture {
  usuarioId: number;
  lat?: number;
  lng?: number;
  causaId?: number;
  tipo?: ProblemaTipo;
  status?: ProblemaStatus;
  titulo?: string;
}

export async function limparBanco(): Promise<void> {
  await dbPool.query(`
    TRUNCATE problema_eventos, problema_encaminhamentos, problema_denuncias,
             problema_apoios, problema_comentarios, mobilizacao_participantes,
             mobilizacoes, evento_participantes, evento_problema, eventos,
             imagens, problemas, users
    RESTART IDENTITY CASCADE
  `);
}

export async function encerrarBanco(): Promise<void> {
  await dbPool.end();
}

export async function criarUsuario(nome: string, pesoVoto = 1): Promise<number> {
  const result = await dbPool.query(
    `INSERT INTO users (nome, email, senha, role, peso_voto)
     VALUES ($1, $2, 'hash', 'citizen', $3)
     RETURNING id`,
    [nome, `${nome.toLowerCase().replace(/\s+/g, '.')}@exemplo.invalid`, pesoVoto],
  );
  return Number(result.rows[0].id);
}

export async function criarProblemaNoBanco(fixture: ProblemaFixture): Promise<number> {
  const result = await dbPool.query(
    `INSERT INTO problemas (usuario_id, titulo, causa_id, tipo, status, geom, escopo)
     VALUES ($1, $2, $3, $4, $5, ST_SetSRID(ST_MakePoint($6, $7), 4326), 'local')
     RETURNING id`,
    [
      fixture.usuarioId,
      fixture.titulo ?? 'Problema de teste',
      fixture.causaId ?? 1,
      fixture.tipo ?? 'problema',
      fixture.status ?? 'ativo',
      fixture.lng ?? SAO_PAULO.lng,
      fixture.lat ?? SAO_PAULO.lat,
    ],
  );
  return Number(result.rows[0].id);
}

export async function criarEventoNoBanco(
  usuarioId: number,
  lat: number,
  lng: number,
  titulo = 'Mutirão de teste',
): Promise<number> {
  const result = await dbPool.query(
    `INSERT INTO eventos (usuario_id, causa_id, titulo, tipo, geom, data_inicio, status)
     VALUES ($1, 1, $2, 'mutirao', ST_SetSRID(ST_MakePoint($3, $4), 4326), now(), 'planejado')
     RETURNING id`,
    [usuarioId, titulo, lng, lat],
  );
  return Number(result.rows[0].id);
}

export async function contarApoios(problemaId: number): Promise<number> {
  const result = await dbPool.query(
    'SELECT COUNT(*)::int AS total FROM problema_apoios WHERE problema_id = $1',
    [problemaId],
  );
  return Number(result.rows[0].total);
}

export async function contadoresDoProblema(
  problemaId: number,
): Promise<{ cont_apoios: number; cont_apoios_ponderados: number }> {
  const result = await dbPool.query(
    'SELECT cont_apoios, cont_apoios_ponderados FROM problemas WHERE id = $1',
    [problemaId],
  );
  return {
    cont_apoios: Number(result.rows[0].cont_apoios),
    cont_apoios_ponderados: Number(result.rows[0].cont_apoios_ponderados),
  };
}

export async function tiposDeEvento(problemaId: number): Promise<string[]> {
  const result = await dbPool.query(
    'SELECT tipo FROM problema_eventos WHERE problema_id = $1 ORDER BY id',
    [problemaId],
  );
  return result.rows.map((row) => String(row.tipo));
}

export async function primeiroOrgaoAtivo(): Promise<number> {
  const result = await dbPool.query('SELECT id FROM orgaos WHERE ativo = true ORDER BY id LIMIT 1');
  return Number(result.rows[0].id);
}
