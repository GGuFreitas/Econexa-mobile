import { AppError } from '@shared/errors.js';
import { emTransacao } from '@shared/transacao.js';
import { registrarEvento } from '@common/problemaEventos/problemaEventos.handler.js';
import * as sql from './comentarios.sql.js';
import type {
  Comentario,
  ComentarioRow,
  CriarComentarioInput,
  ExcluirComentarioInput,
  ListarComentariosQuery,
} from './comentarios.types.js';

function apresentar(row: ComentarioRow, usuarioId?: number): Comentario {
  return {
    id: row.id,
    problema_id: row.problema_id,
    conteudo: row.conteudo,
    criado_em: row.criado_em,
    autor: { id: row.usuario_id, nome: row.autor_nome },
    pode_excluir: usuarioId != null && usuarioId === row.usuario_id,
  };
}

export async function listarComentarios(query: ListarComentariosQuery): Promise<Comentario[]> {
  const existe = await sql.problemaExiste(query.problemaId);
  if (!existe) {
    throw new AppError('Problema não encontrado.', 404);
  }

  const rows = await sql.listarComentarios(query);
  return rows.map((row) => apresentar(row, query.usuarioId));
}

export async function criarComentario(input: CriarComentarioInput): Promise<Comentario> {
  const conteudo = input.conteudo?.trim();
  if (!conteudo) {
    throw new AppError('Escreva um comentário.', 400);
  }

  const existe = await sql.problemaExiste(input.problemaId);
  if (!existe) {
    throw new AppError('Problema não encontrado.', 404);
  }

  return emTransacao(async (executor) => {
    const row = await sql.inserirComentario({ ...input, conteudo }, executor);

    await registrarEvento(
      {
        problemaId: input.problemaId,
        tipo: 'COMENTARIO_CRIADO',
        usuarioId: input.usuarioId,
        dados: { comentario_id: row.id, trecho: conteudo.slice(0, 140) },
      },
      executor,
    );

    return apresentar(row, input.usuarioId);
  });
}

export async function excluirComentario(
  input: ExcluirComentarioInput,
): Promise<{ excluido: boolean }> {
  const comentario = await sql.getComentarioById(input.comentarioId);
  if (!comentario || comentario.problema_id !== input.problemaId) {
    throw new AppError('Comentário não encontrado.', 404);
  }
  if (comentario.usuario_id !== input.usuarioId) {
    throw new AppError('Você só pode excluir os seus próprios comentários.', 403);
  }

  await sql.removerComentario(input.comentarioId);
  return { excluido: true };
}
