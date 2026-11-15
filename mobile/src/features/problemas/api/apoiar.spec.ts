import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@services/api', () => ({
  api: { post: vi.fn() },
}));

import { api } from '@services/api';
import { apoiarProblema } from './apoiar';

describe('apoiar api', () => {
  beforeEach(() => vi.clearAllMocks());

  it('apoiar faz POST /problemas/:id/apoios', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { apoiado: true, cont_apoios: 5, cont_apoios_ponderados: 5 } });
    const r = await apoiarProblema(7);
    expect(api.post).toHaveBeenCalledWith('/problemas/7/apoios');
    expect(r.cont_apoios).toBe(5);
  });
});
