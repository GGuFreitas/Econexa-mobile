export type UserRole = 'citizen' | 'specialist' | 'admin';

export type PublicUser = {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  vote_weight: number;
};

export type RegisterInput = {
  nome: string;
  email: string;
  password: string;
};

export type LoginInput = {
  email: string;
  password: string;
};
