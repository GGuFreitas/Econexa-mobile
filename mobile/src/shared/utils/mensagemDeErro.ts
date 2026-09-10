import { ApiError } from '@services/ApiError';

export function mensagemDeErro(erro: unknown, padrao: string): string {
  if (erro instanceof ApiError) {
    if (erro.status == null) return 'Não foi possível falar com o servidor. Verifique sua conexão.';
    if (erro.status === 401) return 'E-mail ou senha incorretos.';
    if (erro.status === 409) return erro.message;
    if (erro.status === 429) return 'Muitas tentativas seguidas. Aguarde um minuto e tente de novo.';
    return erro.message || padrao;
  }
  if (erro instanceof Error && erro.message) return erro.message;
  return padrao;
}
