import { api } from '@services/api';
import type { ApoioResultado } from '../types';

export async function desapoiarProblema(id: number): Promise<ApoioResultado> {
  const response = await api.delete<ApoioResultado>(`/problemas/${id}/apoios`);
  return response.data;
}
