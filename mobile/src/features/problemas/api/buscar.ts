import { api } from '@services/api';
import type { Problema } from '../types';

export async function buscarProblema(id: number): Promise<Problema> {
  const response = await api.get<Problema>(`/problemas/${id}`);
  return response.data;
}
