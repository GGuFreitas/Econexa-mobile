/* global setTimeout */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';

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

vi.mock('react-native', () => ({ Platform: { OS: 'android' } }));
vi.mock('expo-secure-store', () => ({
  getItemAsync: secureStore.getItemAsync,
  setItemAsync: secureStore.setItemAsync,
  deleteItemAsync: secureStore.deleteItemAsync,
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 6,
}));

import { CHAVES_DA_SESSAO } from '@shared/sessao/armazenamento';
import type { SessaoDaApi } from '@shared/sessao/contrato';

type Resposta = { status: number; data?: unknown };
type Rota = (config: InternalAxiosRequestConfig) => Resposta | Promise<Resposta>;

function criarServidor(rotas: Record<string, Rota>) {
  const pedidos: InternalAxiosRequestConfig[] = [];
  const chaveDe = (pedido: InternalAxiosRequestConfig) =>
    `${pedido.method?.toUpperCase()} ${pedido.url}`;

  async function adapter(config: InternalAxiosRequestConfig): Promise<AxiosResponse> {
    pedidos.push(config);
    const rota = rotas[chaveDe(config)];
    if (!rota) throw new Error(`Rota não simulada: ${chaveDe(config)}`);
    const { status, data } = await rota(config);
    const response: AxiosResponse = { data, status, statusText: String(status), headers: {}, config };
    if (status >= 200 && status < 300) return response;
    throw new AxiosError(
      `Request failed with status code ${status}`,
      AxiosError.ERR_BAD_RESPONSE,
      config,
      null,
      response,
    );
  }

  const pedidosPara = (chave: string) => pedidos.filter((pedido) => chaveDe(pedido) === chave);
  return { adapter, pedidos, pedidosPara };
}

async function montar(rotas: Record<string, Rota>) {
  vi.resetModules();
  const { api } = await import('@services/api');
  const { apiSemInterceptores } = await import('@services/http');
  const { store } = await import('@store/store');
  const { logout } = await import('@store/authSlice');
  const sessao = await import('@shared/sessao/sessao');
  const servidor = criarServidor(rotas);
  api.defaults.adapter = servidor.adapter;
  apiSemInterceptores.defaults.adapter = servidor.adapter;
  return { api, store, logout, sessao, servidor };
}

async function montarAutenticado(rotas: Record<string, Rota>) {
  const ambiente = await montar(rotas);
  await ambiente.sessao.iniciarSessao(sessaoDaApi('acesso-1', 'refresh-1'));
  vi.clearAllMocks();
  return ambiente;
}

function sessaoDaApi(accessToken: string, refreshToken: string): SessaoDaApi {
  return {
    accessToken,
    refreshToken,
    expiresIn: 900,
    tokenType: 'Bearer',
    user: {
      id: 7,
      name: 'Ana',
      email: 'ana@x.com',
      role: 'citizen',
      vote_weight: 1,
      email_verified: false,
    },
  };
}

function erro(status: number, msg: string, code?: string): Resposta {
  return { status, data: { notification: { status: 'warn', msg, code } } };
}

const naoAutorizado = erro(401, 'Token inválido ou expirado.');

const semRede: Rota = (config) => {
  throw new AxiosError('Network Error', AxiosError.ERR_NETWORK, config, null);
};

const autorizacao = (pedido: InternalAxiosRequestConfig) => pedido.headers.get('Authorization');

const ehGet = (pedido: InternalAxiosRequestConfig) => pedido.method === 'get';

function adiado() {
  let liberar: () => void = () => undefined;
  const promessa = new Promise<void>((resolve) => {
    liberar = resolve;
  });
  return { promessa, liberar: () => liberar() };
}

const esvaziarMicrotarefas = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

const tiposDespachados = (despachar: { mock: { calls: unknown[][] } }) =>
  despachar.mock.calls.map(([acao]) => (acao as { type: string }).type);

