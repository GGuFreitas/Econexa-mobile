import { api } from '@services/api';
import type { CriarProblemaPayload, ResultadoCriacaoProblema } from '../types';

export async function criarProblema(
  payload: CriarProblemaPayload,
): Promise<ResultadoCriacaoProblema> {
  const response = await api.post<ResultadoCriacaoProblema>('/problemas', payload);
  return response.data;
}
