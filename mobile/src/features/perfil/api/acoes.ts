import { api } from '@services/api';
import type { AcaoDoUsuario } from '../types';

export async function listarAcoes(limite = 30): Promise<AcaoDoUsuario[]> {
  const response = await api.get<AcaoDoUsuario[]>('/me/acoes', {
    params: { limite: String(limite) },
  });
  return response.data;
}
