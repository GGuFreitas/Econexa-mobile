import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@services/api', () => ({
  api: { delete: vi.fn() },
}));

import { api } from '@services/api';
import { excluirComentario } from './excluir';

describe('excluirComentario', () => {
  beforeEach(() => vi.clearAllMocks());

  it('chama DELETE /problemas/:id/comentarios/:comentarioId', async () => {
    vi.mocked(api.delete).mockResolvedValue({ data: { excluido: true } });

    const resultado = await excluirComentario({ problemaId: 3, comentarioId: 9 });

    expect(api.delete).toHaveBeenCalledWith('/problemas/3/comentarios/9');
    expect(resultado.excluido).toBe(true);
  });

  it('propaga a recusa do servidor ao excluir comentário de outro usuário', async () => {
    vi.mocked(api.delete).mockRejectedValue(
      new Error('Você só pode excluir os seus próprios comentários.'),
    );

    await expect(excluirComentario({ problemaId: 3, comentarioId: 9 })).rejects.toThrow(
      'Você só pode excluir os seus próprios comentários.',
    );
  });
});
