import { api } from '@services/api';
import type { DenunciaMotivo } from '../types';

export async function criarDenuncia(
  id: number,
  motivo: DenunciaMotivo,
): Promise<{ id: number; problemaId: number; usuarioId: number; motivo: DenunciaMotivo }> {
  const response = await api.post(`/problemas/${id}/denuncias`, { motivo });
  return response.data;
}
