import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@services/api', () => ({
  api: { post: vi.fn() },
}));

import { api } from '@services/api';
import { bloquearConta } from './bloquearConta';

describe('bloquearConta api', () => {
  beforeEach(() => vi.clearAllMocks());

  it('faz POST /moderacao/usuarios/:id/bloqueio com o motivo', async () => {
    vi.mocked(api.post).mockResolvedValue({ status: 204 });

    await bloquearConta(9, 'Publicidade repetida');

    expect(api.post).toHaveBeenCalledWith('/moderacao/usuarios/9/bloqueio', {
      motivo: 'Publicidade repetida',
    });
  });
});
