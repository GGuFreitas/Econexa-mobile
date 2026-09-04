import { api } from '@services/api';
import type { Encaminhamento, RegistrarRespostaPayload } from '../types';

export async function registrarResposta(
  problemaId: number,
  payload: RegistrarRespostaPayload,
): Promise<Encaminhamento> {
  const response = await api.post<Encaminhamento>(
    `/problemas/${problemaId}/encaminhamentos/${payload.encaminhamentoId}/resposta`,
    { resposta: payload.resposta, protocolo: payload.protocolo },
  );
  return response.data;
}
