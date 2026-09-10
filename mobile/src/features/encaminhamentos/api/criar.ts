import { api } from '@services/api';
import type { CriarEncaminhamentoPayload, Encaminhamento } from '../types';

export async function criarEncaminhamento(
  problemaId: number,
  payload: CriarEncaminhamentoPayload,
): Promise<Encaminhamento> {
  const response = await api.post<Encaminhamento>(
    `/problemas/${problemaId}/encaminhamentos`,
    payload,
  );
  return response.data;
}
