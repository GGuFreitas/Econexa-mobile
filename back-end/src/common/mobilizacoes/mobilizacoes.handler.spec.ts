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
      .mockResolvedValueOnce({ rows: [{ id: 50 }] });

    const mobilizacao = await criarMobilizacao({
      usuarioId: 1,
      problemaId: 1,
      titulo: '  Mutirão de limpeza  ',
      dataInicio: '2026-09-10T09:00:00Z',
    });

    expect(mobilizacao.id).toBe(1);
    expect(mockQuery.mock.calls[1][0]).toContain('INSERT INTO mobilizacoes');
    expect(mockQuery.mock.calls[2][1]?.[1]).toBe('MOBILIZACAO_CRIADA');
  });

  it('rejeita criação para problema inexistente', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] }); // problemaExiste

    await expect(
      criarMobilizacao({
        usuarioId: 1,
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

  it('retorna 404 para mobilização inexistente', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });
    await expect(obterMobilizacao(999)).rejects.toThrow('Mobilização não encontrada.');
  });

  it('inclui contador de participantes ao obter mobilização', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 1, status: 'agendada' }] }) // getMobilizacaoById
      .mockResolvedValueOnce({ rows: [{ total: 4 }] });

    const mobilizacao = await obterMobilizacao(1);

    expect(mobilizacao.cont_participantes).toBe(4);
  });

  it('permite transição válida de status (agendada -> em_andamento)', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 1, status: 'agendada' }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, status: 'em_andamento' }] }) // updateStatus
      .mockResolvedValueOnce({ rows: [{ total: 0 }] });

    const mobilizacao = await atualizarStatusMobilizacao(1, 'em_andamento', 9);

    expect(mobilizacao.status).toBe('em_andamento');
  });

  it('registra MOBILIZACAO_REALIZADA ao concluir a mobilização', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: 1, status: 'em_andamento' }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, problema_id: 4, titulo: 'Mutirão', status: 'realizada' }] })
      .mockResolvedValueOnce({ rows: [{ id: 51 }] })
      .mockResolvedValueOnce({ rows: [{ total: 3 }] });

    await atualizarStatusMobilizacao(1, 'realizada', 9);

    expect(mockQuery.mock.calls[2][0]).toContain('INSERT INTO problema_eventos');
    expect(mockQuery.mock.calls[2][1]).toEqual([
      4,
      'MOBILIZACAO_REALIZADA',
      9,
      JSON.stringify({ mobilizacao_id: 1, titulo: 'Mutirão' }),
    ]);
  });

  it('rejeita transição inválida de status (realizada -> agendada)', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 1, status: 'realizada' }] });

    await expect(atualizarStatusMobilizacao(1, 'agendada', 9)).rejects.toThrow(
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
