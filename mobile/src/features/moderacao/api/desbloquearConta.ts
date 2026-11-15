import { api } from '@services/api';

export async function desbloquearConta(usuarioId: number): Promise<void> {
  await api.delete(`/moderacao/usuarios/${usuarioId}/bloqueio`);
}
