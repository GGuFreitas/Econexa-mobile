export type UserRole = 'citizen' | 'specialist' | 'admin';

export type PublicUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  vote_weight: number;
};

export type Sessao = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
  user: PublicUser;
};

export type CadastroInput = {
  nome: string;
  email: string;
  password: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export interface UsuarioRow {
  id: number;
  nome: string;
  email: string;
  role: string;
  peso_voto: number;
  bloqueado_em: Date | null;
  sessao_versao: number;
}

export interface CredenciaisRow extends UsuarioRow {
  senha: string;
}

export interface NovoUsuario {
  nome: string;
  email: string;
  senhaHash: string;
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
