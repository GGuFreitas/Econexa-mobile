import { AppError } from '@shared/errors.js';
import * as sql from './eventos.sql.js';
import type {
  CriarEventoInput,
  Evento,
  ListarEventosQuery,
  VincularProblemaInput,
} from './eventos.types.js';

export async function criarEvento(input: CriarEventoInput): Promise<Evento> {
  if (!input.titulo?.trim()) {
    throw new AppError('Título obrigatório.', 400);
  }
  if (!input.dataInicio) {
    throw new AppError('Data de início obrigatória.', 400);
  }

  return sql.insertEvento({
    usuarioId: input.usuarioId,
    titulo: input.titulo,
    descricao: input.descricao,
    causaId: input.causaId,
    tipo: input.tipo,
    lat: input.lat,
    lng: input.lng,
    dataInicio: input.dataInicio,
    dataFim: input.dataFim,
  });
}

export async function listarEventos(query: ListarEventosQuery): Promise<Evento[]> {
  return sql.listarEventos(query);
}

export async function obterEvento(id: number): Promise<Evento> {
  const evento = await sql.getEventoById(id);
  if (!evento) {
    throw new AppError('Evento não encontrado.', 404);
  }
  return evento;
}

export async function vincularProblema(input: VincularProblemaInput): Promise<void> {
  const evento = await sql.getEventoById(input.eventoId);
  if (!evento) {
    throw new AppError('Evento não encontrado.', 404);
  }
  await sql.vincularProblema(input);
}

export async function inscreverEmEvento(
  eventoId: number,
  usuarioId: number,
): Promise<{ inscrito: boolean; cont_participantes: number }> {
  const evento = await sql.getEventoById(eventoId);
  if (!evento) {
    throw new AppError('Evento não encontrado.', 404);
  }
  const inscrito = await sql.inscrever(eventoId, usuarioId);
  const cont_participantes = await sql.contarParticipantes(eventoId);
  return { inscrito, cont_participantes };
}

export async function desinscreverDeEvento(
  eventoId: number,
  usuarioId: number,
): Promise<{ inscrito: boolean; cont_participantes: number }> {
  const evento = await sql.getEventoById(eventoId);
  if (!evento) {
    throw new AppError('Evento não encontrado.', 404);
  }
  await sql.desinscrever(eventoId, usuarioId);
  const cont_participantes = await sql.contarParticipantes(eventoId);
  return { inscrito: false, cont_participantes };
}

export async function estatisticasEvento(eventoId: number): Promise<{
  cont_participantes: number;
  problemas_vinculados: number;
}> {
  const [cont_participantes, problemas_vinculados] = await Promise.all([
    sql.contarParticipantes(eventoId),
    sql.contarProblemasVinculados(eventoId),
  ]);
  return { cont_participantes, problemas_vinculados };
}
