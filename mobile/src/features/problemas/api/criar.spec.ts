import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@services/api', () => ({
  api: { post: vi.fn(), delete: vi.fn() },
}));

import { api } from '@services/api';
import { criarProblema } from './criar';
import type { CriarProblemaPayload } from '../types';

const payload: CriarProblemaPayload = {
  titulo: 'Buraco na rua',
  causaId: 2,
  tipo: 'problema',
  escopo: 'local',
  lat: -23.55,
  lng: -46.63,
};

describe('criarProblema', () => {
  beforeEach(() => vi.clearAllMocks());

  it('posta no endpoint /problemas e retorna o problema', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { id: 1, ...payload } });
    const resultado = await criarProblema(payload);
    expect(api.post).toHaveBeenCalledWith('/problemas', payload);
    expect(resultado.id).toBe(1);
  });
});
