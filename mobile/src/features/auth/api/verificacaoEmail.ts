import { api } from '@services/api';

export type ReenvioDeVerificacaoResponse = { message: string };

export async function reenviarVerificacao(): Promise<ReenvioDeVerificacaoResponse> {
  const response = await api.post<ReenvioDeVerificacaoResponse>('/auth/resend-verification');
  return response.data;
}