describe('interceptor de sessão da api', () => {
  beforeEach(() => {
    secureStore.itens.clear();
    vi.clearAllMocks();
  });

  it('duas requisições com 401 ao mesmo tempo fazem um único refresh e repetem com o token novo', async () => {
    const refresh = adiado();
    const refreshNoCofreAoRepetir: Array<string | undefined> = [];
    const exigeAcessoNovo: Rota = (config) => {
      if (autorizacao(config) !== 'Bearer acesso-2') return naoAutorizado;
      refreshNoCofreAoRepetir.push(secureStore.itens.get(CHAVES_DA_SESSAO.refreshToken));
      return { status: 200, data: { url: config.url } };
    };
    const { api, store, servidor } = await montarAutenticado({
      'GET /problemas': exigeAcessoNovo,
      'GET /mobilizacoes': exigeAcessoNovo,
      'POST /auth/refresh': async () => {
        await refresh.promessa;
        return { status: 200, data: sessaoDaApi('acesso-2', 'refresh-2') };
      },
    });

    const problemas = api.get('/problemas');
    const mobilizacoes = api.get('/mobilizacoes');
    await vi.waitFor(() => expect(servidor.pedidos.filter(ehGet)).toHaveLength(2));
    await vi.waitFor(() => expect(servidor.pedidosPara('POST /auth/refresh')).toHaveLength(1));
    await esvaziarMicrotarefas();

    expect(servidor.pedidosPara('POST /auth/refresh')).toHaveLength(1);
    refresh.liberar();
    const [respostaProblemas, respostaMobilizacoes] = await Promise.all([problemas, mobilizacoes]);

    expect(respostaProblemas.data).toEqual({ url: '/problemas' });
    expect(respostaMobilizacoes.data).toEqual({ url: '/mobilizacoes' });
    expect(servidor.pedidosPara('POST /auth/refresh')).toHaveLength(1);
    expect(JSON.parse(servidor.pedidosPara('POST /auth/refresh')[0].data)).toEqual({
      refreshToken: 'refresh-1',
    });
    expect(servidor.pedidosPara('GET /problemas').map(autorizacao)).toEqual([
      'Bearer acesso-1',
      'Bearer acesso-2',
    ]);
    expect(servidor.pedidosPara('GET /mobilizacoes').map(autorizacao)).toEqual([
      'Bearer acesso-1',
      'Bearer acesso-2',
    ]);
    expect(refreshNoCofreAoRepetir).toEqual(['refresh-2', 'refresh-2']);
    expect(store.getState().auth).toMatchObject({
      situacao: 'autenticado',
      accessToken: 'acesso-2',
      refreshToken: 'refresh-2',
    });
  });

  it('refresh recusado encerra a sessão uma vez só, limpa o cofre e rejeita as requisições paradas', async () => {
    const refresh = adiado();
    const { api, store, servidor } = await montarAutenticado({
      'GET /problemas': () => naoAutorizado,
      'GET /mobilizacoes': () => naoAutorizado,
      'POST /auth/refresh': async () => {
        await refresh.promessa;
        return erro(401, 'Sessão inválida.', 'SESSAO_INVALIDA');
      },
    });
    const despachar = vi.spyOn(store, 'dispatch');

    const resultados = Promise.allSettled([api.get('/problemas'), api.get('/mobilizacoes')]);
    await vi.waitFor(() => expect(servidor.pedidos.filter(ehGet)).toHaveLength(2));
    await esvaziarMicrotarefas();
    refresh.liberar();
    const [problemas, mobilizacoes] = await resultados;

    expect(problemas).toMatchObject({
      status: 'rejected',
      reason: { status: 401, code: 'SESSAO_INVALIDA' },
    });
    expect(mobilizacoes).toMatchObject({
      status: 'rejected',
      reason: { status: 401, code: 'SESSAO_INVALIDA' },
    });
    expect(servidor.pedidosPara('POST /auth/refresh')).toHaveLength(1);
    expect(tiposDespachados(despachar).filter((tipo) => tipo === 'auth/logout')).toHaveLength(1);
    expect(secureStore.deleteItemAsync).toHaveBeenCalledTimes(2);
    expect(secureStore.itens.size).toBe(0);
    expect(store.getState().auth).toMatchObject({
      situacao: 'anonimo',
      accessToken: null,
      refreshToken: null,
      motivoDoEncerramento: 'SESSAO_INVALIDA',
    });
    expect(servidor.pedidosPara('POST /auth/logout')).toHaveLength(0);
  });

  it.each([
    '/auth/login',
    '/auth/register',
    '/auth/refresh',
    '/auth/logout',
  ])('401 em %s é resposta da própria autenticação: não tenta renovar', async (rota) => {
    const { api, store, servidor } = await montarAutenticado({
      [`POST ${rota}`]: () => erro(401, 'E-mail ou senha incorretos.'),
    });

    await expect(api.post(rota, {})).rejects.toMatchObject({
      status: 401,
      message: 'E-mail ou senha incorretos.',
    });

    expect(servidor.pedidos).toHaveLength(1);
    expect(store.getState().auth).toMatchObject({
      situacao: 'autenticado',
      refreshToken: 'refresh-1',
    });
  });

  it('repete a requisição uma vez só: 401 de novo depois de renovar é devolvido, sem laço', async () => {
    const { api, store, servidor } = await montarAutenticado({
      'GET /problemas': () => naoAutorizado,
      'POST /auth/refresh': () => ({ status: 200, data: sessaoDaApi('acesso-2', 'refresh-2') }),
    });

    await expect(api.get('/problemas')).rejects.toMatchObject({ status: 401 });

    expect(servidor.pedidosPara('GET /problemas').map(autorizacao)).toEqual([
      'Bearer acesso-1',
      'Bearer acesso-2',
    ]);
    expect(servidor.pedidosPara('POST /auth/refresh')).toHaveLength(1);
    expect(store.getState().auth.situacao).toBe('autenticado');
  });

  it('requisição que saiu com o token antigo e voltou depois da renovação repete sem renovar de novo', async () => {
    const lenta = adiado();
    const { api, servidor } = await montarAutenticado({
      'GET /rapida': (config) =>
        autorizacao(config) === 'Bearer acesso-2' ? { status: 200, data: 'rápida' } : naoAutorizado,
      'GET /lenta': async (config) => {
        if (autorizacao(config) === 'Bearer acesso-2') return { status: 200, data: 'lenta' };
        await lenta.promessa;
        return naoAutorizado;
      },
      'POST /auth/refresh': () => ({ status: 200, data: sessaoDaApi('acesso-2', 'refresh-2') }),
    });

    const respostaLenta = api.get('/lenta');
    await expect(api.get('/rapida')).resolves.toMatchObject({ data: 'rápida' });
    lenta.liberar();

    await expect(respostaLenta).resolves.toMatchObject({ data: 'lenta' });
    expect(servidor.pedidosPara('POST /auth/refresh')).toHaveLength(1);
    expect(servidor.pedidosPara('GET /lenta').map(autorizacao)).toEqual([
      'Bearer acesso-1',
      'Bearer acesso-2',
    ]);
  });

  it('refresh sem rede não derruba a sessão: a requisição falha como falha de rede e o token fica', async () => {
    const { api, store } = await montarAutenticado({
      'GET /problemas': () => naoAutorizado,
      'POST /auth/refresh': semRede,
    });

    await expect(api.get('/problemas')).rejects.toMatchObject({
      status: undefined,
      message: 'Network Error',
    });

    expect(store.getState().auth).toMatchObject({
      situacao: 'autenticado',
      refreshToken: 'refresh-1',
    });
    expect(secureStore.itens.get(CHAVES_DA_SESSAO.refreshToken)).toBe('refresh-1');
    expect(secureStore.deleteItemAsync).not.toHaveBeenCalled();
  });

  it('403 CONTA_BLOQUEADA em qualquer rota encerra a sessão e guarda o motivo', async () => {
    const { api, store, servidor } = await montarAutenticado({
      'POST /problemas/3/apoios': () => erro(403, 'Conta bloqueada.', 'CONTA_BLOQUEADA'),
    });

    await expect(api.post('/problemas/3/apoios')).rejects.toMatchObject({
      status: 403,
      code: 'CONTA_BLOQUEADA',
    });

    expect(store.getState().auth).toMatchObject({
      situacao: 'anonimo',
      accessToken: null,
      refreshToken: null,
      motivoDoEncerramento: 'CONTA_BLOQUEADA',
    });
    expect(secureStore.itens.size).toBe(0);
    expect(servidor.pedidos).toHaveLength(1);
  });

  it('403 sem CONTA_BLOQUEADA é falta de permissão: a sessão continua', async () => {
    const { api, store } = await montarAutenticado({
      'DELETE /problemas/3/comentarios/9': () => erro(403, 'Só o autor pode excluir.'),
    });

    await expect(api.delete('/problemas/3/comentarios/9')).rejects.toMatchObject({ status: 403 });

    expect(store.getState().auth.situacao).toBe('autenticado');
    expect(secureStore.itens.get(CHAVES_DA_SESSAO.refreshToken)).toBe('refresh-1');
  });

  it('403 CONTA_BLOQUEADA no login, sem sessão aberta, não encerra nada', async () => {
    const { api, store, logout } = await montar({
      'POST /auth/login': () => erro(403, 'Conta bloqueada.', 'CONTA_BLOQUEADA'),
    });
    store.dispatch(logout());
    const despachar = vi.spyOn(store, 'dispatch');

    await expect(
      api.post('/auth/login', { email: 'ana@x.com', password: 'segredo' }),
    ).rejects.toMatchObject({ status: 403, code: 'CONTA_BLOQUEADA' });

    expect(despachar).not.toHaveBeenCalled();
    expect(store.getState().auth.motivoDoEncerramento).toBeNull();
  });

  it('401 sem sessão aberta não tenta renovar', async () => {
    const { api, store, logout, servidor } = await montar({
      'GET /problemas': () => naoAutorizado,
    });
    store.dispatch(logout());

    await expect(api.get('/problemas')).rejects.toMatchObject({ status: 401 });

    expect(servidor.pedidos).toHaveLength(1);
    expect(autorizacao(servidor.pedidos[0])).toBeUndefined();
  });
});
