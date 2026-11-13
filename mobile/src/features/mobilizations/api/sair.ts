import { api } from '@services/api';

export async function sairMobilizacao(id: number): Promise<{ participando: boolean; cont_participantes: number }> {
  const response = await api.delete<{ participando: boolean; cont_participantes: number }>(`/mobilizacoes/${id}/participar`);
  return response.data;
}
