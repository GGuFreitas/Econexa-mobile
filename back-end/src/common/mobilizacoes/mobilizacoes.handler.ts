import { AppError } from '@shared/errors.js';
import { saveImagem } from '@common/imagens/imagens.handler.js';
import * as sql from './mobilizacoes.sql.js';
import type {
  AtualizarMobilizacaoInput,
  CriarMobilizacaoInput,
  ListarMobilizacoesQuery,
  Mobilizacao,
  MobilizacaoStatus,
  ResultadoMobilizacaoInput,
} from './mobilizacoes.types.js';

const TRANSICOES_PERMITIDAS: Record<MobilizacaoStatus, MobilizacaoStatus[]> = {
  agendada: ['em_andamento', 'cancelada'],
  em_andamento: ['realizada', 'cancelada'],
  realizada: [],
  cancelada: [],
};

async function comContadores(mobilizacao: Mobilizacao): Promise<Mobilizacao> {
  const cont_participantes = await sql.contarParticipantes(mobilizacao.id);
  return { ...mobilizacao, cont_participantes };
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

  return sql.insertMobilizacao(input);
}

export async function listarMobilizacoes(query: ListarMobilizacoesQuery): Promise<Mobilizacao[]> {
  return sql.listarMobilizacoes(query);
}

export async function obterMobilizacao(id: number): Promise<Mobilizacao> {
  const mobilizacao = await sql.getMobilizacaoById(id);
  if (!mobilizacao) {
    throw new AppError('Mobilização não encontrada.', 404);
  }
  return comContadores(mobilizacao);
}

async function exigirMobilizacao(id: number): Promise<Mobilizacao> {
  const mobilizacao = await sql.getMobilizacaoById(id);
  if (!mobilizacao) {
    throw new AppError('Mobilização não encontrada.', 404);
  }
  return mobilizacao;
}

export async function atualizarMobilizacao(
  id: number,
  input: AtualizarMobilizacaoInput,
): Promise<Mobilizacao> {
  await exigirMobilizacao(id);
  const mobilizacao = await sql.updateMobilizacao(id, input);
  return comContadores(mobilizacao);
}

export async function atualizarStatusMobilizacao(
  id: number,
  status: MobilizacaoStatus,
): Promise<Mobilizacao> {
  const atual = await exigirMobilizacao(id);
  const permitido = TRANSICOES_PERMITIDAS[atual.status as MobilizacaoStatus]?.includes(status);
  if (!permitido) {
    throw new AppError(`Não é possível mudar de "${atual.status}" para "${status}".`, 400);
  }
  const mobilizacao = await sql.updateStatus(id, status);
  return comContadores(mobilizacao);
}

export async function registrarResultadoMobilizacao(
  id: number,
  input: ResultadoMobilizacaoInput,
): Promise<Mobilizacao> {
  await exigirMobilizacao(id);
  const mobilizacao = await sql.registrarResultado(id, input);

  if (input.imagens?.length) {
    for (const [index, url] of input.imagens.entries()) {
      await saveImagem({
        tipo_entidade: 'mobilizacao',
        entidade_id: id,
        url,
        principal: index === 0,
        ordem: index,
      });
    }
  }

  return comContadores(mobilizacao);
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
