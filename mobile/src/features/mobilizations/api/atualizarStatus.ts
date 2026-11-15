import { api } from '@services/api';
import type { Mobilizacao } from '../types';

export async function atualizarStatusMobilizacao(
  id: number,
  status: 'agendada' | 'em_andamento' | 'realizada' | 'cancelada',
): Promise<Mobilizacao> {
  const response = await api.patch<Mobilizacao>(`/mobilizacoes/${id}/status`, { status });
  return response.data;
}
