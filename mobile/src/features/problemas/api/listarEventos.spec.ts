import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@services/api', () => ({
  api: { get: vi.fn() },
}));

import { api } from '@services/api';
import { listarEventosProblema } from './listarEventos';

describe('listarEventosProblema', () => {
  beforeEach(() => vi.clearAllMocks());

  it('busca em /problemas/:id/eventos e devolve a lista do servidor', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: [
        {
          id: 9,
          problema_id: 3,
          tipo: 'ENCAMINHADO',
          dados: { orgao_nome: 'Secretaria de Obras' },
          criado_em: '2026-09-03T10:00:00.000Z',
          autor: { id: 5, nome: 'Ana' },
        },
      ],
    });

    const eventos = await listarEventosProblema(3);

    expect(api.get).toHaveBeenCalledWith('/problemas/3/eventos', { params: { limite: '50' } });
    expect(eventos).toHaveLength(1);
    expect(eventos[0].tipo).toBe('ENCAMINHADO');
  });

  it('devolve lista vazia quando o problema não tem eventos', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    expect(await listarEventosProblema(3, 10)).toEqual([]);
    expect(api.get).toHaveBeenCalledWith('/problemas/3/eventos', { params: { limite: '10' } });
  });
});
