import { AppError } from '@shared/errors.js';
import { cache } from '@shared/cache.js';
import { emTransacao, type Executor } from '@shared/transacao.js';
import { can, type Role } from '@common/abilities.js';
import { registrarEvento } from '@common/problemaEventos/problemaEventos.handler.js';
import * as sql from './problemas.sql.js';
import type {
  AlterarStatusProblemaInput,
  CriarProblemaInput,
  ListarProblemasQuery,
  Problema,
  ProblemaDetalhe,
  ProblemaStatus,
} from './problemas.types.js';

const LIST_CACHE_TTL = 30;

export const TRANSICOES_STATUS: Record<ProblemaStatus, ProblemaStatus[]> = {
  ativo: ['em_analise', 'encaminhado', 'resolvido', 'removido'],
  em_analise: ['encaminhado', 'resolvido', 'removido'],
  encaminhado: ['em_analise', 'resolvido', 'removido'],
  resolvido: ['removido'],
  removido: [],
};

export function podeGerenciarProblema(
  problema: Problema,
  usuarioId: number,
  role: string,
): boolean {
  return problema.usuario_id === usuarioId || can(role as Role, 'problemas:moderate');
}

export function transicoesDisponiveis(
  problema: Problema,
  usuarioId?: number,
  role?: string,
): ProblemaStatus[] {
  if (usuarioId == null || role == null) return [];
  if (!podeGerenciarProblema(problema, usuarioId, role)) return [];

  return TRANSICOES_STATUS[problema.status].filter(
    (destino) => destino !== 'removido' || can(role as Role, 'problemas:moderate'),
  );
}

export async function criarProblema(input: CriarProblemaInput): Promise<Problema> {
  if (!input.titulo?.trim()) {
    throw new AppError('Título obrigatório.', 400);
  }
  if (input.tags && input.tags.length > 10) {
    throw new AppError('Máximo de 10 tags.', 400);
  }

  if (input.lat != null && input.lng != null) {
    const duplicado = await sql.findNearbyProblema(
      input.lat,
      input.lng,
      15,
      input.causaId,
      input.tipo ?? 'problema',
    );
    if (duplicado) {
      return duplicado;
    }
  }

  return emTransacao(async (executor) => {
    const problema = await sql.insertProblema(
      {
        usuarioId: input.usuarioId,
        titulo: input.titulo.trim(),
        descricao: input.descricao?.trim() || undefined,
        causaId: input.causaId,
        tags: input.tags ?? [],
        tipo: input.tipo,
        lat: input.lat,
        lng: input.lng,
        localNome: input.localNome,
        escopo: input.escopo,
      },
      executor,
    );

    await registrarEvento(
      {
        problemaId: problema.id,
        tipo: 'PROBLEMA_CRIADO',
        usuarioId: input.usuarioId,
        dados: { titulo: problema.titulo },
      },
      executor,
    );

    return problema;
  });
}

export async function listarProblemas(query: ListarProblemasQuery): Promise<Problema[]> {
  const cacheKey = `problemas:${JSON.stringify(query)}`;
  const cached = await cache.get<Problema[]>(cacheKey);
  if (cached) return cached;

  const problemas = await sql.listarProblemas(query);
  await cache.set(cacheKey, problemas, LIST_CACHE_TTL);
  return problemas;
}

export async function exigirProblema(id: number): Promise<Problema> {
  const problema = await sql.getProblemaById(id);
  if (!problema) {
    throw new AppError('Problema não encontrado.', 404);
  }
  return problema;
}

export async function obterProblema(
  id: number,
  usuarioId?: number,
  role?: string,
): Promise<ProblemaDetalhe> {
  const problema = await exigirProblema(id);
  await sql.incrementarVisualizacoes(id);

  return {
    ...problema,
    pode_encaminhar:
      usuarioId != null && role != null && podeGerenciarProblema(problema, usuarioId, role),
    transicoes_permitidas: transicoesDisponiveis(problema, usuarioId, role),
  };
}

export async function aplicarStatusProblema(
  problema: Problema,
  destino: ProblemaStatus,
  usuarioId: number,
  executor: Executor,
): Promise<Problema> {
  const atualizado = await sql.atualizarStatus(problema.id, destino, executor);

  await registrarEvento(
    {
      problemaId: problema.id,
      tipo: 'STATUS_ALTERADO',
      usuarioId,
      dados: { de: problema.status, para: destino },
    },
    executor,
  );

  if (destino === 'resolvido') {
    await registrarEvento(
      { problemaId: problema.id, tipo: 'RESOLVIDO', usuarioId, dados: { de: problema.status } },
      executor,
    );
  }

  return atualizado;
}

export async function alterarStatusProblema(
  input: AlterarStatusProblemaInput,
): Promise<ProblemaDetalhe> {
  const problema = await exigirProblema(input.problemaId);

  if (!podeGerenciarProblema(problema, input.usuarioId, input.role)) {
    throw new AppError('Você não pode alterar o status deste problema.', 403);
  }
  if (input.status === 'removido' && !can(input.role as Role, 'problemas:moderate')) {
    throw new AppError('Apenas a moderação pode remover um problema.', 403);
  }
  if (problema.status === input.status) {
    throw new AppError('O problema já está neste status.', 400);
  }
  if (!TRANSICOES_STATUS[problema.status].includes(input.status)) {
    throw new AppError(`Não é possível mudar de "${problema.status}" para "${input.status}".`, 400);
  }

  const atualizado = await emTransacao((executor) =>
    aplicarStatusProblema(problema, input.status, input.usuarioId, executor),
  );

  return {
    ...atualizado,
    pode_encaminhar: podeGerenciarProblema(atualizado, input.usuarioId, input.role),
    transicoes_permitidas: transicoesDisponiveis(atualizado, input.usuarioId, input.role),
  };
}

export async function estatisticasProblemas(query: sql.FiltroAgregacao): Promise<{
  total: number;
  porCausa: { causa_id: number; total: number }[];
  porTipo: { tipo: string; total: number }[];
}> {
  const [porCausa, porTipo, total] = await Promise.all([
    sql.contarPorCausa(query),
    sql.contarPorTipo(query),
    sql.totalProblemas(query),
  ]);
  return { total, porCausa, porTipo };
}

export async function tendenciasProblemasHandler(
  query: sql.FiltroAgregacao & { limite?: number },
): Promise<Problema[]> {
  return sql.tendenciasProblemas(query);
}
