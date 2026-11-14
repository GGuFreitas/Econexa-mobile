import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@services/api', () => ({
  api: { delete: vi.fn() },
}));

import { api } from '@services/api';
import { desapoiarProblema } from './desapoiar';

describe('desapoiar api', () => {
  beforeEach(() => vi.clearAllMocks());

  it('desapoiar faz DELETE /problemas/:id/apoios', async () => {
    vi.mocked(api.delete).mockResolvedValue({ data: { apoiado: false, cont_apoios: 4, cont_apoios_ponderados: 4 } });
    const r = await desapoiarProblema(7);
    expect(api.delete).toHaveBeenCalledWith('/problemas/7/apoios');
    expect(r.apoiado).toBe(false);
  });
});
