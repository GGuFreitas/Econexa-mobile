import { api } from '@services/api';

export async function bloquearConta(usuarioId: number, motivo: string): Promise<void> {
  await api.post(`/moderacao/usuarios/${usuarioId}/bloqueio`, { motivo });
}
