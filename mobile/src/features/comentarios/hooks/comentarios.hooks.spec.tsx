import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';

vi.mock('@services/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

import { api } from '@services/api';
import { useComentarios } from './useComentarios';
import { useCriarComentario } from './useCriarComentario';
import { useExcluirComentario } from './useExcluirComentario';
import type { Comentario } from '../types';

const PROBLEMA_ID = 3;

const comentario: Comentario = {
  id: 9,
  problema_id: PROBLEMA_ID,
  conteudo: 'Continua alagando.',
  criado_em: '2026-09-01T10:00:00.000Z',
  autor: { id: 5, nome: 'Ana' },
  pode_excluir: true,
};

function criarWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('hooks de comentários', () => {
  beforeEach(() => vi.clearAllMocks());

  it('carrega os comentários do problema', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [comentario] });

    const { result } = renderHook(() => useComentarios(PROBLEMA_ID), { wrapper: criarWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].autor.nome).toBe('Ana');
  });

  it('expõe lista vazia quando o problema ainda não tem comentários', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    const { result } = renderHook(() => useComentarios(PROBLEMA_ID), { wrapper: criarWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('trata erro da API na listagem', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('Erro de conexão.'));

    const { result } = renderHook(() => useComentarios(PROBLEMA_ID), { wrapper: criarWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe('Erro de conexão.');
  });

  it('atualiza a lista depois de criar um comentário', async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValue({ data: [comentario] });
    vi.mocked(api.post).mockResolvedValue({ data: comentario });

    const { result } = renderHook(
      () => ({ lista: useComentarios(PROBLEMA_ID), criar: useCriarComentario(PROBLEMA_ID) }),
      { wrapper: criarWrapper() },
    );

    await waitFor(() => expect(result.current.lista.isSuccess).toBe(true));
    expect(result.current.lista.data).toEqual([]);

    await act(async () => {
      await result.current.criar.mutateAsync('Continua alagando.');
    });

    await waitFor(() => expect(result.current.lista.data).toHaveLength(1));
    expect(api.post).toHaveBeenCalledWith(`/problemas/${PROBLEMA_ID}/comentarios`, {
      conteudo: 'Continua alagando.',
    });
  });

  it('atualiza a lista depois de excluir o próprio comentário', async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: [comentario] })
      .mockResolvedValue({ data: [] });
    vi.mocked(api.delete).mockResolvedValue({ data: { excluido: true } });

    const { result } = renderHook(
      () => ({ lista: useComentarios(PROBLEMA_ID), excluir: useExcluirComentario(PROBLEMA_ID) }),
      { wrapper: criarWrapper() },
    );

    await waitFor(() => expect(result.current.lista.data).toHaveLength(1));

    await act(async () => {
      await result.current.excluir.mutateAsync(comentario.id);
    });

    await waitFor(() => expect(result.current.lista.data).toEqual([]));
    expect(api.delete).toHaveBeenCalledWith(`/problemas/${PROBLEMA_ID}/comentarios/${comentario.id}`);
  });

  it('mantém a lista intacta quando a API recusa a exclusão de comentário alheio', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [comentario] });
    vi.mocked(api.delete).mockRejectedValue(
      new Error('Você só pode excluir os seus próprios comentários.'),
    );

    const { result } = renderHook(
      () => ({ lista: useComentarios(PROBLEMA_ID), excluir: useExcluirComentario(PROBLEMA_ID) }),
      { wrapper: criarWrapper() },
    );

    await waitFor(() => expect(result.current.lista.data).toHaveLength(1));

    await act(async () => {
      await result.current.excluir.mutateAsync(comentario.id).catch(() => undefined);
    });

    await waitFor(() => expect(result.current.excluir.isError).toBe(true));
    expect((result.current.excluir.error as Error).message).toBe(
      'Você só pode excluir os seus próprios comentários.',
    );
    expect(result.current.lista.data).toHaveLength(1);
  });
});
