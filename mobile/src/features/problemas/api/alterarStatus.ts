import { api } from '@services/api';
import type { ProblemaDetalhe, ProblemaStatus } from '../types';

export async function alterarStatusProblema(
  problemaId: number,
  status: ProblemaStatus,
): Promise<ProblemaDetalhe> {
  const response = await api.patch<ProblemaDetalhe>(`/problemas/${problemaId}/status`, { status });
  return response.data;
}
