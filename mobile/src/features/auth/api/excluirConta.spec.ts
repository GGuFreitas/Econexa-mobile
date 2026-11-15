import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@services/api', () => ({
  api: { delete: vi.fn() },
}));

import { api } from '@services/api';
import { excluirConta } from './excluirConta';

describe('excluirConta api', () => {
  beforeEach(() => vi.clearAllMocks());

  it('faz DELETE /auth/me levando a senha no corpo', async () => {
    vi.mocked(api.delete).mockResolvedValue({ status: 204 });

    await excluirConta({ password: 'segredo' });

    expect(api.delete).toHaveBeenCalledWith('/auth/me', { data: { password: 'segredo' } });
  });
});
