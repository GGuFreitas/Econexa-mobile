import { api } from '@services/api';
import type { ProblemaListado } from '@features/problemas/types';

export async function listarApoiados(limite = 30): Promise<ProblemaListado[]> {
  const response = await api.get<ProblemaListado[]>('/me/apoiados', {
    params: { limite: String(limite) },
  });
  return response.data;
}
