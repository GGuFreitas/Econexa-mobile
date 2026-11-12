import { api } from '@services/api';
import type { SessaoDaApi } from '@shared/sessao/contrato';

export type RegisterInput = {
  nome: string;
  email: string;
  password: string;
};

export type RegisterResponse = SessaoDaApi & { message: string };

export async function register(payload: RegisterInput): Promise<RegisterResponse> {
  const response = await api.post<RegisterResponse>('/auth/register', payload);
  return response.data;
}
