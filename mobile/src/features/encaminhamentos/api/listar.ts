import { api } from '@services/api';
import type { Encaminhamento } from '../types';

export async function listarEncaminhamentos(problemaId: number): Promise<Encaminhamento[]> {
  const response = await api.get<Encaminhamento[]>(`/problemas/${problemaId}/encaminhamentos`);
  return response.data;
}
