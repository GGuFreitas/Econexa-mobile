import { api } from '@services/api';
import type { CriarProblemaPayload, Problema } from '../types';

export async function criarProblema(payload: CriarProblemaPayload): Promise<Problema> {
  const response = await api.post<Problema>('/problemas', payload);
  return response.data;
}
