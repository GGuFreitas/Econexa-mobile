import { beforeEach, describe, expect, it, vi } from 'vitest';
import { dbPool } from '@config/database.js';
import { apoiarProblema, desapoiarProblema } from './apoios.handler.js';

vi.mock('@config/database.js', () => ({
  dbPool: { query: vi.fn() },
}));

vi.mock('@shared/transacao.js', async () => {
  const { dbPool: pool } = await import('@config/database.js');
  return { emTransacao: (fn: (executor: unknown) => unknown) => fn(pool) };
});

const mockQuery = dbPool.query as unknown as ReturnType<typeof vi.fn>;

describe('apoios handlers', () => {
  beforeEach(() => {
    mockQuery.mockReset();
    mockQuery.mockResolvedValue({ rows: [] });
  });

  it('apoia um problema novo em um único statement e emite APOIO_CRIADO', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 1 }] })
      .mockResolvedValueOnce({ rows: [{ cont_apoios: 1, cont_apoios_ponderados: 2 }] })
      .mockResolvedValueOnce({ rows: [{ id: 70 }] });

    const r = await apoiarProblema(1, 10);

    expect(r).toEqual({ apoiado: true, cont_apoios: 1, cont_apoios_ponderados: 2 });
    expect(mockQuery).toHaveBeenCalledTimes(3);

    const sql = mockQuery.mock.calls[1][0] as string;
    expect(sql).toContain('INSERT INTO problema_apoios');
    expect(sql).toContain('ON CONFLICT (problema_id, usuario_id) DO NOTHING');
    expect(sql).toContain('UPDATE problemas p');
    expect(mockQuery.mock.calls[1][1]).toEqual([1, 10]);
    expect(mockQuery.mock.calls[2][1]?.[1]).toBe('APOIO_CRIADO');
  });

  it('não consulta o apoio antes de inserir: o statement é a única decisão', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 1 }] })
      .mockResolvedValueOnce({ rows: [{ cont_apoios: 1, cont_apoios_ponderados: 1 }] })
      .mockResolvedValueOnce({ rows: [{ id: 71 }] });

    await apoiarProblema(1, 10);

    const consultas = mockQuery.mock.calls.map((call) => String(call[0]));
    expect(consultas.some((sql) => sql.startsWith('SELECT 1 FROM problema_apoios'))).toBe(false);
  });

  it('apoio repetido não incrementa de novo e não emite evento', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 1 }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ cont_apoios: 5, cont_apoios_ponderados: 9 }] });

    const r = await apoiarProblema(1, 10);

    expect(r.cont_apoios).toBe(5);
    expect(r.cont_apoios_ponderados).toBe(9);
    expect(mockQuery).toHaveBeenCalledTimes(3);
    expect(mockQuery.mock.calls[2][0]).toContain('SELECT cont_apoios, cont_apoios_ponderados');
  });

  it('desapoiar remove e decrementa no mesmo statement, emitindo APOIO_REMOVIDO', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 1 }] })
      .mockResolvedValueOnce({ rows: [{ cont_apoios: 4, cont_apoios_ponderados: 7 }] })
      .mockResolvedValueOnce({ rows: [{ id: 72 }] });

    const r = await desapoiarProblema(1, 10);

    expect(r).toEqual({ apoiado: false, cont_apoios: 4, cont_apoios_ponderados: 7 });
    const sql = mockQuery.mock.calls[1][0] as string;
    expect(sql).toContain('DELETE FROM problema_apoios');
    expect(sql).toContain('UPDATE problemas p');
    expect(sql).not.toContain('GREATEST');
    expect(mockQuery.mock.calls[2][1]?.[1]).toBe('APOIO_REMOVIDO');
  });

  it('desapoiar quem nunca apoiou não mexe no contador nem emite evento', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 1 }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ cont_apoios: 3, cont_apoios_ponderados: 3 }] });

    const r = await desapoiarProblema(1, 10);

    expect(r.cont_apoios).toBe(3);
    expect(mockQuery).toHaveBeenCalledTimes(3);
    expect(mockQuery.mock.calls[2][0]).toContain('SELECT cont_apoios, cont_apoios_ponderados');
  });

  it('retorna 404 para problema inexistente', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    await expect(apoiarProblema(999, 10)).rejects.toThrow('Problema não encontrado.');
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });
});
