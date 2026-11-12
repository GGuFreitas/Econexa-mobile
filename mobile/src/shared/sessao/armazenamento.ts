import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import type { User } from '@store/authSlice';

export const CHAVES_DA_SESSAO = {
  refreshToken: 'sessao.refresh_token',
  usuario: 'sessao.usuario',
} as const;

export type SessaoSalva = { refreshToken: string; usuario: User | null };

export type ArmazenamentoDaSessao = {
  ler(): Promise<SessaoSalva | null>;
  gravar(sessao: { refreshToken: string; usuario: User }): Promise<void>;
  limpar(): Promise<void>;
};

type Cofre = {
  ler(chave: string): Promise<string | null>;
  gravar(chave: string, valor: string): Promise<void>;
  apagar(chave: string): Promise<void>;
};

const OPCOES_DO_SECURE_STORE: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

function cofreSeguro(): Cofre {
  return {
    ler: (chave) => SecureStore.getItemAsync(chave, OPCOES_DO_SECURE_STORE),
    gravar: (chave, valor) => SecureStore.setItemAsync(chave, valor, OPCOES_DO_SECURE_STORE),
    apagar: (chave) => SecureStore.deleteItemAsync(chave, OPCOES_DO_SECURE_STORE),
  };
}

function cofreEmMemoria(): Cofre {
  const itens = new Map<string, string>();
  return {
    ler: async (chave) => itens.get(chave) ?? null,
    gravar: async (chave, valor) => {
      itens.set(chave, valor);
    },
    apagar: async (chave) => {
      itens.delete(chave);
    },
  };
}

export function criarArmazenamentoDaSessao(
  plataforma: string = Platform.OS,
): ArmazenamentoDaSessao {
  const cofre = plataforma === 'web' ? cofreEmMemoria() : cofreSeguro();
  let fila: Promise<unknown> = Promise.resolve();

  function emOrdem<T>(operacao: () => Promise<T>): Promise<T> {
    const resultado = fila.then(() => operacao());
    fila = resultado.catch(() => undefined);
    return resultado;
  }

  const apagarTudo = async () => {
    await Promise.all([
      cofre.apagar(CHAVES_DA_SESSAO.refreshToken).catch(() => undefined),
      cofre.apagar(CHAVES_DA_SESSAO.usuario).catch(() => undefined),
    ]);
  };

  return {
    ler: () =>
      emOrdem(async () => {
        try {
          const refreshToken = await cofre.ler(CHAVES_DA_SESSAO.refreshToken);
          if (!refreshToken) return null;
          const usuario = lerUsuario(await cofre.ler(CHAVES_DA_SESSAO.usuario));
          return { refreshToken, usuario };
        } catch {
          await apagarTudo();
          return null;
        }
      }),
    gravar: ({ refreshToken, usuario }) =>
      emOrdem(async () => {
        await cofre.gravar(CHAVES_DA_SESSAO.refreshToken, refreshToken);
        await cofre.gravar(CHAVES_DA_SESSAO.usuario, JSON.stringify(usuario));
      }),
    limpar: () => emOrdem(apagarTudo),
  };
}

function lerUsuario(json: string | null): User | null {
  if (!json) return null;
  try {
    const valor: unknown = JSON.parse(json);
    return typeof valor === 'object' && valor !== null ? (valor as User) : null;
  } catch {
    return null;
  }
}

export const armazenamentoDaSessao = criarArmazenamentoDaSessao();
