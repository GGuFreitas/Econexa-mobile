import { ApiError } from '@services/ApiError';

const MENSAGEM_POR_CODIGO: Record<string, string> = {
  CONTA_BLOQUEADA: 'Esta conta foi bloqueada pela moderação e não pode ser usada.',
  SESSAO_INVALIDA: 'Sua sessão expirou. Entre de novo para continuar.',
  SESSAO_COMPROMETIDA:
    'Por segurança, encerramos sua sessão em todos os aparelhos. Entre de novo para continuar.',
  CODIGO_INVALIDO: 'Código incorreto ou expirado. Confira os 6 números ou peça um código novo.',
};

export function mensagemDoCodigo(code?: string | null): string | null {
  if (!code) return null;
  return MENSAGEM_POR_CODIGO[code] ?? null;
}

export function mensagemDeErro(erro: unknown, padrao: string): string {
  if (erro instanceof ApiError) {
    const porCodigo = mensagemDoCodigo(erro.code);
    if (porCodigo) return porCodigo;
    if (erro.status == null) return 'Não foi possível falar com o servidor. Verifique sua conexão.';
    if (erro.status === 401) return 'E-mail ou senha incorretos.';
    if (erro.status === 409) return erro.message;
    if (erro.status === 429) return 'Muitas tentativas seguidas. Aguarde um pouco e tente de novo.';
    return erro.message || padrao;
  }
  if (erro instanceof Error && erro.message) return erro.message;
  return padrao;
}
