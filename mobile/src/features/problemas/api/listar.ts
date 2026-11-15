import { api } from '@services/api';
import { montarListagem } from './params';
import type { ProblemaListado, ProblemaQuery } from '../types';

export async function listarProblemas(query: ProblemaQuery = {}): Promise<ProblemaListado[]> {
  const response = await api.get<ProblemaListado[]>('/problemas', {
    params: montarListagem(query),
  });
  return response.data;
}
