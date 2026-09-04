import { api } from '@services/api';
import type { ProblemaEvento } from '../types';

export async function listarEventosProblema(
  problemaId: number,
  limite = 50,
): Promise<ProblemaEvento[]> {
  const response = await api.get<ProblemaEvento[]>(`/problemas/${problemaId}/eventos`, {
    params: { limite: String(limite) },
  });
  return response.data;
}
