import { api } from '@services/api';
import type { Orgao } from '../types';

export async function listarOrgaos(): Promise<Orgao[]> {
  const response = await api.get<Orgao[]>('/orgaos');
  return response.data;
}
