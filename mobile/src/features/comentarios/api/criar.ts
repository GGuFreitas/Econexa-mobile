import { api } from '@services/api';
import type { Comentario, CriarComentarioPayload } from '../types';

export async function criarComentario(payload: CriarComentarioPayload): Promise<Comentario> {
  const response = await api.post<Comentario>(`/problemas/${payload.problemaId}/comentarios`, {
    conteudo: payload.conteudo,
  });
  return response.data;
}
