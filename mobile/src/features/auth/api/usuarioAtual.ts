import { api } from '@services/api';
import type { ApiUser } from '@shared/sessao/contrato';

export async function buscarUsuarioAtual(): Promise<ApiUser> {
  const response = await api.get<{ user: ApiUser }>('/auth/me');
  return response.data.user;
}
