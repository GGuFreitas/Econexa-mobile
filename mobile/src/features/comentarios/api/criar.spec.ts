import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@services/api', () => ({
  api: { post: vi.fn() },
}));

import { api } from '@services/api';
import { criarComentario } from './criar';

describe('criarComentario', () => {
  beforeEach(() => vi.clearAllMocks());

  it('posta o conteúdo em /problemas/:id/comentarios', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: {
        id: 9,
        problema_id: 3,
        conteudo: 'Passei lá hoje.',
        criado_em: '2026-09-03T10:00:00.000Z',
        autor: { id: 5, nome: 'Ana' },
        pode_excluir: true,
      },
    });

    const comentario = await criarComentario({ problemaId: 3, conteudo: 'Passei lá hoje.' });

    expect(api.post).toHaveBeenCalledWith('/problemas/3/comentarios', {
      conteudo: 'Passei lá hoje.',
    });
    expect(comentario.id).toBe(9);
  });

  it('propaga a mensagem de erro da API', async () => {
    vi.mocked(api.post).mockRejectedValue(new Error('Problema não encontrado.'));

    await expect(criarComentario({ problemaId: 404, conteudo: 'oi' })).rejects.toThrow(
      'Problema não encontrado.',
    );
  });
});
