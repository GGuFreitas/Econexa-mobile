import { beforeEach, describe, expect, it, vi } from 'vitest';
import { dbPool } from '@config/database.js';
import { criarProblema, listarProblemas, obterProblema } from './problemas.handler.js';

vi.mock('@config/database.js', () => ({
  dbPool: { query: vi.fn() },
}));

const mockQuery = dbPool.query as unknown as ReturnType<typeof vi.fn>;

describe('problemas handlers', () => {
  beforeEach(() => mockQuery.mockReset());

  it('cria um problema com geom a partir de lat/lng', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, titulo: 'Buraco na via', tipo: 'problema', status: 'ativo', lat: -23.5, lng: -46.6 }],
    });

    const problema = await criarProblema({
      usuarioId: 1,
      titulo: 'Buraco na via',
      causaId: 1,
      lat: -23.5,
      lng: -46.6,
    });

    expect(problema.id).toBe(1);
    const call = mockQuery.mock.calls[0][0] as string;
    expect(call).toContain('ST_MakePoint');
    expect(call).toContain('ST_SetSRID');
  });

  it('lista problemas por proximidade (ST_DWithin)', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 2, titulo: 'Lixo acumulado', distancia_m: 120 }],
    });

    const lista = await listarProblemas({ lat: -23.5, lng: -46.6, raio: 1000 });

    expect(lista).toHaveLength(1);
    expect(mockQuery.mock.calls[0][0]).toContain('ST_DWithin');
  });

  it('retorna 404 para problema inexistente', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await expect(obterProblema(999)).rejects.toThrow('Problema não encontrado.');
  });
});
