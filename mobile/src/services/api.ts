/* global FormData */
import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosProgressEvent,
  type InternalAxiosRequestConfig,
} from 'axios';
import { store } from '@store/store';
import { encerrarSessaoLocalmente, renovarSessao } from '@shared/sessao/sessao';
import { ApiError, paraApiError } from './ApiError';
import { baseURL } from './http';

const ROTAS_DE_AUTENTICACAO = new Set([
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/logout',
]);

type Requisicao = InternalAxiosRequestConfig & { _repetidaAposRenovar?: boolean };

export const api: AxiosInstance = axios.create({
  baseURL,
  paramsSerializer: { indexes: null },
});

api.interceptors.request.use((config) => {
  const token = store.getState().auth.accessToken;
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

api.interceptors.response.use((response) => response, tratarFalha);

async function tratarFalha(falha: AxiosError) {
  const erro = paraApiError(falha);
  const requisicao = falha.config as Requisicao | undefined;

  if (erro.status === 403 && erro.code === 'CONTA_BLOQUEADA') {
    if (haSessao()) await encerrarSessaoLocalmente('CONTA_BLOQUEADA');
    throw erro;
  }

  if (!podeRenovar(erro, requisicao)) throw erro;

  requisicao._repetidaAposRenovar = true;
  if (!tokenJaTrocou(requisicao)) await renovarSessao();
  return api(requisicao);
}

function haSessao(): boolean {
  return Boolean(store.getState().auth.refreshToken);
}

function podeRenovar(erro: ApiError, requisicao: Requisicao | undefined): requisicao is Requisicao {
  if (erro.status !== 401 || !requisicao) return false;
  if (requisicao._repetidaAposRenovar) return false;
  if (ehRotaDeAutenticacao(requisicao.url)) return false;
  return haSessao();
}

function ehRotaDeAutenticacao(url = ''): boolean {
  return ROTAS_DE_AUTENTICACAO.has(url.split('?')[0]);
}

function tokenJaTrocou(requisicao: Requisicao): boolean {
  const atual = store.getState().auth.accessToken;
  return Boolean(atual) && requisicao.headers.get('Authorization') !== `Bearer ${atual}`;
}

export { ApiError };

export interface UploadFileInput {
  uri: string;
  name: string;
  type: string;
}

export async function uploadFile<T>(
  url: string,
  file: UploadFileInput,
  onProgress?: (progress: number) => void,
): Promise<T> {
  const formData = new FormData();
  formData.append('file', {
    uri: file.uri,
    name: file.name,
    type: file.type,
  } as any);

  const response = await api.post<T>(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (event: AxiosProgressEvent) => {
      if (event.total && onProgress) {
        onProgress(Math.round((event.loaded * 100) / event.total));
      }
    },
  });
  return response.data;
}
