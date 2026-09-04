import { api } from '@services/api';

export type RegisterInput = {
  nome: string;
  email: string;
  password: string;
};

export type RegisterResponse = {
  message: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: 'citizen' | 'specialist' | 'admin';
    vote_weight: number;
  };
};

export async function register(payload: RegisterInput): Promise<RegisterResponse> {
  const response = await api.post<RegisterResponse>('/auth/register', payload);
  return response.data;
}
