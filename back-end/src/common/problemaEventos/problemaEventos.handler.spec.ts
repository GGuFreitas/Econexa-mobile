import { beforeEach, describe, expect, it, vi } from 'vitest';
import { dbPool } from '@config/database.js';
import { listarEventosProblema, registrarEvento } from './problemaEventos.handler.js';

vi.mock('@config/database.js', () => ({
  dbPool: { query: vi.fn() },
}));

const mockQuery = dbPool.query as unknown as ReturnType<typeof vi.fn>;

describe('eventos do problema', () => {
  beforeEach(() => mockQuery.mockReset());

  it('grava o evento com dados serializados em jsonb', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          problema_id: 4,
          tipo: 'COMENTARIO_CRIADO',
          usuario_id: 3,
          dados: { comentario_id: 9 },
          criado_em: '2026-09-03T10:00:00.000Z',
          autor_nome: 'Ana',
        },
      ],
    });

    const evento = await registrarEvento({
      problemaId: 4,
      tipo: 'COMENTARIO_CRIADO',
      usuarioId: 3,
      dados: { comentario_id: 9 },
    });

    expect(evento.autor).toEqual({ id: 3, nome: 'Ana' });
    expect(mockQuery.mock.calls[0][0]).toContain('INSERT INTO problema_eventos');
    expect(mockQuery.mock.calls[0][1]).toEqual([
      4,
      'COMENTARIO_CRIADO',
      3,
      JSON.stringify({ comentario_id: 9 }),
    ]);
  });

  it('aceita evento sem ator e devolve autor nulo', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          id: 2,
          problema_id: 4,
          tipo: 'EVIDENCIA_ADICIONADA',
          usuario_id: null,
          dados: null,
          criado_em: '2026-09-03T10:00:00.000Z',
          autor_nome: null,
        },
      ],
    });

    const evento = await registrarEvento({ problemaId: 4, tipo: 'EVIDENCIA_ADICIONADA' });

    expect(evento.autor).toBeNull();
    expect(evento.dados).toEqual({});
    expect(mockQuery.mock.calls[0][1]).toEqual([4, 'EVIDENCIA_ADICIONADA', null, '{}']);
  });

  it('usa o executor recebido para participar da transação da operação', async () => {
    const executorQuery = vi.fn().mockResolvedValue({
      rows: [{ id: 3, problema_id: 4, tipo: 'PROBLEMA_CRIADO', usuario_id: 1, dados: {}, criado_em: 'x', autor_nome: 'Ana' }],
    });

    await registrarEvento(
      { problemaId: 4, tipo: 'PROBLEMA_CRIADO', usuarioId: 1 },
      { query: executorQuery } as never,
    );

    expect(executorQuery).toHaveBeenCalledTimes(1);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('lista os eventos do problema ordenados pelo backend, do mais recente ao mais antigo', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 4 }] }).mockResolvedValueOnce({
      rows: [
        {
          id: 9,
          problema_id: 4,
          tipo: 'MOBILIZACAO_REALIZADA',
          usuario_id: 3,
          dados: { mobilizacao_id: 2 },
          criado_em: '2026-09-03T10:00:00.000Z',
          autor_nome: 'Ana',
        },
        {
          id: 1,
          problema_id: 4,
          tipo: 'PROBLEMA_CRIADO',
          usuario_id: 3,
          dados: { titulo: 'Alagamento' },
          criado_em: '2026-09-01T10:00:00.000Z',
          autor_nome: 'Ana',
        },
      ],
    });

    const eventos = await listarEventosProblema({ problemaId: 4, limite: 10, pagina: 2 });

    expect(eventos.map((evento) => evento.tipo)).toEqual([
      'MOBILIZACAO_REALIZADA',
      'PROBLEMA_CRIADO',
    ]);
    expect(mockQuery.mock.calls[1][0]).toContain('ORDER BY e.criado_em DESC, e.id DESC');
    expect(mockQuery.mock.calls[1][1]).toEqual([4, 10, 10]);
  });

  it('devolve lista vazia quando o problema ainda não tem eventos', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 4 }] }).mockResolvedValueOnce({ rows: [] });

    expect(await listarEventosProblema({ problemaId: 4 })).toEqual([]);
  });

  it('recusa listagem de eventos de problema inexistente', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await expect(listarEventosProblema({ problemaId: 999 })).rejects.toThrow(
      'Problema não encontrado.',
    );
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });
});
