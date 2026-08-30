import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@services/api', () => ({
  api: { post: vi.fn() },
}));

import { api } from '@services/api';
import { criarDenuncia } from './denuncias';

describe('denuncias api', () => {
  beforeEach(() => vi.clearAllMocks());

  it('posta motivo em /problemas/:id/denuncias', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { id: 1, problemaId: 3, usuarioId: 1, motivo: 'spam' } });
    const r = await criarDenuncia(3, 'spam');
    expect(api.post).toHaveBeenCalledWith('/problemas/3/denuncias', { motivo: 'spam' });
    expect(r.motivo).toBe('spam');
  });
});
