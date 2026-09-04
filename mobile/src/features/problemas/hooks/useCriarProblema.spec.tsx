import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';

vi.mock('@services/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

import { api } from '@services/api';
import { useCriarProblema } from './useCriarProblema';
import type { CriarProblemaPayload } from '../types';

const payload: CriarProblemaPayload = {
  titulo: 'Buraco na rua',
  causaId: 2,
  tipo: 'problema',
  escopo: 'local',
  lat: -23.55,
  lng: -46.63,
};

function criarWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useCriarProblema', () => {
  beforeEach(() => vi.clearAllMocks());

  it('devolve o problema recém-criado com criado = true', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: { criado: true, problema: { id: 7, ...payload } },
    });

    const { result } = renderHook(() => useCriarProblema(), { wrapper: criarWrapper() });

    let resultado;
    await act(async () => {
      resultado = await result.current.mutateAsync(payload);
    });

    expect(resultado).toMatchObject({ criado: true, problema: { id: 7 } });
  });

  it('entrega o registro parecido sem fingir que criou um novo', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: { criado: false, problema: { id: 99, ...payload } },
    });

    const { result } = renderHook(() => useCriarProblema(), { wrapper: criarWrapper() });

    let resultado;
    await act(async () => {
      resultado = await result.current.mutateAsync(payload);
    });

    expect(resultado).toMatchObject({ criado: false, problema: { id: 99 } });
  });

  it('propaga a recusa da API sem inventar problema', async () => {
    vi.mocked(api.post).mockRejectedValue(new Error('Coordenada fora do Brasil.'));

    const { result } = renderHook(() => useCriarProblema(), { wrapper: criarWrapper() });

    await act(async () => {
      await result.current.mutateAsync(payload).catch(() => undefined);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe('Coordenada fora do Brasil.');
  });
});
