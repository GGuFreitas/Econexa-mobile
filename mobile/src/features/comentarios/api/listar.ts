import { api } from '@services/api';
import type { Comentario, ComentarioQuery } from '../types';

function montarQueryString(query: ComentarioQuery): Record<string, string> {
  const params: Record<string, string> = {};
  if (query.pagina != null) params.pagina = String(query.pagina);
  if (query.limite != null) params.limite = String(query.limite);
  return params;
}

export async function listarComentarios(query: ComentarioQuery): Promise<Comentario[]> {
  const response = await api.get<Comentario[]>(`/problemas/${query.problemaId}/comentarios`, {
    params: montarQueryString(query),
  });
  return response.data;
}
