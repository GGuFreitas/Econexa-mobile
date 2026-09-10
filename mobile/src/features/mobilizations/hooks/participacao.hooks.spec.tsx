import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';

vi.mock('@services/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), delete: vi.fn(), patch: vi.fn() },
}));

import { api } from '@services/api';
import { useParticipar } from './useParticipar';
import { useSair } from './useSair';
import type { Mobilizacao } from '../types';

const MOBILIZACAO_ID = 7;
const CHAVE = ['mobilizacao', MOBILIZACAO_ID];

const mobilizacao: Mobilizacao = {
  id: MOBILIZACAO_ID,
  problema_id: 3,
  usuario_id: 5,
  titulo: 'Mutirão da praça',
  descricao: null,
  data_inicio: '2026-10-01T09:00:00.000Z',
  data_fim: null,
  local_nome: null,
  lat: null,
  lng: null,
  status: 'agendada',
  resultado_descricao: null,
  resultado_metricas: null,
  criado_em: '2026-09-01T09:00:00.000Z',
  atualizado_em: '2026-09-01T09:00:00.000Z',
  cont_participantes: 2,
  usuario_participa: false,
  pode_gerenciar: false,
};

function criarAmbiente() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  queryClient.setQueryData(CHAVE, mobilizacao);

  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  return { queryClient, Wrapper };
}

describe('participação em mobilização', () => {
  beforeEach(() => vi.clearAllMocks());

  it('o update otimista sobe o contador antes da resposta', async () => {
    const { queryClient, Wrapper } = criarAmbiente();
    vi.mocked(api.post).mockResolvedValue({
      data: { participando: true, cont_participantes: 3 },
    });

    const { result } = renderHook(() => useParticipar(), { wrapper: Wrapper });
    await act(async () => {
      await result.current.mutateAsync(MOBILIZACAO_ID);
    });

    const otimista = queryClient.getQueryData<Mobilizacao>(CHAVE);
    expect(otimista?.cont_participantes).toBe(3);
    expect(otimista?.usuario_participa).toBe(true);
  });

  it('o rollback devolve o estado anterior na chave da mobilização', async () => {
    const { queryClient, Wrapper } = criarAmbiente();
    vi.mocked(api.post).mockRejectedValue(new Error('Erro de conexão.'));

    const { result } = renderHook(() => useParticipar(), { wrapper: Wrapper });
    await act(async () => {
      await result.current.mutateAsync(MOBILIZACAO_ID).catch(() => undefined);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(queryClient.getQueryData<Mobilizacao>(CHAVE)).toEqual(mobilizacao);
  });

  it('o rollback de sair também escreve na chave da mobilização', async () => {
    const { queryClient, Wrapper } = criarAmbiente();
    queryClient.setQueryData(CHAVE, { ...mobilizacao, usuario_participa: true });
    vi.mocked(api.delete).mockRejectedValue(new Error('Erro de conexão.'));

    const { result } = renderHook(() => useSair(), { wrapper: Wrapper });
    await act(async () => {
      await result.current.mutateAsync(MOBILIZACAO_ID).catch(() => undefined);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(queryClient.getQueryData<Mobilizacao>(CHAVE)?.usuario_participa).toBe(true);
  });

  it('nenhuma chave-lixo é criada pelo rollback', async () => {
    const { queryClient, Wrapper } = criarAmbiente();
    vi.mocked(api.post).mockRejectedValue(new Error('Erro de conexão.'));

    const { result } = renderHook(() => useParticipar(), { wrapper: Wrapper });
    await act(async () => {
      await result.current.mutateAsync(MOBILIZACAO_ID).catch(() => undefined);
    });

    const chaves = queryClient
      .getQueryCache()
      .getAll()
      .map((query) => JSON.stringify(query.queryKey));

    expect(chaves).toEqual([JSON.stringify(CHAVE)]);
  });
});
