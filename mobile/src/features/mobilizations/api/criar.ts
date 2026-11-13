import { api } from '@services/api';
import type { Mobilizacao } from '../types';

export async function criarMobilizacao(input: {
  problemaId: number;
  titulo: string;
  descricao?: string;
  dataInicio: string;
  dataFim?: string;
  localNome?: string;
  lat?: number;
  lng?: number;
}): Promise<Mobilizacao> {
  const response = await api.post<Mobilizacao>('/mobilizacoes', input);
  return response.data;
}
