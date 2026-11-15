import { api } from '@services/api';

export async function participarMobilizacao(id: number): Promise<{ participando: boolean; cont_participantes: number }> {
  const response = await api.post<{ participando: boolean; cont_participantes: number }>(`/mobilizacoes/${id}/participar`);
  return response.data;
}
