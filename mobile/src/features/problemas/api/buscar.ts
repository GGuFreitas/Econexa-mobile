import { api } from '@services/api';
import type { ProblemaDetalhe } from '../types';

export async function buscarProblema(id: number): Promise<ProblemaDetalhe> {
  const response = await api.get<ProblemaDetalhe>(`/problemas/${id}`);
  return response.data;
}
