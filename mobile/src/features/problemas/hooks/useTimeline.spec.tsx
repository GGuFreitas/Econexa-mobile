import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';

vi.mock('@services/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

import { api } from '@services/api';
import { useTimeline } from './useTimeline';
import { useAlterarStatus } from './useAlterarStatus';

const PROBLEMA_ID = 3;

const eventoCriado = {
  id: 1,
  problema_id: PROBLEMA_ID,
  tipo: 'PROBLEMA_CRIADO',
  dados: { titulo: 'Alagamento' },
  criado_em: '2026-09-01T10:00:00.000Z',
  autor: { id: 5, nome: 'Ana' },
};

const eventoStatus = {
  id: 2,
  problema_id: PROBLEMA_ID,
  tipo: 'STATUS_ALTERADO',
  dados: { de: 'ativo', para: 'resolvido' },
  criado_em: '2026-09-03T10:00:00.000Z',
  autor: { id: 5, nome: 'Ana' },
};

function criarWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useTimeline', () => {
  beforeEach(() => vi.clearAllMocks());

  it('carrega os eventos do backend já apresentados', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [eventoStatus, eventoCriado] });

    const { result } = renderHook(() => useTimeline(PROBLEMA_ID), { wrapper: criarWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(api.get).toHaveBeenCalledWith(`/problemas/${PROBLEMA_ID}/eventos`, {
      params: { limite: '50' },
    });
    expect(result.current.eventos.map((evento) => evento.titulo)).toEqual([
      'Status alterado',
      'Problema registrado',
    ]);
    expect(result.current.eventos[0].descricao).toBe('Ativo → Resolvido');
  });

  it('expõe lista vazia quando o problema não tem atividade', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    const { result } = renderHook(() => useTimeline(PROBLEMA_ID), { wrapper: criarWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.eventos).toEqual([]);
    expect(result.current.isError).toBe(false);
  });

  it('expõe o erro da API sem eventos inventados', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('Erro de conexão.'));

    const { result } = renderHook(() => useTimeline(PROBLEMA_ID), { wrapper: criarWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.eventos).toEqual([]);
    expect((result.current.error as Error).message).toBe('Erro de conexão.');
  });

  it('não busca enquanto o problema não estiver identificado', () => {
    const { result } = renderHook(() => useTimeline(null), { wrapper: criarWrapper() });

    expect(api.get).not.toHaveBeenCalled();
    expect(result.current.eventos).toEqual([]);
  });

  it('recarrega a timeline depois de uma alteração de status', async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: [eventoCriado] })
      .mockResolvedValue({ data: [eventoStatus, eventoCriado] });
    vi.mocked(api.patch).mockResolvedValue({
      data: { id: PROBLEMA_ID, status: 'resolvido', transicoes_permitidas: [] },
    });

    const { result } = renderHook(
      () => ({
        timeline: useTimeline(PROBLEMA_ID),
        alterar: useAlterarStatus(PROBLEMA_ID),
      }),
      { wrapper: criarWrapper() },
    );

    await waitFor(() => expect(result.current.timeline.eventos).toHaveLength(1));

    await act(async () => {
      await result.current.alterar.mutateAsync('resolvido');
    });

    await waitFor(() => expect(result.current.timeline.eventos).toHaveLength(2));
    expect(api.patch).toHaveBeenCalledWith(`/problemas/${PROBLEMA_ID}/status`, {
      status: 'resolvido',
    });
  });

  it('mantém a timeline intacta quando a API recusa a alteração de status', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [eventoCriado] });
    vi.mocked(api.patch).mockRejectedValue(
      new Error('Você não pode alterar o status deste problema.'),
    );

    const { result } = renderHook(
      () => ({
        timeline: useTimeline(PROBLEMA_ID),
        alterar: useAlterarStatus(PROBLEMA_ID),
      }),
      { wrapper: criarWrapper() },
    );

    await waitFor(() => expect(result.current.timeline.eventos).toHaveLength(1));

    await act(async () => {
      await result.current.alterar.mutateAsync('resolvido').catch(() => undefined);
    });

    await waitFor(() => expect(result.current.alterar.isError).toBe(true));
    expect((result.current.alterar.error as Error).message).toBe(
      'Você não pode alterar o status deste problema.',
    );
    expect(result.current.timeline.eventos).toHaveLength(1);
  });
});
