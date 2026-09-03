import { beforeEach, describe, expect, it, vi } from 'vitest';
import { dbPool } from '@config/database.js';
import {
  alterarStatusProblema,
  criarProblema,
  listarProblemas,
  obterProblema,
  estatisticasProblemas,
  transicoesDisponiveis,
} from './problemas.handler.js';
import type { Problema } from './problemas.types.js';

vi.mock('@config/database.js', () => ({
  dbPool: { query: vi.fn() },
}));

vi.mock('@shared/transacao.js', async () => {
  const { dbPool: pool } = await import('@config/database.js');
  return { emTransacao: (fn: (executor: unknown) => unknown) => fn(pool) };
});

const mockQuery = dbPool.query as unknown as ReturnType<typeof vi.fn>;

const problemaDoAutor = { id: 1, usuario_id: 7, status: 'ativo' } as Problema;

describe('problemas handlers', () => {
  beforeEach(() => mockQuery.mockReset());

  it('cria um problema com geom a partir de lat/lng', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] }) // findNearbyProblema -> sem duplicado
      .mockResolvedValueOnce({
        rows: [{ id: 1, titulo: 'Buraco na via', tipo: 'problema', status: 'ativo', lat: -23.5, lng: -46.6 }],
      })
      .mockResolvedValueOnce({ rows: [{ id: 10, tipo: 'PROBLEMA_CRIADO' }] });

    const problema = await criarProblema({
      usuarioId: 1,
      titulo: 'Buraco na via',
      causaId: 1,
      lat: -23.5,
      lng: -46.6,
    });

    expect(problema.id).toBe(1);
    const call = mockQuery.mock.calls[1][0] as string;
    expect(call).toContain('ST_MakePoint');
    expect(call).toContain('ST_SetSRID');
  });

  it('registra PROBLEMA_CRIADO na mesma transação da criação', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 3, titulo: 'Buraco na via' }] })
      .mockResolvedValueOnce({ rows: [{ id: 10 }] });

    await criarProblema({ usuarioId: 4, titulo: 'Buraco na via', causaId: 1, lat: -23.5, lng: -46.6 });

    expect(mockQuery.mock.calls[2][0]).toContain('INSERT INTO problema_eventos');
    expect(mockQuery.mock.calls[2][1]).toEqual([
      3,
      'PROBLEMA_CRIADO',
      4,
      JSON.stringify({ titulo: 'Buraco na via' }),
    ]);
  });

  it('dedupe: retorna problema existente proximo em vez de criar novo', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 99, titulo: 'existente' }] }); // findNearbyProblema

    const problema = await criarProblema({
      usuarioId: 1,
      titulo: 'Outro buraco',
      causaId: 1,
      lat: -23.5,
      lng: -46.6,
    });

    expect(problema.id).toBe(99);
    expect(mockQuery.mock.calls.length).toBe(1);
    expect(mockQuery.mock.calls[0][0]).toContain('ST_DWithin');
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

  it('filtra por tipo (ponto_positivo/cultural)', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ id: 5, tipo: 'cultural' }] });

    const lista = await listarProblemas({ tipo: 'cultural' });

    expect(lista[0].tipo).toBe('cultural');
    expect(mockQuery.mock.calls[0][0]).toContain('p.tipo =');
  });

  it('filtra por tags livres (operador &&)', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    await listarProblemas({ tags: ['lixo', 'saude'] });

    expect(mockQuery.mock.calls[0][0]).toContain('p.tags &&');
  });

  it('agrega estatisticas por causa e tipo', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ causa_id: 2, total: 5 }] })
      .mockResolvedValueOnce({ rows: [{ tipo: 'problema', total: 5 }] })
      .mockResolvedValueOnce({ rows: [{ total: 5 }] });

    const stats = await estatisticasProblemas({});

    expect(stats.total).toBe(5);
    expect(stats.porCausa[0].causa_id).toBe(2);
    expect(stats.porTipo[0].tipo).toBe('problema');
  });

  it('o autor avança o status e o backend registra STATUS_ALTERADO', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [problemaDoAutor] })
      .mockResolvedValueOnce({ rows: [{ ...problemaDoAutor, status: 'em_analise' }] })
      .mockResolvedValueOnce({ rows: [{ id: 30 }] });

    const problema = await alterarStatusProblema({
      problemaId: 1,
      status: 'em_analise',
      usuarioId: 7,
      role: 'citizen',
    });

    expect(problema.status).toBe('em_analise');
    expect(mockQuery.mock.calls[2][0]).toContain('INSERT INTO problema_eventos');
    expect(mockQuery.mock.calls[2][1]).toEqual([
      1,
      'STATUS_ALTERADO',
      7,
      JSON.stringify({ de: 'ativo', para: 'em_analise' }),
    ]);
  });

  it('registra RESOLVIDO junto de STATUS_ALTERADO quando o destino é resolvido', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ ...problemaDoAutor, status: 'encaminhado' }] })
      .mockResolvedValueOnce({ rows: [{ ...problemaDoAutor, status: 'resolvido' }] })
      .mockResolvedValueOnce({ rows: [{ id: 31 }] })
      .mockResolvedValueOnce({ rows: [{ id: 32 }] });

    await alterarStatusProblema({
      problemaId: 1,
      status: 'resolvido',
      usuarioId: 7,
      role: 'citizen',
    });

    expect(mockQuery.mock.calls[3][1]?.[1]).toBe('RESOLVIDO');
  });

  it('recusa alteração de status de quem não é autor nem moderação', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [problemaDoAutor] });

    await expect(
      alterarStatusProblema({ problemaId: 1, status: 'resolvido', usuarioId: 99, role: 'citizen' }),
    ).rejects.toThrow('Você não pode alterar o status deste problema.');
    expect(mockQuery).toHaveBeenCalledTimes(1);
  });

  it('só a moderação remove um problema', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [problemaDoAutor] });

    await expect(
      alterarStatusProblema({ problemaId: 1, status: 'removido', usuarioId: 7, role: 'citizen' }),
    ).rejects.toThrow('Apenas a moderação pode remover um problema.');
  });

  it('recusa transição fora do fluxo', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ ...problemaDoAutor, status: 'resolvido' }] });

    await expect(
      alterarStatusProblema({ problemaId: 1, status: 'ativo', usuarioId: 7, role: 'citizen' }),
    ).rejects.toThrow('Não é possível mudar de "resolvido" para "ativo".');
  });

  it('expõe ao autor apenas as transições que ele pode executar', () => {
    expect(transicoesDisponiveis(problemaDoAutor, 7, 'citizen')).toEqual([
      'em_analise',
      'encaminhado',
      'resolvido',
    ]);
    expect(transicoesDisponiveis(problemaDoAutor, 7, 'admin')).toContain('removido');
    expect(transicoesDisponiveis(problemaDoAutor, 99, 'citizen')).toEqual([]);
    expect(transicoesDisponiveis(problemaDoAutor)).toEqual([]);
  });
});
