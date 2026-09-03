import { beforeEach, describe, expect, it, vi } from 'vitest';
import { dbPool } from '@config/database.js';
import { criarComentario, excluirComentario, listarComentarios } from './comentarios.handler.js';

vi.mock('@config/database.js', () => ({
  dbPool: { query: vi.fn() },
}));

const mockQuery = dbPool.query as unknown as ReturnType<typeof vi.fn>;

describe('comentarios handlers', () => {
  beforeEach(() => mockQuery.mockReset());

  it('lista comentários de um problema com autor e paginação', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 1 }] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 7,
            problema_id: 1,
            usuario_id: 3,
            conteudo: 'Isso piorou depois da chuva.',
            criado_em: '2026-09-01T10:00:00.000Z',
            autor_nome: 'Ana',
          },
        ],
      });

    const comentarios = await listarComentarios({ problemaId: 1, limite: 10, pagina: 2 });

    expect(comentarios).toHaveLength(1);
    expect(comentarios[0].autor).toEqual({ id: 3, nome: 'Ana' });
    expect(mockQuery.mock.calls[1][0]).toContain('FROM problema_comentarios');
    expect(mockQuery.mock.calls[1][1]).toEqual([1, 10, 10]);
  });

  it('lista vazia quando o problema ainda não tem comentários', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] }).mockResolvedValueOnce({ rows: [] });

    const comentarios = await listarComentarios({ problemaId: 1 });

    expect(comentarios).toEqual([]);
  });

  it('marca pode_excluir apenas para os comentários do usuário autenticado', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] }).mockResolvedValueOnce({
      rows: [
        { id: 7, problema_id: 1, usuario_id: 3, conteudo: 'meu', criado_em: 'x', autor_nome: 'Ana' },
        { id: 8, problema_id: 1, usuario_id: 9, conteudo: 'de outro', criado_em: 'x', autor_nome: 'Bia' },
      ],
    });

    const comentarios = await listarComentarios({ problemaId: 1, usuarioId: 3 });

    expect(comentarios[0].pode_excluir).toBe(true);
    expect(comentarios[1].pode_excluir).toBe(false);
  });

  it('não marca pode_excluir quando ninguém está autenticado', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] }).mockResolvedValueOnce({
      rows: [{ id: 7, problema_id: 1, usuario_id: 3, conteudo: 'oi', criado_em: 'x', autor_nome: 'Ana' }],
    });

    const comentarios = await listarComentarios({ problemaId: 1 });

    expect(comentarios[0].pode_excluir).toBe(false);
  });

  it('cria comentário para problema existente removendo espaços das pontas', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] }).mockResolvedValueOnce({
      rows: [
        {
          id: 20,
          problema_id: 1,
          usuario_id: 3,
          conteudo: 'Passei lá hoje.',
          criado_em: 'x',
          autor_nome: 'Ana',
        },
      ],
    });

    const comentario = await criarComentario({
      problemaId: 1,
      usuarioId: 3,
      conteudo: '   Passei lá hoje.   ',
    });

    expect(comentario.id).toBe(20);
    expect(comentario.pode_excluir).toBe(true);
    expect(mockQuery.mock.calls[1][0]).toContain('INSERT INTO problema_comentarios');
    expect(mockQuery.mock.calls[1][1]).toEqual([1, 3, 'Passei lá hoje.']);
  });

  it('rejeita comentário vazio antes de tocar no banco', async () => {
    await expect(
      criarComentario({ problemaId: 1, usuarioId: 3, conteudo: '    ' }),
    ).rejects.toThrow('Escreva um comentário.');
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('rejeita comentário em problema inexistente', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await expect(
      criarComentario({ problemaId: 999, usuarioId: 3, conteudo: 'oi' }),
    ).rejects.toThrow('Problema não encontrado.');
  });

  it('exclui o próprio comentário', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 7, problema_id: 1, usuario_id: 3 }] })
      .mockResolvedValueOnce({ rows: [{ id: 7 }] });

    const resultado = await excluirComentario({ comentarioId: 7, problemaId: 1, usuarioId: 3 });

    expect(resultado.excluido).toBe(true);
    expect(mockQuery.mock.calls[1][0]).toContain('DELETE FROM problema_comentarios');
  });

  it('impede que outro usuário exclua comentário alheio', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 7, problema_id: 1, usuario_id: 3 }] });

    await expect(
      excluirComentario({ comentarioId: 7, problemaId: 1, usuarioId: 99 }),
    ).rejects.toThrow('Você só pode excluir os seus próprios comentários.');
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it('retorna 404 ao excluir comentário de outro problema', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 7, problema_id: 2, usuario_id: 3 }] });

    await expect(
      excluirComentario({ comentarioId: 7, problemaId: 1, usuarioId: 3 }),
    ).rejects.toThrow('Comentário não encontrado.');
  });

  it('retorna 404 ao excluir comentário inexistente', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await expect(
      excluirComentario({ comentarioId: 404, problemaId: 1, usuarioId: 3 }),
    ).rejects.toThrow('Comentário não encontrado.');
  });
});
