import { beforeEach, describe, expect, it, vi } from 'vitest';
import { dbPool } from '@config/database.js';
import {
  atualizarStatusMobilizacao,
  criarMobilizacao,
  listarMobilizacoes,
  obterMobilizacao,
  participarDaMobilizacao,
} from './mobilizacoes.handler.js';

vi.mock('@config/database.js', () => ({
  dbPool: { query: vi.fn() },
}));

vi.mock('@shared/transacao.js', async () => {
  const { dbPool: pool } = await import('@config/database.js');
  return { emTransacao: (fn: (executor: unknown) => unknown) => fn(pool) };
});

const mockQuery = dbPool.query as unknown as ReturnType<typeof vi.fn>;

describe('mobilizacoes handlers', () => {
  beforeEach(() => mockQuery.mockReset());

  it('cria mobilização vinculada a um problema existente', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // problemaExiste
      .mockResolvedValueOnce({ rows: [{ id: 1, problema_id: 1, titulo: 'Mutirão de limpeza' }] })
      .mockResolvedValueOnce({ rows: [{ id: 50 }] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            usuario_id: 1,
            problema_id: 1,
            titulo: 'Mutirão de limpeza',
            cont_participantes: 0,
            usuario_participa: false,
          },
        ],
      });

    const mobilizacao = await criarMobilizacao({
      usuarioId: 1,
      role: 'citizen',
      problemaId: 1,
      titulo: '  Mutirão de limpeza  ',
      dataInicio: '2026-09-10T09:00:00Z',
    });

    expect(mobilizacao.id).toBe(1);
    expect(mobilizacao.pode_gerenciar).toBe(true);
    expect(mobilizacao.cont_participantes).toBe(0);
    expect(mockQuery.mock.calls[1][0]).toContain('INSERT INTO mobilizacoes');
    expect(mockQuery.mock.calls[2][1]?.[1]).toBe('MOBILIZACAO_CRIADA');
  });

  it('rejeita criação para problema inexistente', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] }); // problemaExiste

    await expect(
      criarMobilizacao({
        usuarioId: 1,
        role: 'citizen',
        problemaId: 999,
        titulo: 'Mutirão',
        dataInicio: '2026-09-10T09:00:00Z',
      }),
    ).rejects.toThrow('Problema não encontrado.');
  });

  it('lista mobilizações por problema', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 2, problema_id: 5 }] });

    await listarMobilizacoes({ problemaId: 5 });

    expect(mockQuery.mock.calls[0][0]).toContain('WHERE m.problema_id = $1');
  });

  it('recusa gestão de mobilização alheia', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, usuario_id: 9, status: 'agendada' }] });

    await expect(
      atualizarStatusMobilizacao(1, 'cancelada', 42, 'citizen'),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('retorna 404 para mobilização inexistente', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    await expect(obterMobilizacao(999)).rejects.toThrow('Mobilização não encontrada.');
  });

  it('a leitura já traz contador e participação numa consulta só', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, status: 'agendada', cont_participantes: 4, usuario_participa: true }],
    });

    const mobilizacao = await obterMobilizacao(1, 10, 'citizen');

    expect(mobilizacao.cont_participantes).toBe(4);
    expect(mobilizacao.usuario_participa).toBe(true);
    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(mockQuery.mock.calls[0][1]).toEqual([1, 10]);
  });

  it('a listagem também traz contador e participação por linha', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 2, problema_id: 5, cont_participantes: 3, usuario_participa: false }],
    });

    const [mobilizacao] = await listarMobilizacoes({ problemaId: 5 }, 10, 'citizen');

    expect(mobilizacao.cont_participantes).toBe(3);
    expect(mobilizacao.usuario_participa).toBe(false);
    expect(mockQuery.mock.calls[0][0]).toContain('AS cont_participantes');
    expect(mockQuery.mock.calls[0][1]).toEqual([5, 20, 0, 10]);
  });

  it('permite transição válida de status (agendada -> em_andamento)', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 1, usuario_id: 9, status: 'agendada' }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, status: 'em_andamento' }] }) // updateStatus
      .mockResolvedValueOnce({ rows: [{ id: 1, usuario_id: 9, status: 'em_andamento' }] });

    const mobilizacao = await atualizarStatusMobilizacao(1, 'em_andamento', 9, 'citizen');

    expect(mobilizacao.status).toBe('em_andamento');
    expect(mobilizacao.pode_gerenciar).toBe(true);
  });

  it('registra MOBILIZACAO_REALIZADA ao concluir a mobilização', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 1, usuario_id: 9, status: 'em_andamento' }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, problema_id: 4, titulo: 'Mutirão', status: 'realizada' }] })
      .mockResolvedValueOnce({ rows: [{ id: 51 }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, usuario_id: 9, status: 'realizada' }] });

    await atualizarStatusMobilizacao(1, 'realizada', 9, 'citizen');

    expect(mockQuery.mock.calls[2][0]).toContain('INSERT INTO problema_eventos');
    expect(mockQuery.mock.calls[2][1]).toEqual([
      4,
      'MOBILIZACAO_REALIZADA',
      9,
      JSON.stringify({ mobilizacao_id: 1, titulo: 'Mutirão' }),
    ]);
  });

  it('rejeita transição inválida de status (realizada -> agendada)', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, usuario_id: 9, status: 'realizada' }] });

    await expect(atualizarStatusMobilizacao(1, 'agendada', 9, 'citizen')).rejects.toThrow(
      'Não é possível mudar de "realizada" para "agendada".',
    );
  });

  it('participação idempotente retorna contador', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 1 }] })
      .mockResolvedValueOnce({ rows: [{ mobilizacao_id: 1 }] }) // participar (inseriu)
      .mockResolvedValueOnce({ rows: [{ total: 2 }] });

    const resultado = await participarDaMobilizacao(1, 10);

    expect(resultado.participando).toBe(true);
    expect(resultado.cont_participantes).toBe(2);
  });
});
