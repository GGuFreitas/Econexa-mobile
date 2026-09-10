import { api } from '@services/api';
import { montarListagem } from './params';
import type { Problema, ProblemaQuery } from '../types';

export async function listarProblemas(query: ProblemaQuery = {}): Promise<Problema[]> {
  const response = await api.get<Problema[]>('/problemas', {
    params: montarListagem(query),
  });
  return response.data;
}
