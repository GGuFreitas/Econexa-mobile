import { api } from '@services/api';
import type { ProblemaDenunciado } from '../types';

export async function listarProblemasDenunciados(): Promise<ProblemaDenunciado[]> {
  const response = await api.get<ProblemaDenunciado[]>('/moderacao/denuncias', {
    params: { limite: 50 },
  });
  return response.data;
}
