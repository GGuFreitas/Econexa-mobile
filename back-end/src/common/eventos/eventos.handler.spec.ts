import { beforeEach, describe, expect, it, vi } from 'vitest';
import { dbPool } from '@config/database.js';
import {
  criarEvento,
  listarEventos,
  obterEvento,
  inscreverEmEvento,
  vincularProblema,
} from './eventos.handler.js';

vi.mock('@config/database.js', () => ({
  dbPool: { query: vi.fn() },
}));

const mockQuery = dbPool.query as unknown as ReturnType<typeof vi.fn>;

describe('eventos handlers', () => {
  beforeEach(() => mockQuery.mockReset());

  it('cria evento com geom a partir de lat/lng', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, titulo: 'Mutirão limpeza', tipo: 'mutirao' }],
    });

    const evento = await criarEvento({
      usuarioId: 1,
      titulo: '  Mutirão limpeza  ',
      causaId: 1,
      dataInicio: '2026-09-01T09:00:00Z',
      lat: -23.5,
      lng: -46.6,
    });

    expect(evento.id).toBe(1);
    expect(mockQuery.mock.calls[0][0]).toContain('ST_MakePoint');
  });

  it('lista eventos por proximidade (ST_DWithin)', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 2, titulo: 'Encontro' }] });

    await listarEventos({ lat: -23.5, lng: -46.6, raio: 3000 });

    expect(mockQuery.mock.calls[0][0]).toContain('ST_DWithin');
  });

  it('retorna 404 para evento inexistente', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    await expect(obterEvento(999)).rejects.toThrow('Evento não encontrado.');
  });

  it('vincula problema e marca resolvido', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // getEventoById
      .mockResolvedValueOnce({ rows: [] }) // insert evento_problema
      .mockResolvedValueOnce({ rows: [] }); // update problemas status

    await vincularProblema({ eventoId: 1, problemaId: 5, usuarioId: 1, resolveu: true });

    expect(mockQuery.mock.calls[2][0]).toContain("UPDATE problemas SET status = 'resolvido'");
  });

  it('inscricao idempotente retorna contador', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // getEventoById
      .mockResolvedValueOnce({ rows: [{ evento_id: 1 }] }) // inscrever (inseriu)
      .mockResolvedValueOnce({ rows: [{ total: 3 }] }); // contarParticipantes

    const r = await inscreverEmEvento(1, 10);

    expect(r.inscrito).toBe(true);
    expect(r.cont_participantes).toBe(3);
  });
});
