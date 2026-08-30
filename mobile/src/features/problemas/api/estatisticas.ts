import { api } from '@services/api';
import type { ProblemaEstatisticas, ProblemaQuery } from '../types';

function montarQueryString(query: ProblemaQuery): Record<string, string> {
  const params: Record<string, string> = {};
  if (query.lat != null) params.lat = String(query.lat);
  if (query.lng != null) params.lng = String(query.lng);
  if (query.raio != null) params.raio = String(query.raio);
  if (query.causaId != null) params.causaId = String(query.causaId);
  if (query.tipo) params.tipo = query.tipo;
  if (query.status) params.status = query.status;
  if (query.escopo) params.escopo = query.escopo;
  return params;
}

export async function obterEstatisticas(
  query: ProblemaQuery = {},
): Promise<ProblemaEstatisticas> {
  const response = await api.get<ProblemaEstatisticas>('/problemas/estatisticas', {
    params: montarQueryString(query),
  });
  return response.data;
}
