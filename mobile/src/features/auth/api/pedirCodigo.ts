import { api } from '@services/api';

export type PedidoDeCodigoResponse = { message: string };

export async function pedirCodigoDeRedefinicao(email: string): Promise<PedidoDeCodigoResponse> {
  const response = await api.post<PedidoDeCodigoResponse>('/auth/forgot-password', { email });
  return response.data;
}
