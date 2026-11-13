import { api } from '@services/api';
import type { Mobilizacao } from '../types';

export async function buscarMobilizacao(id: number): Promise<Mobilizacao> {
  const response = await api.get<Mobilizacao>(`/mobilizacoes/${id}`);
  return response.data;
}
