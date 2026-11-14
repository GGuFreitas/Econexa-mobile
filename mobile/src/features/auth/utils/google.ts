import { ApiError } from '@services/ApiError';
import { mensagemDeErro } from '@shared/utils/mensagemDeErro';

export type AmbienteDoGoogle = {
  webClientId?: string;
  plataforma: string;
  noExpoGo: boolean;
};

export function podeOferecerGoogle({ webClientId, plataforma, noExpoGo }: AmbienteDoGoogle): boolean {
  if (!webClientId?.trim()) return false;
  if (plataforma === 'web') return false;
  return !noExpoGo;
}

export type MotivoDaFalhaDoGoogle =
  | 'indisponivel'
  | 'semPlayServices'
  | 'emAndamento'
  | 'semIdToken'
  | 'desconhecido';

export class FalhaDoGoogle extends Error {
  constructor(
    public readonly motivo: MotivoDaFalhaDoGoogle,
    detalhe?: string,
  ) {
    super(detalhe ?? motivo);
    this.name = 'FalhaDoGoogle';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

const PADRAO = 'Não foi possível entrar com o Google. Tente de novo.';

const MENSAGEM_POR_MOTIVO: Record<MotivoDaFalhaDoGoogle, string> = {
  indisponivel: 'O login com Google não está disponível nesta versão do app.',
  semPlayServices:
    'Para entrar com o Google, este aparelho precisa do Google Play Services atualizado.',
  emAndamento: 'O login com Google já está aberto. Conclua ou cancele antes de tentar de novo.',
  semIdToken: PADRAO,
  desconhecido: PADRAO,
};

export function mensagemDeErroDoGoogle(erro: unknown): string {
  if (erro instanceof FalhaDoGoogle) return MENSAGEM_POR_MOTIVO[erro.motivo];
  if (erro instanceof ApiError && erro.status === 401) {
    return 'O Google não confirmou sua conta. Tente de novo.';
  }
  if (erro instanceof ApiError) return mensagemDeErro(erro, PADRAO);
  return PADRAO;
}

export type AvisoDoGoogle = 'SENHA_DESATIVADA';

export type ExplicacaoDoAviso = { titulo: string; texto: string };

const EXPLICACAO_POR_AVISO: Record<AvisoDoGoogle, ExplicacaoDoAviso> = {
  SENHA_DESATIVADA: {
    titulo: 'Senha antiga desativada',
    texto:
      'Já existia uma conta com o seu e-mail, mas ele nunca tinha sido confirmado. Para ' +
      'proteger você, ligamos essa conta ao seu Google e desativamos a senha que havia nela. ' +
      'Se quiser voltar a entrar com senha, use "Esqueci minha senha" e crie uma nova.',
  },
};

export function explicacaoDoAviso(aviso?: string | null): ExplicacaoDoAviso | null {
  if (!aviso) return null;
  return EXPLICACAO_POR_AVISO[aviso as AvisoDoGoogle] ?? null;
}
