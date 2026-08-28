import { beforeEach, describe, expect, it, vi } from 'vitest';
import { dbPool } from '@config/database.js';
import { apoiarProblema, desapoiarProblema } from './apoios.handler.js';

vi.mock('@config/database.js', () => ({
  dbPool: { query: vi.fn() },
}));

const mockQuery = dbPool.query as unknown as ReturnType<typeof vi.fn>;

describe('apoios handlers', () => {
  beforeEach(() => mockQuery.mockReset());

  it('apoia um problema novo e incrementa contadores ponderados', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // problemaExiste
      .mockResolvedValueOnce({ rows: [] }) // jaApoiou -> false
      .mockResolvedValueOnce({ rows: [{ peso_voto: 2 }] }) // getPesoVoto -> 2
      .mockResolvedValueOnce({ rows: [{ problema_id: 1 }] }) // inserirApoio -> inseriu
      .mockResolvedValueOnce({ rows: [] }) // incrementarContadores
      .mockResolvedValueOnce({ rows: [{ cont_apoios: 1, cont_apoios_ponderados: 2 }] }); // obterContadores

    const r = await apoiarProblema(1, 10);

    expect(r.apoiado).toBe(true);
    expect(r.cont_apoios).toBe(1);
    expect(r.cont_apoios_ponderados).toBe(2);
    expect(mockQuery.mock.calls[3][0]).toContain('ON CONFLICT');
  });

  it('apoio repetido e idempotente (nao incrementa de novo)', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 1 }] })
      .mockResolvedValueOnce({ rows: [{ problema_id: 1 }] })
      .mockResolvedValueOnce({ rows: [{ cont_apoios: 5, cont_apoios_ponderados: 9 }] });

    const r = await apoiarProblema(1, 10);

    expect(r.cont_apoios).toBe(5);
    expect(mockQuery.mock.calls.length).toBe(3);
  });

  it('desapoiar decrementa contadores', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // problemaExiste
      .mockResolvedValueOnce({ rows: [{ peso_aplicado: 2 }] }) // removerApoio -> peso 2
      .mockResolvedValueOnce({ rows: [] }) // decrementarContadores
      .mockResolvedValueOnce({ rows: [{ cont_apoios: 4, cont_apoios_ponderados: 7 }] }); // obterContadores

    const r = await desapoiarProblema(1, 10);

    expect(r.apoiado).toBe(false);
    expect(r.cont_apoios).toBe(4);
    expect(mockQuery.mock.calls[1][0]).toContain('DELETE FROM problema_apoios');
  });

  it('retorna 404 para problema inexistente', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    await expect(apoiarProblema(999, 10)).rejects.toThrow('Problema não encontrado.');
  });
});
