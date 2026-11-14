import { api } from '@services/api';
import type { SessaoDaApi } from '@shared/sessao/contrato';
import type { AvisoDoGoogle } from '../utils/google';

export type GoogleResponse = SessaoDaApi & { aviso?: AvisoDoGoogle };

export async function entrarComGoogle(idToken: string): Promise<GoogleResponse> {
  const response = await api.post<GoogleResponse>('/auth/google', { idToken });
  return response.data;
}
