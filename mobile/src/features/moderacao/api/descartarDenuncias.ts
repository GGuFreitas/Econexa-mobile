import { api } from '@services/api';

export async function descartarDenuncias(problemaId: number): Promise<void> {
  await api.delete(`/moderacao/denuncias/${problemaId}`);
}
