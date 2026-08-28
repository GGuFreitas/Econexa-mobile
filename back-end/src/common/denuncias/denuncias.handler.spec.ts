import { beforeEach, describe, expect, it, vi } from 'vitest';
import { dbPool } from '@config/database.js';
import { criarDenuncia, listarDenuncias } from './denuncias.handler.js';

vi.mock('@config/database.js', () => ({
  dbPool: { query: vi.fn() },
}));

const mockQuery = dbPool.query as unknown as ReturnType<typeof vi.fn>;

describe('denuncias handlers', () => {
  beforeEach(() => mockQuery.mockReset());

  it('cria denuncia para problema existente', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // problemaExiste
      .mockResolvedValueOnce({ rows: [{ id: 10, problema_id: 1, usuario_id: 2, motivo: 'spam' }] }); // inserir

    const d = await criarDenuncia({ problemaId: 1, usuarioId: 2, motivo: 'spam' });

    expect(d.id).toBe(10);
    expect(mockQuery.mock.calls[1][0]).toContain('INSERT INTO problema_denuncias');
  });

  it('retorna 404 se problema nao existir', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await expect(
      criarDenuncia({ problemaId: 999, usuarioId: 2, motivo: 'spam' }),
    ).rejects.toThrow('Problema não encontrado.');
  });

  it('lista denuncias de um problema', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 10, motivo: 'spam' }] });

    const l = await listarDenuncias(1);

    expect(l).toHaveLength(1);
    expect(mockQuery.mock.calls[0][0]).toContain('FROM problema_denuncias');
  });
});
