import { api } from '@services/api';
import type { SessaoDaApi } from '@shared/sessao/contrato';

export type LoginInput = { email: string; password: string };

export type LoginResponse = SessaoDaApi & { message: string };

export async function login(payload: LoginInput): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>('/auth/login', payload);
  return response.data;
}
