import { api } from '@services/api';
import type { Encaminhamento } from '../types';

export async function reenviarEncaminhamento(
  problemaId: number,
  encaminhamentoId: number,
): Promise<Encaminhamento> {
  const response = await api.post<Encaminhamento>(
    `/problemas/${problemaId}/encaminhamentos/${encaminhamentoId}/reenviar`,
  );
  return response.data;
}
