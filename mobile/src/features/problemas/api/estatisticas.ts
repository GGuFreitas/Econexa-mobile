import { api } from '@services/api';
import { montarFiltro } from './params';
import type { ProblemaEstatisticas, ProblemaQuery } from '../types';

export async function obterEstatisticas(
  query: ProblemaQuery = {},
): Promise<ProblemaEstatisticas> {
  const response = await api.get<ProblemaEstatisticas>('/problemas/estatisticas', {
    params: montarFiltro(query),
  });
  return response.data;
}
