import * as problemasSql from '@common/problemas/problemas.sql.js';
import type { ProblemaListado } from '@common/problemas/problemas.types.js';
import * as sql from './me.sql.js';
import type { AcaoDoUsuario, Aviso, Paginacao, ResumoDoUsuario } from './me.types.js';

export const META_APOIOS = 50;
export const MINIMO_PERTO_DA_META = 25;
export const DIAS_SEM_RESPOSTA = 7;
export const DIAS_ACAO_PROXIMA = 7;
const AVISOS_POR_TIPO = 3;

export async function resumoDoUsuario(usuarioId: number): Promise<ResumoDoUsuario> {
  const [contagens, pertoDaMeta, semResposta, proximas] = await Promise.all([
    sql.contagensDoUsuario(usuarioId),
    sql.problemasPertoDaMeta(usuarioId, META_APOIOS, MINIMO_PERTO_DA_META, AVISOS_POR_TIPO),
    sql.encaminhamentosSemResposta(usuarioId, DIAS_SEM_RESPOSTA, AVISOS_POR_TIPO),
    sql.acoesProximas(usuarioId, DIAS_ACAO_PROXIMA, AVISOS_POR_TIPO),
  ]);

  const avisos: Aviso[] = [
    ...proximas.map((acao) => ({ tipo: 'acao_proxima' as const, ...acao })),
    ...pertoDaMeta.map((problema) => ({
      tipo: 'perto_da_meta' as const,
      meta: META_APOIOS,
      ...problema,
    })),
    ...semResposta.map((encaminhamento) => ({
      tipo: 'sem_resposta' as const,
      ...encaminhamento,
    })),
  ];

  return { ...contagens, avisos };
}

export async function problemasRelatados(
  usuarioId: number,
  paginacao: Paginacao,
): Promise<ProblemaListado[]> {
  return problemasSql.listarProblemas({
    ...paginacao,
    relatadoPor: usuarioId,
    recentesPrimeiro: true,
  });
}

export async function problemasApoiados(
  usuarioId: number,
  paginacao: Paginacao,
): Promise<ProblemaListado[]> {
  return problemasSql.listarProblemas({
    ...paginacao,
    apoiadoPor: usuarioId,
    recentesPrimeiro: true,
  });
}

export async function acoesDoUsuario(
  usuarioId: number,
  paginacao: Paginacao,
): Promise<AcaoDoUsuario[]> {
  return sql.acoesDoUsuario(usuarioId, paginacao);
}
