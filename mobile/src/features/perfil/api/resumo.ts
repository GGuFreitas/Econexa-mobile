import { api } from '@services/api';
import type { ResumoDoUsuario } from '../types';

export async function obterResumo(): Promise<ResumoDoUsuario> {
  const response = await api.get<ResumoDoUsuario>('/me/resumo');
  return response.data;
}
