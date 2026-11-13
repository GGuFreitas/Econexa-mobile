import { api } from '@services/api';
import type { Mobilizacao, MobilizacaoQuery } from '../types';

function montarParams(query: MobilizacaoQuery): Record<string, string> {
  const params: Record<string, string> = {};
  params.problemaId = String(query.problemaId);
  if (query.pagina) params.pagina = String(query.pagina);
  if (query.limite) params.limite = String(query.limite);
  return params;
}

export async function listarMobilizacoes(query: MobilizacaoQuery): Promise<Mobilizacao[]> {
  const response = await api.get<Mobilizacao[]>('/mobilizacoes', { params: montarParams(query) });
  return response.data;
}
