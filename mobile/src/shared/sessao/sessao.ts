import { ApiError, paraApiError } from '@services/ApiError';
import { apiSemInterceptores } from '@services/http';
import { store } from '@store/store';
import {
  logout,
  restauracaoFalhou,
  restauracaoIniciada,
  setCredentials,
  setUser,
  type Credenciais,
  type MotivoDoEncerramento,
} from '@store/authSlice';
import { queryClient } from '@shared/hooks/useAppQueryClient';
import { armazenamentoDaSessao } from './armazenamento';
import { credenciaisDaSessao, mapUser, type ApiUser, type SessaoDaApi } from './contrato';

let geracao = 0;
let renovacaoEmCurso: Promise<string> | null = null;
let restauracaoEmCurso: Promise<void> | null = null;

export async function iniciarSessao(sessao: SessaoDaApi): Promise<void> {
  geracao += 1;
  const credenciais = credenciaisDaSessao(sessao);
  await guardar(credenciais);
  store.dispatch(setCredentials(credenciais));
}

export function renovarSessao(): Promise<string> {
  const { refreshToken } = store.getState().auth;
  if (!refreshToken) {
    return Promise.reject(new ApiError('Não há sessão para renovar.', 401, 'SESSAO_INVALIDA'));
  }
  return renovarCom(refreshToken);
}

function renovarCom(refreshToken: string): Promise<string> {
  if (!renovacaoEmCurso) {
    renovacaoEmCurso = executarRenovacao(refreshToken).finally(() => {
      renovacaoEmCurso = null;
    });
  }
  return renovacaoEmCurso;
}

async function executarRenovacao(refreshToken: string): Promise<string> {
  const geracaoDoPedido = geracao;
  let sessao: SessaoDaApi;
  try {
    const resposta = await apiSemInterceptores.post<SessaoDaApi>('/auth/refresh', {
      refreshToken,
    });
    sessao = resposta.data;
  } catch (falha) {
    const erro = paraApiError(falha);
    if (ehRecusaDaSessao(erro) && geracaoDoPedido === geracao) {
      await encerrarSessaoLocalmente(motivoDaRecusa(erro));
    }
    throw erro;
  }

  const credenciais = credenciaisDaSessao(sessao);
  if (geracaoDoPedido === geracao) await guardar(credenciais);
  if (geracaoDoPedido !== geracao) {
    revogar(sessao.refreshToken);
    throw new ApiError('A sessão foi encerrada durante a renovação.', 401, 'SESSAO_INVALIDA');
  }
  store.dispatch(setCredentials(credenciais));
  return sessao.accessToken;
}

export async function encerrarSessao(): Promise<void> {
  const { refreshToken } = store.getState().auth;
  if (refreshToken) revogar(refreshToken);
  await encerrarSessaoLocalmente();
}

export async function encerrarSessaoLocalmente(motivo?: MotivoDoEncerramento): Promise<void> {
  geracao += 1;
  queryClient.clear();
  store.dispatch(logout(motivo));
  await armazenamentoDaSessao.limpar();
}

export function restaurarSessao(): Promise<void> {
  if (!restauracaoEmCurso) {
    restauracaoEmCurso = executarRestauracao().finally(() => {
      restauracaoEmCurso = null;
    });
  }
  return restauracaoEmCurso;
}

async function executarRestauracao(): Promise<void> {
  store.dispatch(restauracaoIniciada());
  const salva = await armazenamentoDaSessao.ler();
  if (!salva) {
    store.dispatch(logout());
    return;
  }

  try {
    await renovarCom(salva.refreshToken);
  } catch (erro) {
    if (ehRecusaDaSessao(erro)) return;
    store.dispatch(restauracaoFalhou({ refreshToken: salva.refreshToken, user: salva.usuario }));
  }
}

export async function atualizarUsuario(usuarioDaApi: ApiUser): Promise<void> {
  const usuario = mapUser(usuarioDaApi);
  const { situacao, user } = store.getState().auth;
  if (situacao !== 'autenticado' || user?.id !== usuario.id) return;
  store.dispatch(setUser(usuario));
  await armazenamentoDaSessao.gravarUsuario(usuario).catch(() => undefined);
}

function ehRecusaDaSessao(erro: unknown): boolean {
  if (!(erro instanceof ApiError)) return false;
  return erro.status === 400 || erro.status === 401 || erro.status === 403;
}

function motivoDaRecusa(erro: ApiError): MotivoDoEncerramento {
  if (erro.code === 'CONTA_BLOQUEADA') return 'CONTA_BLOQUEADA';
  if (erro.code === 'SESSAO_COMPROMETIDA') return 'SESSAO_COMPROMETIDA';
  return 'SESSAO_INVALIDA';
}

async function guardar(credenciais: Credenciais): Promise<void> {
  try {
    await armazenamentoDaSessao.gravar({
      refreshToken: credenciais.refreshToken,
      usuario: credenciais.user,
    });
  } catch (erro) {
    console.warn('Não foi possível gravar a sessão no armazenamento seguro.', erro);
    await armazenamentoDaSessao.limpar();
  }
}

function revogar(refreshToken: string): void {
  apiSemInterceptores.post('/auth/logout', { refreshToken }).catch(() => undefined);
}
