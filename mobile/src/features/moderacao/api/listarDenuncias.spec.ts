import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@services/api', () => ({
  api: { get: vi.fn() },
}));

import { api } from '@services/api';
import { listarProblemasDenunciados } from './listarDenuncias';

describe('listarProblemasDenunciados api', () => {
  beforeEach(() => vi.clearAllMocks());

  it('faz GET /moderacao/denuncias pedindo até 50 itens', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    await expect(listarProblemasDenunciados()).resolves.toEqual([]);
    expect(api.get).toHaveBeenCalledWith('/moderacao/denuncias', { params: { limite: 50 } });
  });
});
