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

  it('posta no endpoint /problemas e diz que o registro é novo', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: { criado: true, problema: { id: 1, ...payload } },
    });

    const resultado = await criarProblema(payload);

    expect(api.post).toHaveBeenCalledWith('/problemas', payload);
    expect(resultado.criado).toBe(true);
    expect(resultado.problema.id).toBe(1);
  });

  it('distingue o registro parecido que o servidor devolveu no lugar de um novo', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: { criado: false, problema: { id: 99, ...payload, titulo: 'Buraco já registrado' } },
    });

    const resultado = await criarProblema(payload);

    expect(resultado.criado).toBe(false);
    expect(resultado.problema.id).toBe(99);
    expect(resultado.problema.titulo).toBe('Buraco já registrado');
  });
});
