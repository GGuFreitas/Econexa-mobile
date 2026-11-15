import type { Credenciais, User } from '@store/authSlice';

export type ApiUser = {
  id: number;
  name: string;
  email: string;
  role: User['role'];
  vote_weight: number;
  email_verified: boolean;
};

export type SessaoDaApi = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
  user: ApiUser;
};

export function mapUser(u: ApiUser): User {
  return {
    id: String(u.id),
    name: u.name,
    email: u.email,
    role: u.role,
    vote_weight: u.vote_weight,
    email_verified: u.email_verified,
  };
}

export function credenciaisDaSessao(sessao: SessaoDaApi): Credenciais {
  return {
    user: mapUser(sessao.user),
    accessToken: sessao.accessToken,
    refreshToken: sessao.refreshToken,
  };
}
