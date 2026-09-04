import { AppError } from '@shared/errors.js';
import { emTransacao, type Executor } from '@shared/transacao.js';
import { ehAdmin } from '@common/abilities.js';
import { saveImagem } from '@common/imagens/imagens.handler.js';
import { registrarEvento } from '@common/problemaEventos/problemaEventos.handler.js';
import * as sql from './mobilizacoes.sql.js';
import type {
  AtualizarMobilizacaoInput,
  CriarMobilizacaoInput,
  ListarMobilizacoesQuery,
  Mobilizacao,
  MobilizacaoStatus,
  ResultadoMobilizacaoInput,
} from './mobilizacoes.types.js';

export const TRANSICOES_PERMITIDAS: Record<MobilizacaoStatus, MobilizacaoStatus[]> = {
  agendada: ['em_andamento', 'cancelada'],
  em_andamento: ['realizada', 'cancelada'],
  realizada: [],
  cancelada: [],
};

export function podeGerenciarMobilizacao(
  mobilizacao: Mobilizacao,
  usuarioId?: number,
  role?: string,
): boolean {
  if (usuarioId == null || role == null) return false;
  return mobilizacao.usuario_id === usuarioId || ehAdmin(role);
}

function comPermissao(
  mobilizacao: Mobilizacao,
  usuarioId?: number,
  role?: string,
): Mobilizacao {
  return {
    ...mobilizacao,
    pode_gerenciar: podeGerenciarMobilizacao(mobilizacao, usuarioId, role),
  };
}

function exigirGestao(mobilizacao: Mobilizacao, usuarioId: number, role: string): void {
  if (!podeGerenciarMobilizacao(mobilizacao, usuarioId, role)) {
    throw new AppError('Você não pode gerenciar esta mobilização.', 403);
  }
}

export async function criarMobilizacao(input: CriarMobilizacaoInput): Promise<Mobilizacao> {
  if (!input.titulo?.trim()) {
    throw new AppError('Título obrigatório.', 400);
  }
  if (!input.dataInicio) {
    throw new AppError('Data de início obrigatória.', 400);
  }

  const existe = await sql.problemaExiste(input.problemaId);
  if (!existe) {
    throw new AppError('Problema não encontrado.', 404);
  }

  const criada = await emTransacao(async (executor) => {
    const mobilizacao = await sql.insertMobilizacao(input, executor);

    await registrarEvento(
      {
        problemaId: input.problemaId,
        tipo: 'MOBILIZACAO_CRIADA',
        usuarioId: input.usuarioId,
        dados: { mobilizacao_id: mobilizacao.id, titulo: mobilizacao.titulo },
      },
      executor,
    );

    return mobilizacao;
  });

  return obterMobilizacao(criada.id, input.usuarioId, input.role);
}

async function registrarMobilizacaoRealizada(
  mobilizacao: Mobilizacao,
  usuarioId: number,
  executor: Executor,
): Promise<void> {
  await registrarEvento(
    {
      problemaId: mobilizacao.problema_id,
      tipo: 'MOBILIZACAO_REALIZADA',
      usuarioId,
      dados: { mobilizacao_id: mobilizacao.id, titulo: mobilizacao.titulo },
    },
    executor,
  );
}

export async function listarMobilizacoes(
  query: ListarMobilizacoesQuery,
  usuarioId?: number,
  role?: string,
): Promise<Mobilizacao[]> {
  const mobilizacoes = await sql.listarMobilizacoes(query, usuarioId);
  return mobilizacoes.map((mobilizacao) => comPermissao(mobilizacao, usuarioId, role));
}

async function exigirMobilizacao(id: number, usuarioId?: number): Promise<Mobilizacao> {
  const mobilizacao = await sql.getMobilizacaoById(id, usuarioId);
  if (!mobilizacao) {
    throw new AppError('Mobilização não encontrada.', 404);
  }
  return mobilizacao;
}

export async function obterMobilizacao(
  id: number,
  usuarioId?: number,
  role?: string,
): Promise<Mobilizacao> {
  return comPermissao(await exigirMobilizacao(id, usuarioId), usuarioId, role);
}

export async function atualizarMobilizacao(
  id: number,
  input: AtualizarMobilizacaoInput,
  usuarioId: number,
  role: string,
): Promise<Mobilizacao> {
  const atual = await exigirMobilizacao(id, usuarioId);
  exigirGestao(atual, usuarioId, role);

  await sql.updateMobilizacao(id, input);
  return obterMobilizacao(id, usuarioId, role);
}

export async function atualizarStatusMobilizacao(
  id: number,
  status: MobilizacaoStatus,
  usuarioId: number,
  role: string,
): Promise<Mobilizacao> {
  const atual = await exigirMobilizacao(id, usuarioId);
  exigirGestao(atual, usuarioId, role);

  const permitido = TRANSICOES_PERMITIDAS[atual.status as MobilizacaoStatus]?.includes(status);
  if (!permitido) {
    throw new AppError(`Não é possível mudar de "${atual.status}" para "${status}".`, 400);
  }

  await emTransacao(async (executor) => {
    const atualizada = await sql.updateStatus(id, status, executor);
    if (status === 'realizada') {
      await registrarMobilizacaoRealizada(atualizada, usuarioId, executor);
    }
    return atualizada;
  });

  return obterMobilizacao(id, usuarioId, role);
}

export async function registrarResultadoMobilizacao(
  id: number,
  input: ResultadoMobilizacaoInput,
  usuarioId: number,
  role: string,
): Promise<Mobilizacao> {
  const atual = await exigirMobilizacao(id, usuarioId);
  exigirGestao(atual, usuarioId, role);

  const jaRealizada = atual.status === 'realizada';
  const alcancavel = TRANSICOES_PERMITIDAS[atual.status as MobilizacaoStatus]?.includes('realizada');
  if (!jaRealizada && !alcancavel) {
    throw new AppError(`Não é possível mudar de "${atual.status}" para "realizada".`, 400);
  }

  await emTransacao(async (executor) => {
    const atualizada = await sql.registrarResultado(id, input, executor);
    if (!jaRealizada) {
      await registrarMobilizacaoRealizada(atualizada, usuarioId, executor);
    }

    for (const [index, url] of (input.imagens ?? []).entries()) {
      await saveImagem(
        {
          tipo_entidade: 'mobilizacao',
          entidade_id: id,
          url,
          principal: index === 0,
          ordem: index,
        },
        executor,
      );
    }

    return atualizada;
  });

  return obterMobilizacao(id, usuarioId, role);
}

export async function participarDaMobilizacao(
  id: number,
  usuarioId: number,
): Promise<{ participando: boolean; cont_participantes: number }> {
  await exigirMobilizacao(id);
  const participando = await sql.participar(id, usuarioId);
  const cont_participantes = await sql.contarParticipantes(id);
  return { participando, cont_participantes };
}

export async function sairDaMobilizacao(
  id: number,
  usuarioId: number,
): Promise<{ participando: boolean; cont_participantes: number }> {
  await exigirMobilizacao(id);
  await sql.sair(id, usuarioId);
  const cont_participantes = await sql.contarParticipantes(id);
  return { participando: false, cont_participantes };
}
