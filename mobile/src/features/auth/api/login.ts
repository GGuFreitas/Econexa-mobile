import { api } from '@services/api';
import type { ApiUser } from '../helpers/mapUser';

export type LoginResponse = {
  message: string;
  token: string;
  user: ApiUser;
};

type LoginInput = { email: string; password: string };

export async function login(payload: LoginInput): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>('/auth/login', payload);
  return response.data;
}
