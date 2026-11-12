import { beforeEach, describe, expect, it, vi } from 'vitest';

const ambiente = vi.hoisted(() => ({ plataforma: { OS: 'android' } }));

const secureStore = vi.hoisted(() => {
  const itens = new Map<string, string>();
  return {
    itens,
    getItemAsync: vi.fn(async (chave: string) => itens.get(chave) ?? null),
    setItemAsync: vi.fn(async (chave: string, valor: string) => {
      itens.set(chave, valor);
    }),
    deleteItemAsync: vi.fn(async (chave: string) => {
      itens.delete(chave);
    }),
  };
});

vi.mock('react-native', () => ({ Platform: ambiente.plataforma }));
vi.mock('expo-secure-store', () => ({
  getItemAsync: secureStore.getItemAsync,
  setItemAsync: secureStore.setItemAsync,
  deleteItemAsync: secureStore.deleteItemAsync,
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 6,
}));

import type { User } from '@store/authSlice';
import { CHAVES_DA_SESSAO, criarArmazenamentoDaSessao } from './armazenamento';

const CHAVE_VALIDA = /^[A-Za-z0-9._-]+$/;

const ana: User = {
  id: '7',
  name: 'Ana',
  email: 'ana@x.com',
  role: 'citizen',
  vote_weight: 1,
  email_verified: false,
  has_password: true,
};

describe('armazenamento da sessão', () => {
  beforeEach(() => {
    ambiente.plataforma.OS = 'android';
    secureStore.itens.clear();
    vi.clearAllMocks();
  });

  it('usa só chaves que o SecureStore aceita', () => {
    for (const chave of Object.values(CHAVES_DA_SESSAO)) {
      expect(chave).toMatch(CHAVE_VALIDA);
    }
  });

  it('no aparelho grava refresh token e snapshot do usuário no SecureStore, presos ao aparelho', async () => {
    const armazenamento = criarArmazenamentoDaSessao();

    await armazenamento.gravar({ refreshToken: 'refresh-1', usuario: ana });

    expect(secureStore.setItemAsync).toHaveBeenCalledWith(
      CHAVES_DA_SESSAO.refreshToken,
      'refresh-1',
      { keychainAccessible: 6 },
    );
    expect([...secureStore.itens.keys()].sort()).toEqual(
      [CHAVES_DA_SESSAO.refreshToken, CHAVES_DA_SESSAO.usuario].sort(),
    );
    for (const [chave] of secureStore.setItemAsync.mock.calls) {
      expect(chave).toMatch(CHAVE_VALIDA);
    }
    await expect(armazenamento.ler()).resolves.toEqual({ refreshToken: 'refresh-1', usuario: ana });
  });

  it('sem refresh token salvo não há sessão, mesmo que sobre um snapshot', async () => {
    secureStore.itens.set(CHAVES_DA_SESSAO.usuario, JSON.stringify(ana));

    await expect(criarArmazenamentoDaSessao().ler()).resolves.toBeNull();
  });

  it('gravarUsuario troca só o snapshot', async () => {
    const armazenamento = criarArmazenamentoDaSessao();
    await armazenamento.gravar({ refreshToken: 'refresh-1', usuario: ana });

    await armazenamento.gravarUsuario({ ...ana, email_verified: true });

    await expect(armazenamento.ler()).resolves.toEqual({
      refreshToken: 'refresh-1',
      usuario: { ...ana, email_verified: true },
    });
  });

  it('limpar apaga as duas chaves', async () => {
    const armazenamento = criarArmazenamentoDaSessao();
    await armazenamento.gravar({ refreshToken: 'refresh-1', usuario: ana });

    await armazenamento.limpar();

    expect(secureStore.deleteItemAsync).toHaveBeenCalledTimes(2);
    expect(secureStore.itens.size).toBe(0);
  });

  it('snapshot corrompido não derruba a restauração: o usuário volta no refresh', async () => {
    secureStore.itens.set(CHAVES_DA_SESSAO.refreshToken, 'refresh-1');
    secureStore.itens.set(CHAVES_DA_SESSAO.usuario, '{quebrado');

    await expect(criarArmazenamentoDaSessao().ler()).resolves.toEqual({
      refreshToken: 'refresh-1',
      usuario: null,
    });
  });

  it('leitura que falha (chave do Keystore invalidada) vira "sem sessão" e limpa o que sobrou', async () => {
    secureStore.itens.set(CHAVES_DA_SESSAO.refreshToken, 'refresh-1');
    secureStore.itens.set(CHAVES_DA_SESSAO.usuario, JSON.stringify(ana));
    secureStore.getItemAsync.mockRejectedValueOnce(new Error('Could not decrypt the item'));

    await expect(criarArmazenamentoDaSessao().ler()).resolves.toBeNull();
    expect(secureStore.itens.size).toBe(0);
  });

  it('gravação lenta seguida de limpeza termina limpa: as operações respeitam a ordem', async () => {
    let liberarGravacao: () => void = () => undefined;
    secureStore.setItemAsync.mockImplementationOnce(async (chave: string, valor: string) => {
      await new Promise<void>((resolve) => {
        liberarGravacao = resolve;
      });
      secureStore.itens.set(chave, valor);
    });
    const armazenamento = criarArmazenamentoDaSessao();

    const gravacao = armazenamento.gravar({ refreshToken: 'refresh-1', usuario: ana });
    const limpeza = armazenamento.limpar();
    await vi.waitFor(() => expect(secureStore.setItemAsync).toHaveBeenCalledTimes(1));
    liberarGravacao();
    await Promise.all([gravacao, limpeza]);

    expect(secureStore.itens.size).toBe(0);
  });

  it('no web guarda em memória e nunca toca no SecureStore', async () => {
    ambiente.plataforma.OS = 'web';
    const armazenamento = criarArmazenamentoDaSessao();

    await armazenamento.gravar({ refreshToken: 'refresh-web', usuario: ana });
    await expect(armazenamento.ler()).resolves.toEqual({ refreshToken: 'refresh-web', usuario: ana });
    await armazenamento.limpar();
    await expect(armazenamento.ler()).resolves.toBeNull();

    expect(secureStore.getItemAsync).not.toHaveBeenCalled();
    expect(secureStore.setItemAsync).not.toHaveBeenCalled();
    expect(secureStore.deleteItemAsync).not.toHaveBeenCalled();
  });

  it('no web a sessão não sobrevive a recarregar a página', async () => {
    ambiente.plataforma.OS = 'web';
    await criarArmazenamentoDaSessao().gravar({ refreshToken: 'refresh-web', usuario: ana });

    await expect(criarArmazenamentoDaSessao().ler()).resolves.toBeNull();
  });
});
