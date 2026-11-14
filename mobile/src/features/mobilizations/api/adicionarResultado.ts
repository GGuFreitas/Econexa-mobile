import { api } from '@services/api';
import type { Mobilizacao } from '../types';

export async function adicionarResultadoMobilizacao(
  id: number,
  input: {
    descricao: string;
    metricas?: Record<string, number>;
    imagens?: string[];
  },
): Promise<Mobilizacao> {
  const response = await api.post<Mobilizacao>(`/mobilizacoes/${id}/resultado`, input);
  return response.data;
}
