import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';

vi.mock('@services/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

import { api } from '@services/api';
import { useOrgaos } from './useOrgaos';
import { useEncaminhamentos } from './useEncaminhamentos';
import { useCriarEncaminhamento } from './useCriarEncaminhamento';
import { useRegistrarResposta } from './useRegistrarResposta';
import { useReenviarEncaminhamento } from './useReenviarEncaminhamento';
import type { Encaminhamento } from '../types';

const PROBLEMA_ID = 3;

const orgao = { id: 2, nome: '[EXEMPLO] Secretaria de Obras', esfera: 'municipal', tipo: 'secretaria' };

const encaminhamento: Encaminhamento = {
  id: 11,
  problema_id: PROBLEMA_ID,
  referencia: 'MUTIRA-P000003',
  assunto: '[MUTIRA-P000003] Alagamento',
  mensagem: 'corpo da petição',
  status: 'enviado',
  enviado_em: '2026-09-03T10:00:00.000Z',
  falha_motivo: null,
  protocolo: null,
  resposta: null,
  resposta_verificada: false,
  respondido_em: null,
  criado_em: '2026-09-03T10:00:00.000Z',
  orgao,
  autor: { id: 5, nome: 'Ana' },
  pode_registrar_resposta: true,
  pode_reenviar: false,
};

const comFalha: Encaminhamento = {
  ...encaminhamento,
  status: 'falhou',
  enviado_em: null,
  falha_motivo: 'smtp fora do ar',
  pode_registrar_resposta: false,
  pode_reenviar: true,
};

function criarWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('hooks de encaminhamento', () => {
  beforeEach(() => vi.clearAllMocks());

  it('só busca os órgãos quando a ação de encaminhar é aberta', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [orgao] });

    const fechado = renderHook(() => useOrgaos(false), { wrapper: criarWrapper() });
    expect(api.get).not.toHaveBeenCalled();
    expect(fechado.result.current.data).toBeUndefined();

    const aberto = renderHook(() => useOrgaos(true), { wrapper: criarWrapper() });
    await waitFor(() => expect(aberto.result.current.isSuccess).toBe(true));
    expect(api.get).toHaveBeenCalledWith('/orgaos');
    expect(aberto.result.current.data).toHaveLength(1);
  });

  it('expõe lista vazia quando o problema ainda não foi encaminhado', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });

    const { result } = renderHook(() => useEncaminhamentos(PROBLEMA_ID), {
      wrapper: criarWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });

  it('trata erro da API na listagem', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('Erro de conexão.'));

    const { result } = renderHook(() => useEncaminhamentos(PROBLEMA_ID), {
      wrapper: criarWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe('Erro de conexão.');
  });

  it('atualiza a lista depois de encaminhar o problema', async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValue({ data: [encaminhamento] });
    vi.mocked(api.post).mockResolvedValue({ data: encaminhamento });

    const { result } = renderHook(
      () => ({
        lista: useEncaminhamentos(PROBLEMA_ID),
        criar: useCriarEncaminhamento(PROBLEMA_ID),
      }),
      { wrapper: criarWrapper() },
    );

    await waitFor(() => expect(result.current.lista.isSuccess).toBe(true));
    expect(result.current.lista.data).toEqual([]);

    await act(async () => {
      await result.current.criar.mutateAsync({ orgaoId: orgao.id, mensagem: 'Complemento.' });
    });

    await waitFor(() => expect(result.current.lista.data).toHaveLength(1));
    expect(api.post).toHaveBeenCalledWith(`/problemas/${PROBLEMA_ID}/encaminhamentos`, {
      orgaoId: orgao.id,
      mensagem: 'Complemento.',
    });
  });

  it('mantém a lista intacta quando a API recusa o encaminhamento', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [] });
    vi.mocked(api.post).mockRejectedValue(new Error('Você não pode encaminhar este problema.'));

    const { result } = renderHook(
      () => ({
        lista: useEncaminhamentos(PROBLEMA_ID),
        criar: useCriarEncaminhamento(PROBLEMA_ID),
      }),
      { wrapper: criarWrapper() },
    );

    await waitFor(() => expect(result.current.lista.isSuccess).toBe(true));

    await act(async () => {
      await result.current.criar.mutateAsync({ orgaoId: orgao.id }).catch(() => undefined);
    });

    await waitFor(() => expect(result.current.criar.isError).toBe(true));
    expect((result.current.criar.error as Error).message).toBe(
      'Você não pode encaminhar este problema.',
    );
    expect(result.current.lista.data).toEqual([]);
  });

  it('registra a resposta do órgão e recarrega a lista', async () => {
    const respondido = {
      ...encaminhamento,
      status: 'respondido' as const,
      resposta: 'Servico agendado.',
      protocolo: 'OS-1',
      pode_registrar_resposta: false,
    };
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: [encaminhamento] })
      .mockResolvedValue({ data: [respondido] });
    vi.mocked(api.post).mockResolvedValue({ data: respondido });

    const { result } = renderHook(
      () => ({
        lista: useEncaminhamentos(PROBLEMA_ID),
        responder: useRegistrarResposta(PROBLEMA_ID),
      }),
      { wrapper: criarWrapper() },
    );

    await waitFor(() => expect(result.current.lista.data).toHaveLength(1));

    await act(async () => {
      await result.current.responder.mutateAsync({
        encaminhamentoId: encaminhamento.id,
        resposta: 'Servico agendado.',
        protocolo: 'OS-1',
      });
    });

    await waitFor(() => expect(result.current.lista.data?.[0].status).toBe('respondido'));
    expect(api.post).toHaveBeenCalledWith(
      `/problemas/${PROBLEMA_ID}/encaminhamentos/${encaminhamento.id}/resposta`,
      { resposta: 'Servico agendado.', protocolo: 'OS-1' },
    );
    expect(result.current.lista.data?.[0].pode_registrar_resposta).toBe(false);
  });

  it('mantém o encaminhamento intacto quando a API recusa a resposta', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [{ ...encaminhamento, pode_registrar_resposta: false }] });
    vi.mocked(api.post).mockRejectedValue(
      new Error('Você não pode registrar a resposta deste encaminhamento.'),
    );

    const { result } = renderHook(
      () => ({
        lista: useEncaminhamentos(PROBLEMA_ID),
        responder: useRegistrarResposta(PROBLEMA_ID),
      }),
      { wrapper: criarWrapper() },
    );

    await waitFor(() => expect(result.current.lista.data).toHaveLength(1));
    expect(result.current.lista.data?.[0].pode_registrar_resposta).toBe(false);

    await act(async () => {
      await result.current.responder
        .mutateAsync({ encaminhamentoId: encaminhamento.id, resposta: 'tentativa' })
        .catch(() => undefined);
    });

    await waitFor(() => expect(result.current.responder.isError).toBe(true));
    expect(result.current.lista.data?.[0].status).toBe('enviado');
  });

  it('reenvia o encaminhamento que falhou e recarrega a lista já enviada', async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: [comFalha] })
      .mockResolvedValue({ data: [encaminhamento] });
    vi.mocked(api.post).mockResolvedValue({ data: encaminhamento });

    const { result } = renderHook(
      () => ({
        lista: useEncaminhamentos(PROBLEMA_ID),
        reenviar: useReenviarEncaminhamento(PROBLEMA_ID),
      }),
      { wrapper: criarWrapper() },
    );

    await waitFor(() => expect(result.current.lista.data?.[0].pode_reenviar).toBe(true));
    expect(result.current.lista.data?.[0].falha_motivo).toBe('smtp fora do ar');

    await act(async () => {
      await result.current.reenviar.mutateAsync(comFalha.id);
    });

    await waitFor(() => expect(result.current.lista.data?.[0].status).toBe('enviado'));
    expect(api.post).toHaveBeenCalledWith(
      `/problemas/${PROBLEMA_ID}/encaminhamentos/${comFalha.id}/reenviar`,
    );
    expect(result.current.lista.data?.[0].pode_registrar_resposta).toBe(true);
  });

  it('mantém a falha visível quando o reenvio também é recusado', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [comFalha] });
    vi.mocked(api.post).mockRejectedValue(new Error('Você não pode reenviar este encaminhamento.'));

    const { result } = renderHook(
      () => ({
        lista: useEncaminhamentos(PROBLEMA_ID),
        reenviar: useReenviarEncaminhamento(PROBLEMA_ID),
      }),
      { wrapper: criarWrapper() },
    );

    await waitFor(() => expect(result.current.lista.data).toHaveLength(1));

    await act(async () => {
      await result.current.reenviar.mutateAsync(comFalha.id).catch(() => undefined);
    });

    await waitFor(() => expect(result.current.reenviar.isError).toBe(true));
    expect((result.current.reenviar.error as Error).message).toBe(
      'Você não pode reenviar este encaminhamento.',
    );
    expect(result.current.lista.data?.[0].status).toBe('falhou');
  });
});
