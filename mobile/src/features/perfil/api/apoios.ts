import { api } from '@services/api';

export async function listarIdsApoiados(): Promise<number[]> {
  const response = await api.get<number[]>('/me/apoios');
  return response.data;
}
