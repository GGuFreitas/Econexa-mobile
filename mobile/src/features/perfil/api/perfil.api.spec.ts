import { beforeEach, describe, expect, it, vi } from 'vitest';
import { api } from '@services/api';
import { obterResumo } from './resumo';
import { listarRelatados } from './relatados';
import { listarApoiados } from './apoiados';
import { listarAcoes } from './acoes';
import { listarIdsApoiados } from './apoios';

vi.mock('@services/api', () => ({
  api: { get: vi.fn() },
}));

const mockGet = vi.mocked(api.get);

describe('api do perfil', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockGet.mockResolvedValue({ data: [] });
  });

  it('busca o resumo em /me/resumo', async () => {
    mockGet.mockResolvedValue({ data: { relatados: 3 } });

    expect(await obterResumo()).toEqual({ relatados: 3 });
    expect(mockGet).toHaveBeenCalledWith('/me/resumo');
  });

  it('busca os ids apoiados em /me/apoios', async () => {
    mockGet.mockResolvedValue({ data: [3, 8] });

    expect(await listarIdsApoiados()).toEqual([3, 8]);
    expect(mockGet).toHaveBeenCalledWith('/me/apoios');
  });

  it('busca relatados, apoiados e ações com o limite pedido', async () => {
    await listarRelatados();
    await listarApoiados(12);
    await listarAcoes(5);

    expect(mockGet).toHaveBeenNthCalledWith(1, '/me/relatados', { params: { limite: '30' } });
    expect(mockGet).toHaveBeenNthCalledWith(2, '/me/apoiados', { params: { limite: '12' } });
    expect(mockGet).toHaveBeenNthCalledWith(3, '/me/acoes', { params: { limite: '5' } });
  });
});
