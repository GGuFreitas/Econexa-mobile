export type UserRole = 'citizen' | 'specialist' | 'admin';

export type PublicUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  vote_weight: number;
  email_verified: boolean;
  has_password: boolean;
};

export type Sessao = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
  user: PublicUser;
};

export type AvisoDeSessao = 'SENHA_DESATIVADA';

export type SessaoComAviso = Sessao & { aviso?: AvisoDeSessao };

export type CadastroInput = {
  nome: string;
  email: string;
  password: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RedefinicaoDeSenhaInput = {
  email: string;
  code: string;
  password: string;
};

export type ResultadoDaConfirmacao = 'confirmado' | 'ja_confirmado' | 'invalido';

export interface UsuarioRow {
  id: number;
  nome: string;
  email: string;
  role: string;
  peso_voto: number;
  email_verificado: boolean;
  tem_senha: boolean;
  bloqueado_em: Date | null;
  sessao_versao: number;
}

export interface CredenciaisRow extends UsuarioRow {
  senha: string | null;
}

export interface NovoUsuario {
  nome: string;
  email: string;
  senhaHash: string | null;
  emailVerificado: boolean;
}

export interface RefreshTokenEmitido {
  id: number;
  sessao_versao: number;
}

export interface RefreshTokenReivindicado {
  id: number;
  usuario_id: number;
}

export interface SituacaoDaCadeia {
  usuario_id: number;
  viva: boolean;
}

export interface CodigoReservado {
  id: number;
  codigo_hash: string;
}
