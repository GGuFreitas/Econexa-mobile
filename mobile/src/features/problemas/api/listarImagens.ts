import { api } from '@services/api';
import type { ImagemProblema } from '../types';

export async function listarImagensProblema(problemaId: number): Promise<ImagemProblema[]> {
  const response = await api.get<ImagemProblema[]>(`/imagens/problema/${problemaId}`);
  return response.data;
}
