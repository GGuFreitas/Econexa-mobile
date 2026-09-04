import type { ProblemaQuery } from '../types';

export type QueryParams = Record<string, string | string[]>;

export function montarFiltro(query: ProblemaQuery): QueryParams {
  const params: QueryParams = {};
  if (query.lat != null) params.lat = String(query.lat);
  if (query.lng != null) params.lng = String(query.lng);
  if (query.raio != null) params.raio = String(query.raio);
  if (query.causaId != null) params.causaId = String(query.causaId);
  if (query.tags?.length) params.tags = query.tags;
  if (query.tipo) params.tipo = query.tipo;
  if (query.status) params.status = query.status;
  if (query.escopo) params.escopo = query.escopo;
  return params;
}

export function montarListagem(query: ProblemaQuery): QueryParams {
  const params = montarFiltro(query);
  if (query.pagina != null) params.pagina = String(query.pagina);
  if (query.limite != null) params.limite = String(query.limite);
  return params;
}
