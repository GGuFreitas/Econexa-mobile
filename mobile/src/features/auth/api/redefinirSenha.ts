import { api } from '@services/api';
import type { SessaoDaApi } from '@shared/sessao/contrato';

export type RedefinirSenhaInput = {
  email: string;
  code: string;
  password: string;
};

export async function redefinirSenha(payload: RedefinirSenhaInput): Promise<SessaoDaApi> {
  const response = await api.post<SessaoDaApi>('/auth/reset-password', payload);
  return response.data;
}
