import { api } from '@services/api';
import type { Problema, ProblemaQuery } from '../types';

function montarQueryString(query: ProblemaQuery): Record<string, string> {
  const params: Record<string, string> = {};
  if (query.lat != null) params.lat = String(query.lat);
  if (query.lng != null) params.lng = String(query.lng);
  if (query.raio != null) params.raio = String(query.raio);
  if (query.causaId != null) params.causaId = String(query.causaId);
  if (query.tags?.length) params.tags = query.tags.join(',');
  if (query.tipo) params.tipo = query.tipo;
  if (query.status) params.status = query.status;
  if (query.escopo) params.escopo = query.escopo;
  if (query.pagina != null) params.pagina = String(query.pagina);
  if (query.limite != null) params.limite = String(query.limite);
  return params;
}

export async function listarProblemas(query: ProblemaQuery = {}): Promise<Problema[]> {
  const response = await api.get<Problema[]>('/problemas', {
    params: montarQueryString(query),
  });
  return response.data;
}
