import { api } from '@services/api';
import type { Mobilizacao } from '../types';

export async function atualizarMobilizacao(
  id: number,
  input: {
    titulo?: string;
    descricao?: string;
    dataInicio?: string;
    dataFim?: string;
    localNome?: string;
    lat?: number;
    lng?: number;
  },
): Promise<Mobilizacao> {
  const response = await api.patch<Mobilizacao>(`/mobilizacoes/${id}`, input);
  return response.data;
}
