import { dbPool } from '@config/database.js';
import type {
  AcaoDoUsuario,
  AvisoAcaoProxima,
  AvisoPertoDaMeta,
  AvisoSemResposta,
  ContagensDoUsuario,
  Paginacao,
} from './me.types.js';

const PAPEL = `CASE WHEN m.usuario_id = $1 THEN 'organizadora' ELSE 'participante' END`;

const PARTICIPA_OU_ORGANIZA = `(m.usuario_id = $1 OR EXISTS (
         SELECT 1 FROM mobilizacao_participantes mp
          WHERE mp.mobilizacao_id = m.id AND mp.usuario_id = $1))`;

const CONTAGEM_DE_PARTICIPANTES = `(SELECT COUNT(*)::int FROM mobilizacao_participantes mp
          WHERE mp.mobilizacao_id = m.id)`;

export async function contagensDoUsuario(usuarioId: number): Promise<ContagensDoUsuario> {
  const result = await dbPool.query(
    `SELECT
       (SELECT criado_em FROM users WHERE id = $1) AS membro_desde,
       (SELECT COUNT(*)::int FROM problemas
         WHERE usuario_id = $1 AND status <> 'removido') AS relatados,
       (SELECT COALESCE(SUM(cont_apoios), 0)::int FROM problemas
         WHERE usuario_id = $1 AND status <> 'removido') AS apoios_recebidos,
       (SELECT COUNT(*)::int FROM problema_apoios a
          JOIN problemas p ON p.id = a.problema_id
         WHERE a.usuario_id = $1 AND p.status <> 'removido') AS apoios_dados,
       (SELECT COUNT(*)::int FROM mobilizacoes m
         WHERE m.status <> 'cancelada' AND ${PARTICIPA_OU_ORGANIZA}) AS acoes`,
    [usuarioId],
  );
  return result.rows[0];
}

export async function idsApoiados(usuarioId: number): Promise<number[]> {
  const result = await dbPool.query(
    `SELECT a.problema_id
       FROM problema_apoios a
       JOIN problemas p ON p.id = a.problema_id
      WHERE a.usuario_id = $1 AND p.status <> 'removido'
      ORDER BY a.problema_id`,
    [usuarioId],
  );
  return result.rows.map((linha: { problema_id: number }) => Number(linha.problema_id));
}

export async function problemasPertoDaMeta(
  usuarioId: number,
  meta: number,
  minimo: number,
  limite: number,
): Promise<Omit<AvisoPertoDaMeta, 'tipo' | 'meta'>[]> {
  const result = await dbPool.query(
    `SELECT id AS problema_id, titulo, cont_apoios
       FROM problemas
      WHERE usuario_id = $1
        AND status IN ('ativo', 'em_analise', 'encaminhado')
        AND cont_apoios >= $3 AND cont_apoios < $2
      ORDER BY cont_apoios DESC, id ASC
      LIMIT $4`,
    [usuarioId, meta, minimo, limite],
  );
  return result.rows;
}

export async function encaminhamentosSemResposta(
  usuarioId: number,
  diasMinimos: number,
  limite: number,
): Promise<Omit<AvisoSemResposta, 'tipo'>[]> {
  const result = await dbPool.query(
    `SELECT e.problema_id, e.id AS encaminhamento_id, p.titulo, o.nome AS orgao, e.enviado_em,
            FLOOR(EXTRACT(EPOCH FROM (now() - e.enviado_em)) / 86400)::int AS dias
       FROM problema_encaminhamentos e
       JOIN problemas p ON p.id = e.problema_id
       JOIN orgaos o ON o.id = e.orgao_id
      WHERE e.usuario_id = $1
        AND e.status = 'enviado'
        AND e.enviado_em <= now() - make_interval(days => $2)
        AND p.status NOT IN ('removido', 'resolvido')
      ORDER BY e.enviado_em ASC, e.id ASC
      LIMIT $3`,
    [usuarioId, diasMinimos, limite],
  );
  return result.rows;
}

export async function acoesProximas(
  usuarioId: number,
  diasAFrente: number,
  limite: number,
): Promise<Omit<AvisoAcaoProxima, 'tipo'>[]> {
  const result = await dbPool.query(
    `SELECT m.id AS mobilizacao_id, m.problema_id, m.titulo, m.data_inicio,
            ${CONTAGEM_DE_PARTICIPANTES} AS cont_participantes,
            ${PAPEL} AS papel
       FROM mobilizacoes m
      WHERE m.status = 'agendada'
        AND m.data_inicio >= now()
        AND m.data_inicio < now() + make_interval(days => $2)
        AND ${PARTICIPA_OU_ORGANIZA}
      ORDER BY m.data_inicio ASC, m.id ASC
      LIMIT $3`,
    [usuarioId, diasAFrente, limite],
  );
  return result.rows;
}

export async function acoesDoUsuario(
  usuarioId: number,
  paginacao: Paginacao,
): Promise<AcaoDoUsuario[]> {
  const limite = paginacao.limite ?? 20;
  const offset = ((paginacao.pagina ?? 1) - 1) * limite;
  const result = await dbPool.query(
    `SELECT m.id, m.problema_id, p.titulo AS problema_titulo, m.titulo, m.data_inicio, m.status,
            ${CONTAGEM_DE_PARTICIPANTES} AS cont_participantes,
            ${PAPEL} AS papel
       FROM mobilizacoes m
       JOIN problemas p ON p.id = m.problema_id
      WHERE ${PARTICIPA_OU_ORGANIZA}
        AND p.status <> 'removido'
      ORDER BY m.data_inicio DESC, m.id DESC
      LIMIT $2 OFFSET $3`,
    [usuarioId, limite, offset],
  );
  return result.rows;
}
