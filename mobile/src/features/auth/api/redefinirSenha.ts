import { api } from '@services/api';
import type { SessaoDaApi } from '@shared/sessao/contrato';

export type PedidoDeCodigoResponse = { message: string };

export async function pedirCodigoDeRedefinicao(email: string): Promise<PedidoDeCodigoResponse> {
  const response = await api.post<PedidoDeCodigoResponse>('/auth/forgot-password', { email });
  return response.data;
}

export type RedefinirSenhaInput = {
  email: string;
  code: string;
  password: string;
};

export async function redefinirSenha(payload: RedefinirSenhaInput): Promise<SessaoDaApi> {
  const response = await api.post<SessaoDaApi>('/auth/reset-password', payload);
  return response.data;
}
