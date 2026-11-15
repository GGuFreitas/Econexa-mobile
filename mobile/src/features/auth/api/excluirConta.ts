import { api } from '@services/api';

export type ExclusaoDeContaInput = { password?: string };

export async function excluirConta(payload: ExclusaoDeContaInput): Promise<void> {
  await api.delete('/auth/me', { data: payload });
}
