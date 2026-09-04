import { api } from '@services/api';
import type { ExclusaoComentarioResultado, ExcluirComentarioPayload } from '../types';

export async function excluirComentario(
  payload: ExcluirComentarioPayload,
): Promise<ExclusaoComentarioResultado> {
  const response = await api.delete<ExclusaoComentarioResultado>(
    `/problemas/${payload.problemaId}/comentarios/${payload.comentarioId}`,
  );
  return response.data;
}
