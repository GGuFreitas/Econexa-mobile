import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@services/api', () => ({
  api: { get: vi.fn() },
}));

import { api } from '@services/api';
import { listarComentarios } from './listar';

describe('listarComentarios', () => {
  beforeEach(() => vi.clearAllMocks());

  it('busca em /problemas/:id/comentarios e devolve a lista', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: [
        {
          id: 1,
          problema_id: 3,
          conteudo: 'Continua alagando.',
          criado_em: '2026-09-01T10:00:00.000Z',
          autor: { id: 5, nome: 'Ana' },
          pode_excluir: true,
        },
      ],
    });

    const comentarios = await listarComentarios({ problemaId: 3, limite: 50 });

    expect(api.get).toHaveBeenCalledWith('/problemas/3/comentarios', { params: { limite: '50' } });
    expect(comentarios).toHaveLength(1);
    expect(comentarios[0].autor.nome).toBe('Ana');
  });

  it('devolve lista vazia quando o problema não tem comentários', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    const comentarios = await listarComentarios({ problemaId: 3 });

    expect(api.get).toHaveBeenCalledWith('/problemas/3/comentarios', { params: {} });
    expect(comentarios).toEqual([]);
  });
});
