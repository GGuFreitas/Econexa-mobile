import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@services/api', () => ({
  api: { post: vi.fn(), delete: vi.fn() },
}));

import { api } from '@services/api';
import { apoiarProblema, desapoiarProblema } from './apoios';

describe('apoios api', () => {
  beforeEach(() => vi.clearAllMocks());

  it('apoiar faz POST /problemas/:id/apoios', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { apoiado: true, cont_apoios: 5, cont_apoios_ponderados: 5 } });
    const r = await apoiarProblema(7);
    expect(api.post).toHaveBeenCalledWith('/problemas/7/apoios');
    expect(r.cont_apoios).toBe(5);
  });

  it('desapoiar faz DELETE /problemas/:id/apoios', async () => {
    vi.mocked(api.delete).mockResolvedValue({ data: { apoiado: false, cont_apoios: 4, cont_apoios_ponderados: 4 } });
    const r = await desapoiarProblema(7);
    expect(api.delete).toHaveBeenCalledWith('/problemas/7/apoios');
    expect(r.apoiado).toBe(false);
  });
});
